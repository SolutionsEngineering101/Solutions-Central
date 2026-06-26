// ── Page context requests from side panel ───────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_PAGE_CONTEXT") {
    const title = document.title;
    const url = window.location.href;
    const selected = (window.getSelection()?.toString() ?? "").trim();
    const mainEl =
      document.querySelector("main, article, [role='main'], .main-content") ??
      document.body;
    const text = (mainEl.innerText ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2500);
    sendResponse({ title, url, selected, text });
    return true;
  }
});

// ── Auth callback — runs on the /extension-auth page ────────────────────────
function tryExtractToken() {
  const el = document.getElementById("sc-extension-token");
  if (!el) return;
  const token = el.dataset.token;
  if (!token) return;
  chrome.runtime.sendMessage({ type: "AUTH_TOKEN_RECEIVED", token }, (res) => {
    if (res?.ok) setTimeout(() => window.close(), 600);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", tryExtractToken);
} else {
  tryExtractToken();
}
