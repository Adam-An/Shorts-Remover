// Debounce timer
let debounceTimer = null;
let isEnabled = true; // Track if extension is enabled

// Load enabled state from storage on initialization
chrome.storage.sync.get(['shortsRemoverEnabled'], (result) => {
  isEnabled = result.shortsRemoverEnabled !== false; // Default to true
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleExtension') {
    isEnabled = request.enabled;
    if (isEnabled) {
      cleanYouTubeDom();
    }
  }
});

// --- Helpers -------------------------------------------------------------
// YouTube's ytd-* components don't use real Shadow DOM, so it's normal
// for several unrelated components to render their own element with the
// SAME id at the same time (e.g. many "#contents" / "#items" nodes can
// exist in the document simultaneously - one per shelf/section).
// document.getElementById() only ever returns the FIRST match in
// document order, and which one happens to be first changes depending on
// what page you're on (home, search results, a watch page, etc). That
// mismatch is the main reason cleanup silently did nothing after
// navigating around - it kept inspecting the wrong "#contents"/"#items"
// node. This helper grabs every match instead of just the first.
function getAllById(id) {
  return document.querySelectorAll(`[id="${id}"]`);
}
/**
// Function to remove the second child with the specified class under any #items container
function removeSecondChildFromItems() {
  getAllById('items').forEach((itemsElement) => {
    // Find all children with the class "style-scope ytd-guide-section-renderer"
    const children = itemsElement.querySelectorAll('.style-scope.ytd-guide-section-renderer');

    if (children.length >= 2) {
      children[1].remove();
    }
  });
} **/


// Function to remove the "Shorts" entry from the guide (sidebar) under any #items container
function removeSecondChildFromItems() {
  getAllById('items').forEach((itemsElement) => {
    // Target the Shorts link directly instead of assuming it's always the
    // 2nd child - that position shifts if YouTube reorders the sidebar
    // (e.g. when "History"/"Your videos" entries show up or not).
    const shortsLink = itemsElement.querySelector('a#endpoint[title="Shorts"]');

    if (shortsLink) {
      // Remove the whole guide entry (the row), not just the inner <a>,
      // otherwise an empty/blank row is left behind in the sidebar.
      const guideEntry = shortsLink.closest('ytd-guide-entry-renderer') || shortsLink;
      guideEntry.remove();
    }
  });
}


// Function to remove all ytd-rich-section-renderer elements under any #contents container
function removeRichSectionRenderers() {
  getAllById('contents').forEach((contentsElement) => {
    const richSectionRenderers = contentsElement.querySelectorAll('ytd-rich-section-renderer');
    richSectionRenderers.forEach((element) => element.remove());
  });
}

// Function to remove all grid-shelf-view-model elements under any #contents container
function removeGridShelfRenderers() {
  getAllById('contents').forEach((contentsElement) => {
    const gridSectionRenderers = contentsElement.querySelectorAll('grid-shelf-view-model');
    gridSectionRenderers.forEach((element) => element.remove());
  });
}

// Remove all grid shelf rows inside any #contents container
function removeSectionRenderers() {
  getAllById('contents').forEach((contentsElement) => {
    const shelfRows = contentsElement.querySelectorAll(
      '.ytGridShelfViewModelGridShelfRow.ytd-item-section-renderer'
    );
    shelfRows.forEach((element) => element.remove());
  });
}

// Function to run the DOM modifications
function cleanYouTubeDom() {
  if (!isEnabled) return;

  removeSecondChildFromItems();
  removeRichSectionRenderers();
  removeSectionRenderers();
  removeGridShelfRenderers();
}

// Debounced cleanup function to avoid running too frequently
function debouncedCleanup() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    cleanYouTubeDom();
  }, 100); // Wait 100ms after DOM changes stop before running
}

// Run when the page loads
window.addEventListener('load', () => {
  cleanYouTubeDom();
});

// Also run immediately in case the page is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cleanYouTubeDom);
} else {
  cleanYouTubeDom();
}

// --- SPA navigation handling ---------------------------------------------
// YouTube never does a real page load when you click around (search,
// home, a video, etc.) - it's all client-side routing, so 'load' and
// 'DOMContentLoaded' only ever fire once, on the very first visit.
// YouTube's own router dispatches custom events on every navigation,
// which is the reliable hook to use instead of relying purely on
// MutationObserver timing.
window.addEventListener('yt-navigate-start', () => {
  cleanYouTubeDom();
});

window.addEventListener('yt-navigate-finish', () => {
  // Run immediately, then a few follow-up passes - YouTube keeps
  // streaming shelves/renderers in asynchronously for a bit after the
  // navigation event itself fires, so one pass right away isn't always enough.
  cleanYouTubeDom();
  setTimeout(cleanYouTubeDom, 300);
  setTimeout(cleanYouTubeDom, 800);
  setTimeout(cleanYouTubeDom, 1500);
});

// Watch for dynamic content changes (YouTube loads content dynamically)
const observer = new MutationObserver(debouncedCleanup);

const config = {
  childList: true,
  subtree: true
};

observer.observe(document.body, config);

// Also listen for scroll events to catch lazy-loaded content
window.addEventListener('scroll', () => {
  debouncedCleanup();
}, { passive: true });

// Listen for wheel events as a backup
window.addEventListener('wheel', () => {
  debouncedCleanup();
}, { passive: true });

// Periodically check for new elements (every 2 seconds as a safety net)
setInterval(() => {
  cleanYouTubeDom();
}, 2000);
