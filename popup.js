// Initialize popup when it opens
document.addEventListener('DOMContentLoaded', () => {
  const enableToggle = document.getElementById('enableToggle');
  const statusText   = document.getElementById('statusText');

  // Wire up the visual toggle to the hidden checkbox (CSP-safe – no inline handlers)
  document.getElementById('toggleVisual').addEventListener('click', () => {
    enableToggle.click();
  });

  // Load saved state – restore UI without triggering the slash animation
  chrome.storage.sync.get(['shortsRemoverEnabled'], (result) => {
    const isEnabled = result.shortsRemoverEnabled !== false; // Default to true
    enableToggle.checked = isEnabled;
    updateStatusText(isEnabled);
    updateToggleVisual(isEnabled);
    updateFeatures(isEnabled);
    // intentionally no fireSlash() here – slash is only for user-triggered toggles
  });

  // Listen for toggle changes (fired by the hidden checkbox)
  enableToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;

    // Save state to storage
    chrome.storage.sync.set({ shortsRemoverEnabled: isEnabled });

    // Update all UI elements + fire the slash only on real user interaction
    syncUI(isEnabled);

    // Notify content scripts of the change
    chrome.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'toggleExtension',
          enabled: isEnabled
        }).catch(() => {
          // Tab might not have content script loaded yet – that's OK
        });
      });
    });
  });
});

// Sync all visual elements to the current enabled state
function syncUI(isEnabled) {
  updateStatusText(isEnabled);
  updateToggleVisual(isEnabled);
  updateFeatures(isEnabled);
  fireSlash();
}

// Update the status text and its color class
function updateStatusText(isEnabled) {
  const statusText = document.getElementById('statusText');
  statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
  statusText.className   = isEnabled ? 'on' : 'off';
}

// Sync the visual toggle div to match the checkbox state
function updateToggleVisual(isEnabled) {
  const toggleVisual = document.getElementById('toggleVisual');
  if (isEnabled) {
    toggleVisual.classList.add('on');
  } else {
    toggleVisual.classList.remove('on');
  }
}

// Dim/brighten the feature list based on state
function updateFeatures(isEnabled) {
  const feats = document.getElementById('featsEl');
  if (isEnabled) {
    feats.classList.add('active');
  } else {
    feats.classList.remove('active');
  }
}

// Trigger the diagonal slash sweep animation
function fireSlash() {
  const slash = document.getElementById('slashEl');
  if (!slash) return;
  slash.classList.remove('fire');
  void slash.offsetWidth; // force reflow so animation restarts
  slash.classList.add('fire');
}
