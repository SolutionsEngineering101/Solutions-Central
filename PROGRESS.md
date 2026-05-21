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

---

## To Do (in order)

- [ ] **2. Replace Power Automate script with Microsoft Graph API script** — Python script to pull Microsoft Forms responses and write them to `intake/solutions-forms/`. Need to confirm: Azure app registration setup needed? Manual run or GitHub Actions schedule?
- [ ] **3. Clean up Confluence references** — Remove/repurpose `intake/confluence-sync/` and `scripts/sync-confluence.sh`. User is moving away from Confluence entirely.
- [ ] **4. Add `.gitignore`** — Currently missing. Should cover Python, Node, macOS, secrets.
- [ ] **5. Scaffold `skills/` folder** — Currently empty. Needs a structure and README.
- [ ] **6. Fill in team roles** — `intake/team-and-roles.md` has all members listed but Role, Focus Areas, and Contact are blank for everyone.
- [ ] **7. Build dashboard website** — Dynamic site hosted on Vercel or Netlify. Reads from `dashboard-data/` JSON files in the repo (via GitHub API). Stack not yet decided.

---

## Open Questions (still need answers)
- Graph API: Python script format confirmed. Azure app registration — already set up or needs setup instructions included?
- Dashboard: React or another framework? Should it be in this repo or a separate one?
- SCD — what does it stand for in your context?
- Complexity mapping in `documents/complexity-mapping/` — same as the SIP SOP (Low/Medium/High = 3/5/15 days) or a separate doc?
