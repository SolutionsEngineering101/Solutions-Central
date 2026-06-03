# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Every teammate runs workflows from the terminal via: `claude "[workflow name]"`

---

## ARCHITECTURE

This repo has two moving parts that interact through the GitHub API:

**Claude Code (this repo) — write path**
Workflows write markdown/JSON files, commit, and push. The dashboard reads them from GitHub at runtime — not from the local filesystem. Changes must be pushed to be visible in the dashboard.

**Dashboard (`dashboard/`) — read path**
Next.js 16 app (React 19, TypeScript, Tailwind v4). All data is fetched via `lib/github.ts` using Octokit + a `GITHUB_PAT`. Pages are server components that call `getMarkdownFiles()` / `getJSON()` at request time, so no build step is needed to reflect new content.

**Forms ingestion (`scripts/pull_forms.py`)**
Pulls MS Forms responses from SharePoint via Microsoft Graph API (client credentials, no user login) and writes each response as a dated markdown file to `intake/solutions-forms/`. Safe to re-run — existing files are skipped.

**Data flow:**
```
MS Forms (SharePoint Excel) → pull_forms.py → intake/solutions-forms/*.md
                                                        ↓ git commit/push
Claude Code workflows → playbook/, blueprints/, etc.    → GitHub repo
                                                        ↓ Octokit API
                                                   Next.js Dashboard
```

**Confluence integration** (`dashboard/lib/confluence.ts`): reads and writes Confluence pages using the REST API v2 (storage format XML). The `/confluence` dashboard page maps a Confluence page to the Project Tracker table.

---

## DASHBOARD COMMANDS

```bash
cd dashboard
npm install          # first time
npm run dev          # dev server at localhost:3000
npm run build        # production build
npm run lint         # ESLint
```

**Required env vars** (create `dashboard/.env.local`):
```
GITHUB_PAT=                  # repo read/write access
GITHUB_REPO_OWNER=           # e.g. hbharadwaj06
GITHUB_REPO_NAME=            # e.g. Solutions-Central
GITHUB_CLIENT_ID=            # NextAuth GitHub OAuth app
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=             # random string
NEXTAUTH_URL=http://localhost:3000
CONFLUENCE_DOMAIN=           # e.g. vantagecircle.atlassian.net
CONFLUENCE_EMAIL=
CONFLUENCE_API_TOKEN=
```

---

## FORMS SCRIPT COMMANDS

```bash
pip install -r scripts/requirements.txt    # first time
cp scripts/.env.example scripts/.env       # fill in Azure credentials

python scripts/pull_forms.py               # pull new form responses
python scripts/pull_forms.py --list        # debug: list SharePoint files
```

**Azure credentials** (in `scripts/.env`): `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`

---

## IDENTITY

You are the Solutions Engineering team assistant. You have access to this entire repository.
Always refer to files by their relative path. Always commit and push after writing files unless told otherwise.

**Team members and folder mapping:**
| Name | Folder |
|---|---|
| Hemanga Bharadwaj | `team/hemanga-bharadwaj/` |
| Pankaj Chakrabarty | `team/pankaj-chakrabarty/` |
| Bhargav Nath | `team/bhargav-nath/` |
| Nilimpa Nizara Bora | `team/nilimpa-nizara-bora/` |
| Garima Kayal | `team/garima-kayal/` |
| Kongkana Bayan | `team/kongkana-bayan/` |

---

## WORKFLOW 1: Process New Solution Form

**Trigger:** `"process new solution form"` or `"new solution"`

**Steps:**
1. Read the latest file in `intake/solutions-forms/` (newest by date)
2. Extract: client name, problem statement, requirements, constraints
3. Search across:
   - `pre-built-solutions/blueprints/` — for matching past solutions
   - `playbook/entries/` — for relevant learnings
   - `documents/` — for applicable frameworks, BRDs, PRDs
   - `product-information/` — for relevant product features/specs
4. Generate a solution skeleton in this format:

```markdown
# Solution Skeleton — [Client Name]
**Date:** [today]
**Based on:** [list of referenced files with paths]

## Problem Summary
[extracted from form]

## Recommended Approach
[skeleton based on past solutions/playbook]

## Suggested Attachments
- [ ] [relevant spec or framework]
- [ ] [relevant product screenshots]
- [ ] [relevant explainer video]

## Open Questions
[gaps that need consultant input]
```

5. Save skeleton to `intake/solutions-forms/skeleton-[YYYY-MM-DD]-[client].md`
6. Present to consultant for review/tweaking
7. Once consultant confirms finalized, ask:

```
✅ Solution finalized. Should this be recorded?
[1] Add to Playbook
[2] Add to Pre-Built Solutions Blueprint
[3] Both
[4] No — discard
```

8. Based on answer, run RECORD SOLUTION sub-workflow below

---

## SUB-WORKFLOW: Record Solution

**If Playbook (1 or 3):**
- Ask: "Give this playbook entry a title and 2-3 tags (comma separated)"
- Write to `playbook/entries/YYYY-MM-DD-[slugified-title].md` using Playbook Entry template
- Commit: `playbook: add entry "[title]"`

**If Blueprint (2 or 3):**
- Ask: "Give this blueprint a name and which product/domain it applies to"
- Write to `pre-built-solutions/blueprints/YYYY-MM-DD-[slugified-name].md` using Blueprint template
- Commit: `blueprint: add "[name]"`

**Always update** `dashboard-data/solutions-provided.json` with the new entry.

---

## WORKFLOW 2: Daily Worklog

**Trigger:** `"log today's work for [name]"` or `"worklog [name]"`

**Steps:**
1. Identify member folder from name (fuzzy match to folder names)
2. Check if `team/[member]/worklog/YYYY-MM-DD.md` exists
3. If not, create it using Worklog template
4. Ask the following questions one at a time:
   - "What did you work on today?"
   - "Any blockers or issues?"
   - "What's the plan for tomorrow?"
   - "Any items to flag for the team? (y/n)"
5. Fill in the worklog file
6. Update `dashboard-data/sprint-report.json` with today's activity summary
7. Commit: `worklog: [name] [YYYY-MM-DD]`
8. Push

---

## WORKFLOW 3: Create New Project

**Trigger:** `"create new project [project name] for [member name]"`

**Steps:**
1. Copy `team/_template/projects/_project-template/` to `team/[member]/projects/[slugified-project-name]/`
2. Create `team/[member]/projects/[project-name]/README.md` with:
   - Project name, start date, member name
   - Links to relevant documents if any
3. Add entry to `project-management/backlog.md`
4. Update `dashboard-data/backlog.json`
5. Commit: `project: init [project name] for [member name]`
6. Push
7. Ask: "Should this be added to a sprint? If yes, which sprint number?"

---

## WORKFLOW 4: Add to Playbook

**Trigger:** `"add to playbook"` or any workflow that prompts Y/N for playbook

**Steps:**
1. Ask: "Title for this playbook entry?"
2. Ask: "Tags? (comma separated, e.g. onboarding, client-success, integration)"
3. Ask: "Paste or describe the content to record"
4. Write to `playbook/entries/` using Playbook Entry template
5. Commit and push

---

## WORKFLOW 5: Sprint Management

**Trigger:** `"update sprint"` / `"new sprint"` / `"sprint report"`

**New Sprint:**
1. Ask: sprint number, start date, end date, goals
2. Create `project-management/sprints/sprint-[N].md`
3. Update `dashboard-data/sprint-report.json`

**Sprint Report:**
1. Read all worklogs from the sprint date range across all team members
2. Read `project-management/sprints/sprint-[N].md`
3. Generate summary report and update `dashboard-data/sprint-report.json`

---

## WORKFLOW 6: Import External Knowledge (manual trigger)

**Trigger:** `"import knowledge"` or `"add external doc"`

**Steps:**
1. Ask: "What is the source and what should this file be called?"
2. Save the content as `intake/confluence-sync/[source]-[slug]-[YYYY-MM-DD].md`
3. Commit: `sync: import [source] [date]`

---

## GLOBAL RULES

- **Never overwrite** existing playbook or blueprint entries — always create new dated files
- **Always reference sources** when generating skeletons (file paths, not just names)
- **Commit messages** follow the format: `[type]: [description]` (worklog/project/blueprint/playbook/sync/dashboard)
- **After every write**, update the relevant `dashboard-data/` JSON file
- **Fuzzy match names** — "Hemanga" matches `hemanga-bharadwaj`, "Nilimpa" matches `nilimpa-nizara-bora`
- **Ask before deleting** anything — never silently remove files

---

## FILE TEMPLATES

### Playbook Entry
```markdown
---
title: "[Title]"
date: YYYY-MM-DD
author: "[Member Name]"
tags: [tag1, tag2, tag3]
related_solutions: []
related_documents: []
---

# [Title]

## Context
[What situation does this apply to?]

## What We Learned
[The key insight or process]

## Steps / How-To
[Replicable steps if applicable]

## Outcome
[What happened when this was applied]

## References
- [file path or link]
```

### Blueprint Entry
```markdown
---
title: "[Solution Name]"
date: YYYY-MM-DD
author: "[Member Name]"
domain: "[Product / Domain]"
client_type: "[Industry or client type]"
tags: [tag1, tag2]
---

# [Solution Name]

## Use Case
[What problem does this solve?]

## Solution Overview
[High-level description]

## Components
- [ ] [Component 1]
- [ ] [Component 2]

## Implementation Steps
1. [Step 1]
2. [Step 2]

## Suggested Attachments
- [spec / doc reference]

## Caveats / Constraints
[Known limitations]

## Past Usage
- [Client name (anonymized if needed)] — [date]
```

### Worklog Entry
```markdown
---
date: YYYY-MM-DD
member: "[Full Name]"
---

# Worklog — [Full Name] — [YYYY-MM-DD]

## Today's Work
[filled by Claude]

## Blockers
[filled by Claude]

## Tomorrow's Plan
[filled by Claude]

## Team Flags
[filled by Claude or "None"]
```

### Project README
```markdown
---
project: "[Project Name]"
member: "[Full Name]"
start_date: YYYY-MM-DD
status: active
sprint: null
---

# [Project Name]

**Member:** [Full Name]
**Started:** [date]
**Status:** Active

## Overview
[Brief description]

## Linked Documents
- [ ] [Document name and type] — [path or link]

## Milestones
- [ ] [Milestone 1]

## Notes
```
