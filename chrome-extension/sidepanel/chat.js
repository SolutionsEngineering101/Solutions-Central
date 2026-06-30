import { DASHBOARD_URL } from "../config.js";

// ── State ─────────────────────────────────────────────────────────────────────

let token = null;
let userName = "";
let pageContext = null;
let history = [];       // { role: 'user'|'assistant', text: string }[]
let memory = [];        // session memory facts extracted by the backend
let isLoading = false;

// ── DOM refs ──────────────────────────────────────────────────────────────────

const authScreen     = document.getElementById("auth-screen");
const chatScreen     = document.getElementById("chat-screen");
const authBtn        = document.getElementById("auth-btn");
const signoutBtn     = document.getElementById("signout-btn");
const messagesEl     = document.getElementById("messages");
const inputEl        = document.getElementById("input");
const sendBtn        = document.getElementById("send-btn");
const contextLabel   = document.getElementById("context-label");
const contextBar     = document.getElementById("context-bar");
const welcomeName    = document.getElementById("welcome-name");

// Invite refs
const inviteStep      = document.getElementById("invite-step");
const inviteNameInput = document.getElementById("invite-name");
const inviteCodeInput = document.getElementById("invite-code");
const inviteVerifyBtn = document.getElementById("invite-verify-btn");
const inviteError     = document.getElementById("invite-error");

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  // Load token and history from storage
  const stored = await chrome.storage.sync.get(["scToken", "scUser"]);
  token = stored.scToken ?? null;
  userName = stored.scUser ?? "";

  const local = await chrome.storage.local.get(["scHistory", "scMemory", "scHistoryTs"]);
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const historyAge = local.scHistoryTs ? Date.now() - local.scHistoryTs : Infinity;
  if (historyAge > ONE_DAY) {
    history = [];
    memory = [];
    await chrome.storage.local.remove(["scHistory", "scMemory", "scHistoryTs"]);
  } else {
    history = local.scHistory || [];
    memory = local.scMemory || [];
  }

  if (token) {
    showChat();
  } else {
    showAuth();
  }

  // Listen for auth completion triggered by background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "AUTH_COMPLETE") {
      chrome.storage.sync.get(["scToken", "scUser"]).then((s) => {
        token = s.scToken ?? null;
        userName = s.scUser ?? "";
        if (token) showChat();
      });
    }
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

authBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: `${DASHBOARD_URL}/extension-auth` });
});

signoutBtn.addEventListener("click", async () => {
  await chrome.storage.sync.remove(["scToken", "scUser"]);
  await chrome.storage.local.remove(["scHistory", "scMemory"]);
  token = null;
  history = [];
  memory = [];
  showAuth();
});

// ── Invite code flow ──────────────────────────────────────────────────────────

inviteVerifyBtn.addEventListener("click", verifyInvite);
inviteCodeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") verifyInvite(); });

async function verifyInvite() {
  const name = inviteNameInput.value.trim();
  const code = inviteCodeInput.value.trim();
  if (!code) return;
  inviteVerifyBtn.disabled = true;
  inviteVerifyBtn.textContent = "Verifying…";
  inviteError.classList.add("hidden");

  try {
    const res = await fetch(`${DASHBOARD_URL}/api/extension/invite/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });
    const json = await res.json();
    if (!json.ok) {
      inviteError.textContent = json.error || "Invalid invite code";
      inviteError.classList.remove("hidden");
      return;
    }
    await chrome.storage.sync.set({ scToken: json.token, scUser: name || "Sales" });
    token = json.token;
    showChat();
  } catch {
    inviteError.textContent = "Network error — try again";
    inviteError.classList.remove("hidden");
  } finally {
    inviteVerifyBtn.disabled = false;
    inviteVerifyBtn.textContent = "Verify";
  }
}

// ── Show screens ──────────────────────────────────────────────────────────────

function showAuth() {
  authScreen.classList.remove("hidden");
  chatScreen.classList.add("hidden");
  inviteCodeInput.value = "";
  inviteNameInput.value = "";
  inviteError.classList.add("hidden");
}

async function showChat() {
  authScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");

  // Set welcome name from token payload
  if (!userName && token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")));
      userName = payload.name || "there";
      await chrome.storage.sync.set({ scUser: userName });
    } catch { userName = "there"; }
  }

  welcomeName.textContent = `Hello, ${userName.split(" ")[0]}`;

  // Restore conversation history
  renderHistory();

  // Get page context
  await refreshPageContext();
}

// ── Page context ──────────────────────────────────────────────────────────────

async function refreshPageContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("no tab");

    // Try messaging the existing content script first
    let ctx = null;
    try {
      ctx = await chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_CONTEXT" });
    } catch {
      // Content script not injected yet (e.g. Outlook soft navigation) — inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ["content.js"],
        });
        await new Promise(function(r) { setTimeout(r, 400); });
        ctx = await chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_CONTEXT" });
      } catch {
        throw new Error("injection failed");
      }
    }

    pageContext = ctx;
    const domain = new URL(pageContext.url).hostname.replace(/^www\./, "");
    contextLabel.textContent = pageContext.title || domain;
    contextBar.classList.remove("no-context");
  } catch {
    pageContext = null;
    contextLabel.textContent = "No page context";
    contextBar.classList.add("no-context");
  }
}

// Update context when tab changes
chrome.tabs.onActivated.addListener(() => {
  if (!token) return;
  refreshPageContext();
});

chrome.tabs.onUpdated.addListener((_id, info) => {
  if (info.status === "complete" && token) refreshPageContext();
});

// ── Chat ──────────────────────────────────────────────────────────────────────

inputEl.addEventListener("input", () => {
  sendBtn.disabled = !inputEl.value.trim() || isLoading;
  // Auto-resize textarea
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) send();
  }
});

sendBtn.addEventListener("click", send);

// Suggestion chips
messagesEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip[data-prompt]");
  if (!chip) return;
  inputEl.value = chip.dataset.prompt;
  send();
});

async function send() {
  const query = inputEl.value.trim();
  if (!query || isLoading) return;

  inputEl.value = "";
  inputEl.style.height = "auto";
  sendBtn.disabled = true;
  isLoading = true;

  // Remove welcome state if present
  const welcome = messagesEl.querySelector(".welcome");
  if (welcome) welcome.remove();

  appendMessage("user", query);
  const loadingEl = appendLoading();

  try {
    // Build page context string
    let pageCtxString = undefined;
    if (pageContext) {
      const parts = [`Page: ${pageContext.title}`, `URL: ${pageContext.url}`];
      if (pageContext.selected) parts.push(`Selected text: ${pageContext.selected}`);
      if (pageContext.text) parts.push(`\nPage content:\n${pageContext.text}`);
      pageCtxString = parts.join("\n");
    }

    const res = await fetch(`${DASHBOARD_URL}/api/knowledge/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        history: history.map((m) => ({ role: m.role, text: m.text })),
        memory,
        pageContext: pageCtxString,
      }),
    });

    loadingEl.remove();

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      if (res.status === 401) {
        // Token expired — reset auth
        await chrome.storage.sync.remove(["scToken", "scUser"]);
        token = null;
        showAuth();
        return;
      }
      appendError(err.error || "Request failed");
      return;
    }

    const data = await res.json();
    appendMessage("assistant", data.answer, data.sources ?? []);

    // Persist history (last 10 turns to keep storage small)
    history.push({ role: "user", text: query }, { role: "assistant", text: data.answer });
    if (history.length > 20) history = history.slice(-20);

    // Accumulate memory facts
    if (Array.isArray(data.newFacts)) {
      memory = [...memory, ...data.newFacts].slice(-20);
    }

    await chrome.storage.local.set({ scHistory: history, scMemory: memory, scHistoryTs: Date.now() });

  } catch (err) {
    loadingEl.remove();
    appendError(err.message || "Network error");
  } finally {
    isLoading = false;
    sendBtn.disabled = !inputEl.value.trim();
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderHistory() {
  // Clear everything except the welcome block
  Array.from(messagesEl.querySelectorAll(".msg")).forEach((el) => el.remove());
  if (history.length > 0) {
    messagesEl.querySelector(".welcome")?.remove();
    history.forEach((m) => {
      if (m.role === "user") appendMessage("user", m.text);
      else appendMessage("assistant", m.text, []);
    });
  }
}

function appendMessage(role, text, sources = []) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  const label = document.createElement("div");
  label.className = "msg-role";
  label.textContent = role === "user" ? "You" : "SC Assistant";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = renderMarkdown(text);

  wrap.appendChild(label);
  wrap.appendChild(bubble);

  if (sources.length > 0) {
    const srcWrap = document.createElement("div");
    srcWrap.className = "sources";
    sources.forEach((s) => {
      const a = document.createElement("a");
      a.className = "source-chip";
      a.href = s.url || "#";
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = `↗ ${s.title || s.id}`;
      srcWrap.appendChild(a);
    });
    wrap.appendChild(srcWrap);
  }

  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrap;
}

function appendLoading() {
  const wrap = document.createElement("div");
  wrap.className = "msg assistant";
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = `<div class="loading-dots">
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
  </div>`;
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrap;
}

function appendError(msg) {
  const el = document.createElement("div");
  el.className = "error-msg";
  el.textContent = msg;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Minimal markdown: **bold**, *italic*, `code`, - list items, \n\n paragraphs
function renderMarkdown(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "• $1")
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.+)$/, "<p>$1</p>");
}

// ── Start ─────────────────────────────────────────────────────────────────────
init();
