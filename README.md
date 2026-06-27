# Shorts Remover - Chrome Extension

This Chrome extension removes YouTube Shorts and other unwanted elements from YouTube pages automatically.

## Features

- **Removes the second child** with class `style-scope ytd-guide-section-renderer` from the element with id `items`
- **Removes all elements** with tag `ytd-rich-section-renderer` from the element with id `contents`
- **Scroll Detection** - Automatically removes new elements as you scroll through YouTube
- Monitors DOM changes and reapplies modifications when content is dynamically loaded
- Periodic safety checks to catch any missed elements

## Installation

1. **Clone or download this extension folder** to your computer
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in the top right corner)
4. **Click "Load unpacked"** and select the extension folder
5. **Done!** The extension will now run on YouTube pages

## How it works

- `manifest.json` - Configuration file that tells Chrome about the extension
- `content.js` - Script that runs on YouTube pages and modifies the DOM
- `icons/` - Extension icons in different sizes

The extension:
1. Runs when the page loads
2. Removes the specified elements
3. Watches for scroll events to catch newly loaded content
4. Monitors DOM changes and re-runs the cleanup when new content appears
5. Periodically checks for elements that may have been missed

## Troubleshooting

- If elements aren't being removed, open Chrome DevTools (F12) and check the console for messages
- YouTube's DOM structure may change - if the extension stops working, the element IDs or classes may have changed
- You can modify `content.js` to target different elements by adjusting the selectors

## Notes

- This extension only runs on `https://www.youtube.com/*`
- It does not collect any data or connect to any external services
- Uses Manifest V3 (the latest Chrome extension API)
- Includes scroll detection for dynamic content loading
