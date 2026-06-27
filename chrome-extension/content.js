// ── Iframe — post content up to the parent frame ─────────────────────────────
if (window !== window.top) {
  const postToParent = () => {
    const text = (document.body && document.body.innerText && document.body.innerText.trim()) || "";
    if (text.length > 50) {
      try {
        window.parent.postMessage({ type: "SC_FRAME_CONTENT", text: text.slice(0, 3000) }, "*");
      } catch (e) {}
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
  window.addEventListener("message", function(e) {
    if (e.data && e.data.type === "SC_FRAME_CONTENT" && e.data.text) {
      iframeContent = e.data.text;
    }
  });

  const extractPageText = () => {
    const host = window.location.hostname;

    if (host === "mail.google.com") {
      const subjectEl = document.querySelector("h2.hP");
      const senderEl  = document.querySelector(".gD");
      const senderAlt = document.querySelector(".go");
      const bodyEl    = document.querySelector(".a3s.aiL") || document.querySelector(".a3s") || document.querySelector(".ii.gt");
      const subject   = (subjectEl && subjectEl.innerText && subjectEl.innerText.trim()) || "";
      const sender    = (senderEl && senderEl.getAttribute("email")) || (senderAlt && senderAlt.innerText && senderAlt.innerText.trim()) || "";
      const body      = (bodyEl && bodyEl.innerText && bodyEl.innerText.trim()) || "";
      if (body) {
        return ("Email" + (subject ? " — Subject: " + subject : "") + (sender ? " — From: " + sender : "") + "\n\n" + body).slice(0, 2500);
      }
    }

    if (host.includes("outlook.") || host.includes("office.com")) {
      const subjectEl  = document.querySelector('[aria-label*="Subject"]') || document.querySelector('[role="heading"][class*="subject"]');
      const bodyEl     = document.querySelector('[aria-label="Message body"]') || document.querySelector('[role="document"]');
      const subject    = (subjectEl && subjectEl.innerText && subjectEl.innerText.trim()) || "";
      const body       = iframeContent || (bodyEl && bodyEl.innerText && bodyEl.innerText.trim()) || "";
      if (body) {
        return ("Email" + (subject ? " — Subject: " + subject : "") + "\n\n" + body).slice(0, 2500);
      }
    }

    if (host.includes("atlassian.net") || host.includes("jira.")) {
      const titleEl  = document.querySelector('[data-testid="issue.views.issue-base.foundation.summary.heading"]') || document.querySelector("#summary-val");
      const descEl   = document.querySelector('[data-testid="issue.views.field.rich-text.description"]') || document.querySelector("#description-val");
      const statusEl = document.querySelector('[data-testid="issue.fields.status.status-field-wrapper"] span') || document.querySelector("#status-val");
      const title    = (titleEl && titleEl.innerText && titleEl.innerText.trim()) || "";
      const desc     = (descEl && descEl.innerText && descEl.innerText.trim()) || "";
      const status   = (statusEl && statusEl.innerText && statusEl.innerText.trim()) || "";
      if (title || desc) {
        return ("Jira Issue" + (title ? ": " + title : "") + (status ? " [" + status + "]" : "") + (desc ? "\n\n" + desc : "")).slice(0, 2500);
      }
    }

    const mainEl = document.querySelector("main") || document.querySelector("article") || document.querySelector("[role='main']") || document.body;
    return ((mainEl && mainEl.innerText) || "").replace(/\s+/g, " ").trim().slice(0, 2500);
  };

  chrome.runtime.onMessage.addListener(function(message, _sender, sendResponse) {
    if (message.type === "GET_PAGE_CONTEXT") {
      const sel = window.getSelection();
      sendResponse({
        title:    document.title,
        url:      window.location.href,
        selected: (sel && sel.toString() && sel.toString().trim()) || "",
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
    chrome.runtime.sendMessage({ type: "AUTH_TOKEN_RECEIVED", token }, function(res) {
      if (res && res.ok) setTimeout(function() { window.close(); }, 600);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryExtractToken);
  } else {
    tryExtractToken();
  }
}
