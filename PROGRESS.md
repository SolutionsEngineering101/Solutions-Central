# Solutions-Central — Setup Progress

> Read this at the start of each session to pick up where we left off.
> Tell Claude: "read the progress file and continue"

---

## Repo Location
`~/Documents/Solutions_Engineering/solutions-intelligence-platform` → **NOT this one**
`~/Documents/Solutions_Engineering/solutions-engineering` → **THIS is Solutions-Central**

GitHub: `https://github.com/SolutionsEngineering101/Solutions-Central.git`

---

## Context
Building a central GitHub repository for the 6-person Solutions Engineering team at Vantage Circle.
The repo serves as: intake hub, documentation library, team workspace, playbook, pre-built solutions store, and data source for a Vercel/Netlify dashboard website.

**Team:**
- Hemanga Bharadwaj
- Pankaj Chakrabarty
- Bhargav Nath
- Nilimpa Nizara Bora
- Garima Kayal
- Kongkana Bayan

---

## Completed

- [x] **1. Fixed broken folder structure** — `documents/`, `product-information/`, `project-management/` had brace-expansion strings as literal folder names. Replaced with correct individual subdirectories. Committed.
- [x] **2. Microsoft Graph API Forms puller** — Replaced Power Automate with a Python-based Graph API solution. Files written:
  - `scripts/pull_forms.py` — pulls responses, writes to `intake/solutions-forms/`, idempotent
  - `scripts/GRAPH_API_SETUP.md` — full Azure app registration + GitHub secrets setup guide
  - `scripts/requirements.txt` — `msal`, `requests`, `python-dotenv`
  - `scripts/.env.example` — env var template for local use
  - `.github/workflows/pull-forms.yml` — daily 8am UTC GitHub Actions schedule + manual trigger
  - `.gitignore` — covers Python, Node, macOS, secrets, `.refresh_token`
  - Auth strategy: device code flow for first-time setup → refresh token stored as GitHub secret

---

## To Do (in order)

- [x] **3. Clean up Confluence references** — Deleted `intake/confluence-sync/`, `scripts/sync-confluence.sh`. Removed Workflow 6 from CLAUDE.md. Updated README.md.
- [ ] **4. Scaffold `skills/` folder** — Currently empty. Needs a structure and README.
- [ ] **5. Fill in team roles** — `intake/team-and-roles.md` has all members listed but Role, Focus Areas, and Contact are blank for everyone.
- [ ] **6. Build dashboard website** — Dynamic site hosted on Vercel or Netlify. Reads from `dashboard-data/` JSON files in the repo (via GitHub API). Stack not yet decided.

---

## Open Questions (still need answers)
- Dashboard: React or another framework? Should it be in this repo or a separate one?
- SCD — what does it stand for in your context?
- Complexity mapping in `documents/complexity-mapping/` — same as the SIP SOP (Low/Medium/High = 3/5/15 days) or a separate doc?
