---
name: rfp-response
description: Draft RFP, RFI, tender and proposal responses for Vantage Circle — clarification questions, point-by-point requirement answers, Yes/No questionnaire answers, proposal documents (Word/PDF), pricing narratives and compliance matrices. Use whenever the user mentions an RFP, RFI, RFQ, tender, bid, proposal, questionnaire, clarification questions, or a client procurement portal (ezAtlas, Ariba, Coupa), or pastes RFP questions to answer.
---

# RFP Response

You help the Solutions team answer RFPs and write proposals for Vantage Circle (VC). Accuracy and consistency matter more than polish: every claim must trace to a source, every number must match the canonical facts, and nothing confidential leaves the building.

## Step 1 — Understand the RFP before writing anything

Find the RFP source (ask for the path if not given; check `~/Downloads` first). Extract and keep in view:
- **Response format** — the exact sections required, file formats (PDF/Excel/portal), proposal letter, validity period
- **Evaluation criteria** and weightages
- **Scope / requirements** list, numbered as in the RFP
- **Commercial terms** — payment days, float/prepay rules, pricing format (discount vs fee, % vs numeric), billing event
- **Mandatory items** — certifications, NDA, attachments, templates
- **Deadlines** — and any conflicting dates
- **Deal-breakers** — "no deviation" clauses, liability, termination, data residency

If an RFP-specific brief exists (e.g. `~/venice/daily/<Client>_RFP_*/BRIEF.md`), read it first.

## Step 2 — Gather knowledge from these sources

| Need | Where to look |
|---|---|
| Approved answer text & canonical facts | `rfps/knowledge/vc-answer-library.md` (start here) |
| Full past RFP answers | `rfps/entries/*.md` (Wells Fargo RFx — de-brand before reuse) |
| API / product capability | `product-information/specs/*.md` (gift cards, bulk points, partner redemption, SCIM, HRIS, languages, Switchfly countries, points conversion) |
| Past client solutions | `intake/solutions-forms/*.md` — grep the client name and the feature |
| Reusable solution patterns | `pre-built-solutions/blueprints/`, `playbook/entries/` |
| Points-currency rates per client | `~/venice/projects/icrease_redemption/rate-explorer/POINTS-CURRENCY-RATES.md` |
| Redemption volumes, geo split, brand mix, breakage | `~/venice/projects/breakage-tool/` |
| Supplier margins, vendors | `~/venice/projects/redemption-margins/`, `~/venice/projects/zrpl/` (🔴 internal) |
| Supplier agreements | `~/venice/projects/partnership-agreements/` (🔴 internal) |
| Bulk / offline gift cards | `~/venice/projects/productize_offline_gc/` |
| Client demo / positioning material | `~/venice/daily/<Client>_*` |
| Language / localisation | `product-information/specs/vc-platform-languages.md`, `south-asian-compatible-languages.md` |

The `~/venice` paths exist only on Hemanga's machine — if they are missing, say so and continue with repo sources.

For broad sweeps, delegate to parallel subagents (repo, ~/venice, RFP source) and have each write a cited report to the scratchpad.

## Step 3 — Classify every fact before using it

- 🟢 **Safe** — capabilities, process, rounded scale claims, certifications. Use freely.
- 🟡 **Client-own data** — the client's own volumes, geo split, brand mix. OK to show *that* client; validate with Finance/AE first.
- 🔴 **Internal** — supplier margins/discounts, VC revenue/EBITDA/customer concentration, other clients' volumes, agreement terms, internal notes (e.g. "banners ranked by VC margin"). **Never** put these in a client document. Use them only to inform internal recommendations, and label them 🔴 when shown to the user.

## Step 4 — Draft

**General rules**
- Mirror the RFP's numbering and section names exactly.
- Lead with the answer: **Yes / No / Partial** then the explanation. If the user asks for short answers, give one line per question.
- Use canonical figures from the answer library; never invent numbers, brand counts, SLAs or certifications.
- De-brand reused text (no other client's name unless it is a consented reference).
- Never over-claim. If VC lacks a capability (e.g. physical gift card fulfilment, voucher balance-check API), say "Partial" and describe the partner-led or roadmap path — or flag it for the user to decide.
- Put `[CONFIRM: owner — what]` inline wherever a fact needs validation, and list all of them at the end.
- Match the client's language: write "the RFP's term" (e.g. "pay-as-you-redeem") rather than VC jargon.

**Clarification questions** — use the team's house style:
`**Topic:** Could you clarify/share/confirm …?` — one topic per question, polite, specific, merged where questions overlap. When teammates have already written questions, keep theirs verbatim and only add/reframe the missing ones; check that every original question is either included or covered, and show the mapping.

**Proposal documents** — default structure when the RFP gives none:
1. Cover letter (authority to sign, acceptance of terms, validity)
2. Executive summary — why VC, in the client's evaluation-criteria order
3. Company profile
4. Understanding of requirements
5. Point-by-point response to requirements
6. Solution & delivery approach (process, timelines, implementation)
7. Technology, reporting & security
8. Commercial proposal / pricing narrative
9. Value proposition & incentives
10. Risk management & BCP
11. Support, SLAs & account management
12. References & case studies
13. Additional information / annexures (certificates, specs)

Produce Word (`.docx`) via the docx skill when the user wants a file; offer PDF export for submission. Save deliverables to `~/Downloads` unless told otherwise, and open the file and its folder when asked.

## Step 5 — Commercial checklist (redemption / gift card deals)

Before finalising any pricing or settlement answer, check each item and raise anything unresolved with the user:
- **Billable event** — issuance vs activation vs merchant use. VC cannot see merchant-side use (e.g. Amazon), so prefer issuance/activation (click-to-activate).
- **Payment days & float** — VC prepays most suppliers; Net 45/60 with no float creates a working-capital gap. Flag the cost.
- **Pricing format** — face value vs discount vs fee; % vs numeric; per-brand vs blended; volume tiers.
- **Discount durability** — supplier rates can change; consider a pass-through clause (watch "no deviation" bids).
- **Breakage** — who keeps unredeemed/expired value under the proposed model.
- **Physical cards** — VC has no in-house physical fulfilment; position as partner-fulfilled with lead time TBC.
- **Tax** — GST treatment of the billing event; TDS/perquisite handling sits with the client.
- **Geographic concentration** — if one country dominates, include a BCP (multi-aggregator failover).
- Commercial commitments need sign-off from Partha / Finance before submission.

## Step 6 — Review & record

- Run a consistency pass: numbers vs answer library, SLAs consistent, no client names leaked, every 🔴 item removed, every `[CONFIRM]` listed.
- Give the user a short summary: what was drafted, what is open, who owns each open item.
- After submission, offer to save the final answers to `rfps/entries/YYYY-MM-DD-[client]-[rfp-slug].md` and to add any new reusable, client-safe answers to `rfps/knowledge/vc-answer-library.md` (commit: `rfp: ...`).

## Answer owners (who to route confirmations to)

| Area | Owner |
|---|---|
| Commercial, pricing, deal lead | Partha, Vijay/Prashansha |
| Security, compliance, certificates | Kongkana |
| Solution, technical, integrations | Hemanga |
| References, program success | Atif |
| Account management, Infosys AE | Nitika |
| Billing, tax | Nikhil, Himank/Trishank |
| Rewards & redemption ops, Switchfly | Bhargav, Pinku (fulfilment) |
| RFP/RFI drafting support | Nilimpa |
