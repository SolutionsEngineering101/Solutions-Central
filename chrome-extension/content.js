// ── Page context extraction ───────────────────────────────────────────────────

function extractPageText() {
  const url = window.location.href;
  const host = window.location.hostname;

  // Gmail — email body is in .a3s or .ii.gt, subject in h2.hP
  if (host === "mail.google.com") {
    const subject = document.querySelector("h2.hP")?.innerText?.trim() ?? "";
    const sender  = document.querySelector(".gD")?.getAttribute("email") ??
                    document.querySelector(".go")?.innerText?.trim() ?? "";
    const body    = document.querySelector(".a3s.aiL, .a3s, .ii.gt .a3s")?.innerText?.trim()
                 ?? document.querySelector(".ii.gt")?.innerText?.trim() ?? "";
    if (body) {
      return `Email${subject ? ` — Subject: ${subject}` : ""}${sender ? ` — From: ${sender}` : ""}\n\n${body}`.slice(0, 2500);
    }
  }

  // Outlook Web (outlook.office.com / outlook.live.com)
  if (host.includes("outlook.") || host.includes("office.com")) {
    const subject = document.querySelector('[aria-label*="Subject"], .allowTextSelection[role="heading"]')?.innerText?.trim()
                 ?? document.querySelector("._3Uqu4")?.innerText?.trim() ?? "";
    const body    = document.querySelector('[aria-label="Message body"], .allowTextSelection[role="document"], .ReadingPaneContent')?.innerText?.trim()
                 ?? document.querySelector('[data-testid="message-body"]')?.innerText?.trim() ?? "";
    if (body) {
      return `Email${subject ? ` — Subject: ${subject}` : ""}\n\n${body}`.slice(0, 2500);
    }
  }

  // Jira issue page
  if (host.includes("atlassian.net") || host.includes("jira.")) {
    const title   = document.querySelector('[data-testid="issue.views.issue-base.foundation.summary.heading"], h1[data-testid]')?.innerText?.trim()
                 ?? document.querySelector("#summary-val, .issue-header-content h1")?.innerText?.trim() ?? "";
    const desc    = document.querySelector('[data-testid="issue.views.field.rich-text.description"], #description-val')?.innerText?.trim() ?? "";
    const status  = document.querySelector('[data-testid="issue.fields.status.status-field-wrapper"] span, #status-val')?.innerText?.trim() ?? "";
    if (title || desc) {
      return `Jira Issue${title ? `: ${title}` : ""}${status ? ` [${status}]` : ""}${desc ? `\n\n${desc}` : ""}`.slice(0, 2500);
    }
  }

  // Generic fallback — best content area heuristic
  const mainEl =
    document.querySelector("main, article, [role='main'], .main-content") ??
    document.body;
  return (mainEl.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 2500);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_PAGE_CONTEXT") {
    const title    = document.title;
    const url      = window.location.href;
    const selected = (window.getSelection()?.toString() ?? "").trim();
    const text     = extractPageText();
    sendResponse({ title, url, selected, text });
    return true;
  }
});

// ── Auth callback — runs on the /extension-auth page ─────────────────────────
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
