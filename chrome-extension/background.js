// Open the side panel when the toolbar icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Relay messages from content scripts to the side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "AUTH_TOKEN_RECEIVED") {
    chrome.storage.sync.set({ scToken: message.token }, () => {
      sendResponse({ ok: true });
      // Wake the side panel so it re-checks auth state
      chrome.runtime.sendMessage({ type: "AUTH_COMPLETE" }).catch(() => {});
    });
    return true; // keep channel open for async sendResponse
  }
});
