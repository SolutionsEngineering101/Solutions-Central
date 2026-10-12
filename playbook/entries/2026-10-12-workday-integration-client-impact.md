---
title: "Positioning Vantage Recognition for Workday — Client Impact & Discovery"
date: 2026-10-12
author: "Hemanga Bharadwaj"
tags: [workday, integration, hris, provisioning, client-success]
related_solutions: []
related_documents:
  - "Vantage Recognition for Workday (client brief PDF, Sep 2026)"
  - "https://marketplace.workday.com/en-US/apps/850976/vantage-recognition"
  - "rfps/knowledge/vc-answer-library.md#7a-workday-integration"
---

# Positioning Vantage Recognition for Workday — Client Impact & Discovery

## Context
Use this whenever a client or prospect runs Workday HCM. Vantage Recognition is listed on Workday Marketplace (Free Edition, works with Core HCM) with Workday's **Innovation Partner** and **Design Approved** badges. It is a productised, two-way integration:

| Direction | What it does | How |
|---|---|---|
| **Workday → Vantage Circle** | Joiners, leavers, transfers and reporting-line changes sync automatically | WQL over Workday REST API, OAuth 2.0; VC owns the query; daily by default (configurable); one-time full load at launch |
| **Vantage Circle → Workday** | Each recognition posts as native **Anytime Feedback** on the recipient's Workday profile | Give Feedback web service via a dedicated ISU; each VC award maps to a client Feedback Badge |

Directions are configured independently. Recommend **inbound first**: write-back depends on employee IDs that the inbound sync establishes.

## What We Learned
**Impact by stakeholder**
- **HR / People (buyer):** no more CSV/SFTP uploads; birthday and anniversary programs run on correct dates; recognition becomes part of the talent record, not just an engagement metric. Write-back is the strongest value point.
- **Managers:** see their team's recognition inside Workday, where they run reviews. Approvals and team views follow the Workday reporting line automatically.
- **Employees:** largely invisible — account on day one, deactivated on exit, recognition shows on their Workday profile.
- **Workday / integrations team:** small, standard setup (API client, tenant + data-centre host, email domains, ISU + Feedback Badges for write-back). Nothing installed in the tenant; nothing to maintain across Workday releases.
- **InfoSec:** read-only on a fixed field list; write creates feedback only; separate credentials per direction; TLS + AES-256; client can revoke at any time.

**Data exchanged:** only work email + employee ID are required. Profile (legal name, cost center, management level, worker status), reporting line (manager ID/email) and optional detail (phone, city, country, gender, DOB, hire date, worker type, job profile) are all optional. Write-back carries only giver, recipient, badge, message, date.

**Positioning by client type**
- *Workday clients on file feeds today* — retention/upsell: the old feed is paused, not deleted, so there's always a way back.
- *New Workday prospects* — competitive differentiator: Marketplace listing + Design Approved reduce procurement friction.
- *Talent-led buyers (CHRO, L&D)* — lead with write-back. *IT-led buyers* — lead with light setup and VC-owned maintenance.

## Steps / How-To
**Discovery checklist (raise early)**
1. **Email domains** — collect every domain, including subsidiaries and contractors. A worker on an unlisted domain is never created; this is the most likely first-load issue.
2. **Is Workday Feedback in use?** Write-back needs the Talent web service and Feedback Badges configured. Don't assume it.
3. **Award → badge mapping** — how many Feedback Badges exist? Does the client want *every* award posted, or only some (private/peer awards)? ⚠ Confirm with product whether award filtering is supported before promising it.
4. **Refresh token** — the API client uses a non-expiring refresh token. Prepare InfoSec for this; revocation sits with the client.
5. **Works council / privacy** — recognition entering the performance system may need works-council sign-off (EU). Recommend sharing only the optional fields programs actually need (GDPR, DPDPA).
6. **Multiple HRIS?** Workday-only. Other regions on another HRIS still need a separate feed.
7. **Leaver handling** — daily sync means up to a day's lag; agree what happens to unredeemed points on deactivation.

**Delivery (4 phases):** Scoping (one session) → Sandbox connection + first load → Validation (sample incl. a recent joiner and a leaver; test recognition posted if write-back in scope) → Production (full load reconciled to headcount, schedule set).

**Who does what:** Client — register API client, create write-back ISU, confirm domains and badges, validate sample, confirm recognition on a profile. VC — configure (no dev work), own the WQL query, run and reconcile loads, apply badge mapping, monitor sync exceptions.

## Outcome
Client-facing deck built for AM/CSM use: https://claude.ai/artifact/HtKXrxUR28YdnpMjWzerX6

**Messaging caution:** the Marketplace listing says recognition syncs "in real time / as it happens" and that HR can manage schedules and mappings "without IT". The PDF brief says the people sync is **daily by default** and that VC applies the badge mapping. Until product confirms, say "recognition posts to Workday shortly after it's given" and "employee data syncs daily by default". Don't promise real-time employee sync or HR self-service mapping.

**Not covered by either source (ask product before committing):** pricing beyond the Free Marketplace edition, data residency, sync-error reporting to the client, givers who are not Workday workers.

## References
- Vantage Recognition for Workday — client brief PDF (10 pp., Sep 2026)
- Workday Marketplace listing: https://marketplace.workday.com/en-US/apps/850976/vantage-recognition (demo video: https://www.youtube.com/watch?v=gNF4XEsy0qA)
- `rfps/knowledge/vc-answer-library.md` §7a
