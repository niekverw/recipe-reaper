document.getElementById('reap-btn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = '';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    // Change this to your frontend add-recipe page
    const frontend = 'https://recipereaper.app';
    const addRecipeUrl = frontend + '/add-recipe?url=' + encodeURIComponent(url);
    chrome.tabs.create({ url: addRecipeUrl });
    window.close();
  } catch (e) {
    status.textContent = 'Failed to open add recipe page.';
  }
});
