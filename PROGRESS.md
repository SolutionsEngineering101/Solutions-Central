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
- [x] **3. Clean up Confluence references** — Deleted `sync-confluence.sh`, updated `intake/confluence-sync/README.md` to generic knowledge-import drop zone, repurposed Workflow 6 in CLAUDE.md.
- [x] **4. Scaffold `skills/` folder** — `skills/member/` (6 profiles + `_template.md`) and `skills/guides/`. Bhargav's profile pre-filled.
- [x] **6. Build dashboard website** — `dashboard/` subfolder. Next.js 14 App Router + Tailwind + NextAuth (GitHub OAuth) + Octokit. Builds clean. **Needs `.env.local` before local run and Vercel deploy.**

---

## To Do (in order)

- [ ] **5. Fill in team roles** — `intake/team-and-roles.md` has all members listed but Role, Focus Areas, and Contact are blank for everyone.

---

## Dashboard — Next Steps to Go Live

1. **Create `.env.local`** in `dashboard/` (copy from `.env.local.example`)
   - `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` — from GitHub OAuth App
   - `GITHUB_PAT` — Personal Access Token with `repo` scope
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32`
   - `NEXTAUTH_URL=http://localhost:3000`
   - `GITHUB_REPO_OWNER=SolutionsEngineering101`
   - `GITHUB_REPO_NAME=Solutions-Central`
2. **Run locally**: `cd dashboard && npm run dev`
3. **Deploy to Vercel**: connect repo, set Root Directory = `dashboard`, add env vars
4. **Update OAuth callback URL** in GitHub OAuth App to Vercel URL after deploy

## Open Questions (still need answers)
- SCD — what does it stand for in your context?
- Complexity mapping in `documents/complexity-mapping/` — same as the SIP SOP (Low/Medium/High = 3/5/15 days) or a separate doc?
