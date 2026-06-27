// ── Iframe — post content up to the parent frame ─────────────────────────────
if (window !== window.top) {
  const postToParent = () => {
    const text = document.body?.innerText?.trim() ?? "";
    if (text.length > 50) {
      try {
        window.parent.postMessage({ type: "SC_FRAME_CONTENT", text: text.slice(0, 3000) }, "*");
      } catch {}
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", postToParent);
  } else {
    postToParent();
  }
} else {
  // ── Main frame ──────────────────────────────────────────────────────────────

  let iframeContent = "";
  window.addEventListener("message", (e) => {
    if (e.data?.type === "SC_FRAME_CONTENT" && e.data.text) {
      iframeContent = e.data.text;
    }
  });

  const extractPageText = () => {
    const host = window.location.hostname;

    if (host === "mail.google.com") {
      const subject = document.querySelector("h2.hP")?.innerText?.trim() ?? "";
      const sender  = document.querySelector(".gD")?.getAttribute("email")
                   ?? document.querySelector(".go")?.innerText?.trim() ?? "";
      const body    = document.querySelector(".a3s.aiL, .a3s, .ii.gt .a3s")?.innerText?.trim()
                   ?? document.querySelector(".ii.gt")?.innerText?.trim() ?? "";
      if (body) {
        return `Email${subject ? ` — Subject: ${subject}` : ""}${sender ? ` — From: ${sender}` : ""}\n\n${body}`.slice(0, 2500);
      }
    }

    if (host.includes("outlook.") || host.includes("office.com")) {
      const subject = document.querySelector('[aria-label*="Subject"]')?.innerText?.trim()
                   ?? document.querySelector('[role="heading"][class*="subject"]')?.innerText?.trim() ?? "";
      const body = iframeContent
                || document.querySelector('[aria-label="Message body"], [role="document"]')?.innerText?.trim() ?? "";
      if (body) {
        return `Email${subject ? ` — Subject: ${subject}` : ""}\n\n${body}`.slice(0, 2500);
      }
    }

    if (host.includes("atlassian.net") || host.includes("jira.")) {
      const title  = document.querySelector('[data-testid="issue.views.issue-base.foundation.summary.heading"]')?.innerText?.trim()
                  ?? document.querySelector("#summary-val")?.innerText?.trim() ?? "";
      const desc   = document.querySelector('[data-testid="issue.views.field.rich-text.description"], #description-val')?.innerText?.trim() ?? "";
      const status = document.querySelector('[data-testid="issue.fields.status.status-field-wrapper"] span, #status-val')?.innerText?.trim() ?? "";
      if (title || desc) {
        return `Jira Issue${title ? `: ${title}` : ""}${status ? ` [${status}]` : ""}${desc ? `\n\n${desc}` : ""}`.slice(0, 2500);
      }
    }

    const mainEl = document.querySelector("main, article, [role='main'], .main-content") ?? document.body;
    return (mainEl.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 2500);
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_PAGE_CONTEXT") {
      sendResponse({
        title:    document.title,
        url:      window.location.href,
        selected: (window.getSelection()?.toString() ?? "").trim(),
        text:     extractPageText(),
      });
      return true;
    }
  });

  const tryExtractToken = () => {
    const el = document.getElementById("sc-extension-token");
    if (!el) return;
    const token = el.dataset.token;
    if (!token) return;
    chrome.runtime.sendMessage({ type: "AUTH_TOKEN_RECEIVED", token }, (res) => {
      if (res?.ok) setTimeout(() => window.close(), 600);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryExtractToken);
  } else {
    tryExtractToken();
  }
}
