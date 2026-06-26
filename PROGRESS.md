# Solutions-Central — Setup Progress

> Read this at the start of each session to pick up where we left off.
> Tell Claude: "read the progress file and continue"

---

## Repo Location
`~/Documents/Solutions_Engineering/solutions-intelligence-platform` → **NOT this one**
`~/Documents/Solutions_Engineering/solutions-engineering` → **THIS is Solutions-Central**

GitHub: `https://github.com/SolutionsEngineering101/Solutions-Central.git`
Dashboard working directory: `~/Documents/Solutions_Engineering/solutions-engineering/dashboard/`

---

## Context
Building a central GitHub repository for the 6-person Solutions Engineering team at Vantage Circle.
The repo serves as: intake hub, documentation library, team workspace, playbook, pre-built solutions store, and data source for a Next.js dashboard website.

**Team:**
- Hemanga Bharadwaj
- Pankaj Chakrabarty
- Bhargav Nath
- Nilimpa Nizara Bora
- Garima Kayal
- Kongkana Bayan

---

## Completed

- [x] **1. Fixed broken folder structure** — `documents/`, `product-information/`, `project-management/` had brace-expansion strings as literal folder names. Replaced with correct individual subdirectories.
- [x] **2. Microsoft Graph API Forms puller** — Python-based solution replacing Power Automate. Files: `scripts/pull_forms.py`, `scripts/GRAPH_API_SETUP.md`, `scripts/requirements.txt`, `scripts/.env.example`, `.github/workflows/pull-forms.yml`. Auth: device code flow → refresh token stored as GitHub secret.
- [x] **3. Clean up Confluence references** — Deleted `sync-confluence.sh`, updated `intake/confluence-sync/README.md`.
- [x] **4. Scaffold `skills/` folder** — `skills/member/` (6 profiles + `_template.md`). Bhargav's profile pre-filled.
- [x] **6. Build dashboard website** — `dashboard/` subfolder. Next.js App Router + Tailwind + NextAuth (GitHub OAuth) + Octokit.
- [x] **7. QA pass on all 7 dashboard pages** — Fixed: YAML parse crash on `/pipeline` (malformed frontmatter), Sprint page always showing empty (wrong JSON key `goal` vs `goals[]`), stale `.next` build cache referencing deleted pipeline page.
- [x] **8. Replace Pipeline Kanban with Solution Requests table** — New route `/solution-requests`. Searchable grid with columns: Solution ID (indigo mono), Client, Department, Feature, Status. Click row → sticky side panel with full details. Handles both old (`client`) and new Graph API (`client_name`, `feature_name`) frontmatter formats. Sidebar label changed from "Pipeline" to "Solution Requests".
- [x] **9. Overview page — live status counts** — Fetches all intake forms, counts by status, shows proportional color bar + per-status cards (Solution Given Closed = emerald, Open = amber, To Product Closed = indigo, Rejected = red). Recent Requests panel shows last 5 submissions.
- [x] **10. Port Pankaj's Solutions-Tracking-Dashboard (Option B)** — Vite/React app cloned from `PankajC-ai/Solutions-Tracking-Dashboard`, components ported into Next.js as dark-themed suite mounted at `/sprint` (nav: "Project Tracker"). 10 components created:
  - `components/portfolio/PortfolioTracker.tsx` — root client component, localStorage (`stt_projects_v1`), screen state management
  - `components/portfolio/DashboardHome.tsx` — KPI cards, health circle, active projects, Recharts LineChart
  - `components/portfolio/ProjectDetail.tsx` — flat table, resizable columns, at-risk filter, bulk delete, item detail modal
  - `components/portfolio/CSVUpload.tsx` — 3-step drag-drop wizard, date parsing, status mapping, sample template download
  - `components/portfolio/StatusBadge.tsx`, `HealthScoreBadge.tsx`, `HealthScoreModal.tsx`, `InlineStatusEditor.tsx`
  - `components/portfolio/types.ts`, `utils/healthScoring.ts`, `utils/dateUtils.ts`
  - Primary merge key: `slNo`. Upsert by slNo across projects on CSV upload.
  - recharts installed for completion trend chart.
- [x] **11. Confluence integration** — `/confluence` route + nav item ("Confluence", Cloud icon). Reads and writes to Confluence page 567050244 (`Solutions Dev Project Tracker`) via REST API v2. Features: dark-themed table display, status auto-badges, Add Row form, inline row editing. API proxy at `/api/confluence` (GET + PUT) keeps credentials server-side.
- [x] **12. Project Tracker redesign (Confluence-native)** — Replaced CSV/localStorage-based PortfolioTracker with two-route system:
  - `/sprint` → `SprintDashboard`: KPI strip (Total/In Progress/Done/Overdue), Portfolio Health circle, Status Breakdown bar chart, Confluence preview card (mini KPIs + recent tickets + status pills), Recently Completed (sorted by Actual Release Date), Currently In Progress. All metrics from live Confluence data.
  - `/sprint/tracker` → `ProjectTracker`: full table with search, filter by status, column sort, density toggle, inline edit, delete row (with confirm), add row. All writes back to Confluence.
  - Clicking the Confluence card navigates from dashboard → full table.
  - `lib/confluence.ts` extended with `deleteTableRow`.
  - API route handles `delete_row` action.
  - Status column detection prioritises "Overall Status" over Backend/Frontend/QA status columns.
  - Total count excludes rows where only SL No is filled.
  - Recently Completed uses Actual Release Date column to sort.
- [x] **13. Confluence page fixes** — Sticky frozen header, blank columns hidden (only cols with ≥1 non-empty value shown), empty rows hidden from display. Hooks moved before early returns to fix Rules-of-Hooks crash.
- [x] **14. Project Tracker improvements** — KPI counts now filter empty/SL-No-only rows (matches dashboard card). Date columns normalised to dd/mm/yyyy at parse time in `lib/confluence.ts` via `normalizeDateStr` (handles ISO, slash, dash, dot, and natural-language formats). Actual Release Date now extracted from Confluence `<time datetime>` elements. Date inputs use `type="date"` with dd/mm↔ISO conversion helpers. Overdue card added to SprintDashboard bottom row. Worklogs page 404 noise fixed (Octokit logger suppressed, `listFiles` rethrows non-404 errors).
- [x] **15. Tech Docs page** — `/confluence` nav renamed to "Tech Docs". New `TechDocs` component replaces old `ConfluenceViewer`. Fetches all pages from Confluence space `PMT` (env var `CONFLUENCE_SPACE_KEY=PMT`), excludes tracker page. Features: searchable card grid, slide-in side panel (read + edit + new page), three-dot menu per card (Edit / Open in Confluence / Remove from view). Remove from view is local-only — persisted in `localStorage` under `techdocs_hidden_ids`, Confluence untouched. Three-dot menu uses fixed-position dropdown + transparent backdrop to avoid React 18 event / `overflow-y-auto` clipping bugs. New API routes: `GET/POST/PUT /api/confluence/docs`.
- [x] **16. Overview page full redesign** — Removed Active Sprint. New layout: 3 KPI cards (Delivered, Win Rate, Open Now) + Quarterly Breakdown (interactive quarter tabs + All, status bars + mini KPIs) + bottom row (Team Leaderboard by SPOC / Complexity Donut / Recent Requests). Donut uses Recharts PieChart with custom `ActiveShape` (+5px controlled expansion, no center-label overlap), tooltip shows count + %, legend in card header top-right. Full-canvas layout: AppShell changed to `h-screen p-5`, overview uses `flex flex-col h-full` with bottom row `flex-1 min-h-0`. New files: `components/overview/QuarterlyBreakdown.tsx`, `components/overview/ComplexityDonut.tsx`.

- [x] **17. Solution Requests — Pull button + status sync (2026-06-12)**
  - Added **Pull** button to toolbar — triggers `workflow_dispatch` on `pull-forms.yml` via `POST /api/github/pull-forms`. Needed because GitHub scheduler runs only 2–3×/day with 8–12h delays.
  - `pull_forms.py --update` flag added — rewrites files where content changed (smart diff, no git churn). Workflow now always runs with `--update` so status changes in Excel propagate automatically.
  - `feature_name` and `vc_spoc` added to YAML frontmatter (were body-only before — dashboard showed "—").
  - `solutions-provided.json` fixed (was wrong shape: object, must be array `[]`).
  - `impact.json` populated with live counts (was all zeros); `pull_forms.py` now calls `update_impact_json()` after every run; workflow stages it in commits.
  - **Pending:** Run `python scripts/pull_forms.py --update && git add intake/solutions-forms/ dashboard-data/impact.json && git commit -m "intake: backfill feature_name and vc_spoc" && git push` to backfill all 266 existing files.

- [x] **18. Consultant edit mode for Solution Requests (2026-06-15)**
  - Side panel now has a pencil **Edit** button. Edit mode exposes all 9 consultant-fillable fields: Status (dropdown), Complexity (dropdown), Solution SPOC, VC SPOC, Dev Sprint, Ticket, Closed On (date), Solution Given (textarea), Remarks (textarea).
  - **Save** writes to two places simultaneously: GitHub markdown (via `writeFile()`) + SharePoint Excel row (via `lib/sharepoint.ts` Microsoft Graph API). Excel write is fire-and-forget — GitHub save confirms to user immediately.
  - New files: `dashboard/lib/sharepoint.ts` (Graph API client, plain fetch, no new packages), `dashboard/app/api/github/forms/[id]/route.ts` (PATCH + GET).
  - Pull script guard added: if Excel cell is blank for a consultant field but markdown already has a value, markdown value is preserved (prevents `--update` from wiping dashboard edits).
  - **Pending:** Add Azure credentials to `dashboard/.env.local` (see env vars section below) to enable Excel write-back.

- [x] **20. Chrome Extension — SC Assistant Side Panel (2026-06-26)**
  - Google Gemini-style side panel assistant for Chrome. Click the extension icon on any tab → side panel opens with a context-aware AI chatbot grounded in the Solutions Central knowledge base.
  - **Auth flow**: Extension opens `${DASHBOARD_URL}/extension-auth` → user logs in via GitHub OAuth (NextAuth) → dashboard generates a signed HMAC-SHA256 JWT (7-day expiry) → content script reads token from hidden DOM element → stores in `chrome.storage.sync` → tab closes automatically. Bearer token sent on every `/api/knowledge/chat` request.
  - **Page context**: Content script reads current tab title, URL, visible text (2500 chars), and selected text. Injected as `PAGE CONTEXT` section into the AI system prompt. Context bar in panel shows active page. Updates on tab switch and navigation.
  - **Conversation history**: Persisted in `chrome.storage.local` (last 10 turns). Session memory facts (extracted by AI per turn) also persisted. Both survive panel close/reopen.
  - **Knowledge chat**: Reuses existing `/api/knowledge/chat` endpoint — BM25 search over the knowledge index, Groq llama-3.3-70b answers with source citations rendered as clickable chips.
  - **CORS**: Added `OPTIONS` handler + `chrome-extension://` origin allowlist to `/api/knowledge/chat`. Extension origins are dynamic so headers are set per-request.
  - **Large file fix**: `getFile()` in `lib/github.ts` now falls back to `download_url` when GitHub API omits inline content (files > 1MB). Knowledge index (270+ chunks) was silently returning `null` — this was the root cause of the "Knowledge index not built" 503 error even after rebuilding.
  - **New files**:
    - `chrome-extension/manifest.json` — MV3, side panel, content script, service worker
    - `chrome-extension/background.js` — opens side panel on icon click, relays auth token
    - `chrome-extension/content.js` — page context extraction + auth callback handler
    - `chrome-extension/config.js` — `DASHBOARD_URL` (update to prod URL before distributing)
    - `chrome-extension/sidepanel/index.html` + `style.css` + `chat.js` — full chat UI
    - `dashboard/lib/extension-token.ts` — HMAC token create/verify (no external deps)
    - `dashboard/app/extension-auth/page.tsx` — auth callback page, token in hidden DOM element
  - **Modified**: `dashboard/app/api/knowledge/chat/route.ts` (Bearer auth + CORS + page context), `dashboard/lib/github.ts` (large file fallback), `dashboard/.env.local.example` (EXTENSION_JWT_SECRET)
  - **Status**: Working locally at `localhost:3000`. Not yet committed or pushed.

- [x] **19. Central Knowledge Hub + AI chatbot (2026-06-19)**
  - New `/knowledge` route ("Knowledge Hub" in sidebar, BrainCircuit icon) consolidating all 4 data sources.
  - **Index** (`dashboard-data/knowledge-index.json`): pre-computed BM25 token-frequency JSON built by `POST /api/knowledge/rebuild`. Indexes 268+ solution forms, playbook entries, blueprints, and all Confluence PMT space pages. Gitignore trap: route was originally named `build/` — matched `build/` rule in root `.gitignore` and was silently excluded from commits. Renamed to `rebuild/`.
  - **Search**: Okapi BM25 (`lib/knowledge.ts`) — pre-computed `tf` maps at index time, IDF + length normalisation at query time. No embeddings, no external vector DB.
  - **Chat API** (`/api/knowledge/chat`): BM25 retrieves top-15 chunks → Groq (llama-3.3-70b) answers with inline source citations → source pills rendered below each assistant message linking back to GitHub files or Confluence pages.
  - **Chatbot personality**: interrogative and aggressive — asks clarifying questions before answering broad queries, ends every answer with a follow-up probe, pushes back on vague requests. Temperature 0.5.
  - **Session memory**: AI extracts key facts per turn (client, industry, goal, constraint) via hidden `<memory>[...]</memory>` block. Server strips it from the visible answer and returns `newFacts[]`. Client merges into `sessionMemory` state, passes on every request. UI shows amber dismissible chips. Resets on page refresh (session-only).
  - **Floating AI orb** moved to Overview-only (was showing on all pages).
  - New files: `lib/knowledge.ts`, `app/api/knowledge/rebuild/route.ts`, `app/api/knowledge/chat/route.ts`, `app/knowledge/page.tsx`, `components/knowledge/KnowledgeHub.tsx`.

---

## To Do

- [ ] **5. Fill in team roles** — `intake/team-and-roles.md` has all members listed but Role, Focus Areas, and Contact are blank for everyone.
- [ ] **Deploy to Vercel** — ✅ Already live at `solutions-central.vercel.app`. Auto-deploys on push to `main`.
- [ ] **Knowledge Hub — first index build** — Go to `/knowledge` and click **Rebuild Index** to populate `dashboard-data/knowledge-index.json` for the first time.
- [ ] **Azure credentials for edit write-back** — Add `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` to `dashboard/.env.local` and Vercel env vars to enable Excel write-back from the consultant edit panel.
- [ ] **⚠️ REMINDER — Portfolio Health formula review** — Current formula in `SprintDashboard.tsx` is a simplified weighted-count approach that can go negative. Agreed to improve it with: (1) clamp output to 0–100, (2) add timeline pressure using Actual Release Date for In Progress / To Do items past their release date. Pankaj's full 3-factor formula (status × 0.4 + timeline × 0.35 + blockers × 0.25) is NOT suitable for the Confluence tracker because it only has a single Overall Status column and no blocker relationships. Fix is small — ask Bhargav to revisit this when ready.

### Chrome Extension — Next Steps (paused, pending Azure AD setup)

- [ ] **Register Azure AD app** — portal.azure.com → Azure Active Directory → App registrations → New registration. Single tenant (Vantage Circle org only). Redirect URIs: `https://solutions-central.vercel.app/api/auth/callback/azure-ad` and `http://localhost:3000/api/auth/callback/azure-ad`. Collect: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`.
- [ ] **Add Microsoft OAuth + role system** — Once Azure AD app is registered: add `AzureADProvider` to NextAuth alongside existing GitHub provider. Add `role` field to JWT/session (`team` = GitHub login, `sales` = Microsoft login). Add Next.js middleware to block `sales` role from all dashboard routes except `/extension-auth` and `/api/knowledge/chat`. Add `/extension-only` page for sales users who try to access the dashboard directly.
- [ ] **Automated knowledge index rebuild** — Two-layer: (1) GitHub Actions workflow triggers `POST /api/knowledge/rebuild` on push to `main` when `intake/solutions-forms/**`, `playbook/entries/**`, or `pre-built-solutions/blueprints/**` change. (2) Vercel daily cron as backup. Needs `REBUILD_SECRET` env var added to both GitHub secrets and Vercel env vars.
- [ ] **Update `config.js` to production URL** — Change `chrome-extension/config.js` `DASHBOARD_URL` from `http://localhost:3000` to `https://solutions-central.vercel.app` before distributing.
- [ ] **Commit and push extension + dashboard changes** — Nothing from session 2026-06-26 has been committed yet. Commit: extension shell, dashboard auth changes, github.ts large-file fix.
- [ ] **Distribute extension** — Package `chrome-extension/` as a zip and upload to Chrome Web Store (unlisted) for one-click install by the sales team.

### Chrome Extension — Distribution Methods

**Option 1: Load unpacked (Developer mode) — for SE team**
1. Clone/download the repo
2. Go to `chrome://extensions` → enable Developer mode
3. Click Load unpacked → select `chrome-extension/` folder
- Works for technical users who already have the repo. No packaging needed.

**Option 2: Chrome Web Store Unlisted — for sales team (recommended)**
1. Go to chrome.google.com/webstore/devconsole
2. Pay one-time $5 developer registration fee
3. Zip the `chrome-extension/` folder
4. New Item → upload zip → fill name/description/screenshot
5. Visibility → set to Unlisted
6. Publish → share the private install link with the team
- No Developer mode needed. One-click install. Auto-updates when a new version is uploaded.
- ⚠️ Before publishing: update `chrome-extension/config.js` DASHBOARD_URL to `https://solutions-central.vercel.app`, commit and push first.

---

## Dashboard Pages

| Route | Label | Status |
|---|---|---|
| `/` | Overview | Live — KPIs, quarterly breakdown, leaderboard, complexity donut, recent requests |
| `/solution-requests` | Solution Requests | Live — searchable grid + side panel |
| `/sprint` | Project Tracker | Live — KPIs, health, status chart, Confluence card, completed/in-progress/overdue rows |
| `/sprint/tracker` | Full Tracker Table | Live — search, filter, sort, inline edit, add row |
| `/confluence` | Tech Docs | Live — PMT space pages, slide-in panel, edit/create, local hide via localStorage |
| `/playbook` | Playbook | Live |
| `/blueprints` | Blueprints | Live |
| `/knowledge` | Knowledge Hub | Live — BM25 index over 4 sources, Groq RAG chat, session memory, source pills |
| `/team` | Team & Skills | Live — member profiles mostly blank |
| `/worklogs` | Worklogs | Live — 404 noise fixed |

---

## Dashboard — Environment Variables

`.env.local` in `dashboard/` needs:

```
# GitHub OAuth (dashboard login)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=        # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# GitHub repo access
GITHUB_PAT=             # Personal Access Token, repo scope
GITHUB_REPO_OWNER=SolutionsEngineering101
GITHUB_REPO_NAME=Solutions-Central

# Azure / SharePoint (consultant edit write-back)
AZURE_CLIENT_ID=
AZURE_TENANT_ID=
AZURE_CLIENT_SECRET=
MS_SHAREPOINT_HOST=vantagecircle.sharepoint.com
MS_SHAREPOINT_SITE=Solutions
MS_EXCEL_NAME=Solution Request Form

# Confluence integration
CONFLUENCE_EMAIL=bhargav.nath@vantagecircle.com
CONFLUENCE_API_TOKEN=   # from id.atlassian.com or Jira profile → Account Settings → Security
CONFLUENCE_DOMAIN=vantagecirclejira.atlassian.net
CONFLUENCE_PAGE_ID=567050244
CONFLUENCE_SPACE_KEY=PMT

# Chrome Extension — JWT signing (signs tokens issued at /extension-auth)
EXTENSION_JWT_SECRET=   # openssl rand -base64 32 — defaults to NEXTAUTH_SECRET if not set

# Microsoft Azure AD OAuth (for sales team extension access — not yet implemented)
AZURE_AD_CLIENT_ID=     # from Azure portal → App registrations → Solutions Central Assistant
AZURE_AD_CLIENT_SECRET= # from App registrations → Certificates & secrets
AZURE_AD_TENANT_ID=     # from Azure portal → Azure Active Directory → Overview

# Automated knowledge index rebuild (for GitHub Actions + Vercel cron — not yet implemented)
REBUILD_SECRET=         # openssl rand -base64 32
```

## Dashboard — Go Live Steps

1. Add all env vars to `.env.local`
2. Run locally: `cd dashboard && npm run dev`
3. Deploy to Vercel: connect repo, set Root Directory = `dashboard`, add all env vars
4. Update GitHub OAuth App callback URL to Vercel URL after deploy

---

## Key File Paths

| What | Where |
|---|---|
| Intake forms | `intake/solutions-forms/` |
| Playbook entries | `playbook/entries/` |
| Blueprints | `pre-built-solutions/blueprints/` |
| Sprint data | `dashboard-data/sprint-report.json` |
| Backlog | `dashboard-data/backlog.json` |
| Solutions provided | `dashboard-data/solutions-provided.json` |
| Team skills | `skills/member/` |
| Confluence lib | `dashboard/lib/confluence.ts` |
| Portfolio types | `dashboard/components/portfolio/types.ts` |
