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

---

## To Do

- [ ] **5. Fill in team roles** — `intake/team-and-roles.md` has all members listed but Role, Focus Areas, and Contact are blank for everyone.
- [ ] **Deploy to Vercel** — see steps below.
- [ ] **Confluence activation** — user has API token, needs to add to `.env.local` and restart dev server.
- [ ] **Project Tracker polish** — verify health score formula feels right once Actual Release Date data is populated in Confluence. Consider timeline/assignee view as a future addition.

---

## Dashboard Pages

| Route | Label | Status |
|---|---|---|
| `/` | Overview | Live — live status counts from intake forms |
| `/solution-requests` | Solution Requests | Live — searchable grid + side panel |
| `/sprint` | Project Tracker | Live — dashboard (KPIs, health, chart, Confluence card) from live Confluence data |
| `/sprint/tracker` | Full Tracker Table | Live — search, filter, sort, inline edit, delete, add row |
| `/confluence` | Confluence | Live — sticky header, blank cols/rows hidden |
| `/playbook` | Playbook | Live |
| `/blueprints` | Blueprints | Live |
| `/team` | Team & Skills | Live — member profiles mostly blank |
| `/worklogs` | Worklogs | Live |

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

# Confluence integration
CONFLUENCE_EMAIL=bhargav.nath@vantagecircle.com
CONFLUENCE_API_TOKEN=   # from id.atlassian.com or Jira profile → Account Settings → Security
CONFLUENCE_DOMAIN=vantagecirclejira.atlassian.net
CONFLUENCE_PAGE_ID=567050244
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
