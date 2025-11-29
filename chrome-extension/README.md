# Recipe Reaper Chrome Extension

This extension adds a "Reap this recipe" button to your browser. When clicked, it opens your Recipe Reaper frontend’s Add Recipe page and pre-fills the URL textbox with the current page’s URL.

## Setup
1. Edit `popup.js` and set the `frontend` variable to your frontend URL (e.g., `http://localhost:5173`).
2. Load the `chrome-extension` folder as an unpacked extension in Chrome.
3. Click the extension icon and hit "Reap this recipe" on any recipe page.

## Notes
- No backend API is called from the extension.
- Works on any site.
- On click, opens your frontend’s Add Recipe page with the URL pre-filled as a query parameter.
- Your frontend should read the `url` query parameter and fill the textbox automatically.
