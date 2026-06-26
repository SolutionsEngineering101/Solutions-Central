# Solutions Central — Chrome Extension

A side-panel assistant for the Solutions Engineering team. Click the extension icon on any tab to open an AI chat grounded in your team's playbooks, blueprints, and past solution requests.

## Setup

### 1. Configure the dashboard URL

Edit `config.js` and set `DASHBOARD_URL` to your deployed dashboard:

```js
export const DASHBOARD_URL = "https://your-dashboard.vercel.app";
```

Leave it as `http://localhost:3000` for local development.

### 2. Add the environment variable to the dashboard

In `dashboard/.env.local`, add:

```
EXTENSION_JWT_SECRET=<run: openssl rand -base64 32>
```

### 3. Load the extension in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder

### 4. Sign in

Click the extension icon in the Chrome toolbar. A side panel opens. Click **Sign in with GitHub** — this opens the dashboard login page. After GitHub OAuth completes, the tab closes automatically and the side panel is ready.

## Auth flow

1. Extension opens `${DASHBOARD_URL}/extension-auth` in a new tab
2. Dashboard checks NextAuth session — redirects to GitHub OAuth if needed
3. After login, the page renders a signed JWT as a hidden DOM element
4. Extension content script reads the JWT and stores it in `chrome.storage.sync`
5. The tab closes; the side panel unlocks
6. All `/api/knowledge/chat` calls include the JWT as `Authorization: Bearer <token>`
7. Tokens expire after 7 days — you'll be prompted to re-authenticate

## Page context

The assistant automatically reads the current tab's page content (title, URL, visible text, selected text). It's included in every query so you can ask questions like "does this client's use case match any of our blueprints?" without copying anything.

## Conversation history

Conversation history and session memory (facts the assistant learns) persist across panel opens via `chrome.storage.local`. History is capped at the last 10 turns to keep prompts lean.
