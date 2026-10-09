---
title: "Vantage Circle RFP Answer Library"
updated: 2026-10-09
owner: "Hemanga Bharadwaj"
---

# Vantage Circle RFP Answer Library

Reusable, de-branded answer text for RFPs, RFIs and proposals. Replace `[Client]` before use.
Most snippets come from the Wells Fargo Global Recognition RFx (Nov 2025) — `rfps/entries/2026-06-30-global-recognition-program-rfp-part-*.md` — and are tagged with the original question and answer owner.

**Rules**
- Only client-safe content lives here. Never add supplier margins, VC revenue/EBITDA, other clients' volumes, or agreement terms.
- If a number below changes, update it here first so every proposal stays consistent.
- ⚠ = needs a commercial or factual check before reuse.

---

## 1. Canonical facts (use these exact figures)

| Fact | Value | Notes |
|---|---|---|
| Founded | 2010 | "15+ years operating; 10+ years in R&R" |
| Clients | 700+ enterprise clients | |
| Reach | 100+ countries | Gift-card answers have also said 176+ — use **100+** unless a country list is attached |
| Employees served | 3.2 million+ | |
| VC headcount | ~300 (293) | ~277 India, ~16 North America |
| HQ | 4512 Legacy Drive, Suite 100, Plano, TX 75024, USA | Entities: Bargain Technologies Inc. (US/CA), Pvt Ltd (India), BV (NL), L.L.C-FZ (UAE) |
| Product lines | Vantage Recognition, Vantage Fit, Vantage Pulse, Vantage Perks | Services: AIRe Advisory, Vantage Edge, Vantage Swags |
| Named clients (consented) | Deloitte, Charles Schwab, Infosys, Wipro, TCS, LTIMindtree, Amdocs, Tata Communications | Re-confirm consent per bid |
| Gift card brands | 240+ Indian brands; 2,000+ brands actually redeemed globally in the last 12 months across 50 currencies | Older bids said "7000+ brands" — that is catalogue breadth, not redemption; avoid unless defended |
| Platform languages | 14 (+12 South Asian languages in mobile app) | See `product-information/specs/vc-platform-languages.md` |
| Certifications | ISO 27001, ISO 27701, SOC 2 Type II; compliant with GDPR, CCPA, India DPDPA | VPAT 2.4 (WCAG 2.1 A/AA) |
| Uptime SLA | 99.9% | |
| Support | 24×7×365; email, chat, phone, help centre | |
| Redemption rate | Lifetime 77.2%; trailing-12-month 90% (as of Oct 2025) | Refresh before reuse |
| Award | Wipro programme — Brandon Hall HCM Gold (2024) | |

---

## 2. Company overview
> Vantage Circle, founded in 2010, is a global employee engagement technology and services provider operating across four core product lines: Vantage Recognition (recognition and rewards), Vantage Fit (corporate wellness), Vantage Pulse (employee listening and feedback) and Vantage Perks (employee savings and benefits). We also offer strategic service layers that support program effectiveness, including AIRe Advisory (recognition program audit, design and consulting), Vantage Edge (program success management) and Vantage Swags (corporate gifting). Today, we serve 700+ enterprise clients across 100+ countries, including Deloitte, Charles Schwab, Infosys, Wipro, TCS, LTIMindtree, Amdocs and Tata Communications, supporting over 3.2 million employees. With a global team of approximately 300 professionals, we combine behavioral science, technology, consulting and data-driven insights to help organizations strengthen culture, improve engagement and enhance retention.
> *All client references are used with the organization's consent.*

*Source: Wells Fargo P1 Q3.3 (Vijay/Prashansha)*

---

## 3. Gift cards & catalogue

**Country-specific gift cards** (P2 Q8.34)
> Vantage Circle provides culturally relevant, locally redeemable, country-specific gift cards across 100+ countries. Our global gift card catalogue is sourced through live API integrations with global gift card aggregators, regional players and country-specific partners. All gift cards are issued in-country, in local currency, ensuring seamless redemption without cross-border restrictions, customs considerations or additional fees. The vast majority are delivered instantly, allowing employees to redeem their rewards immediately.

**Face value** (P2 Q8.12–8.15)
> Vantage Circle always offers e-gift cards at face value in the local currency, with no deductions, surcharges or processing fees. Employees always receive the full face value on all e-gift cards.

**Custom catalogue** (P2 Q8.35)
> Our global catalogue is fully customizable, and we routinely add new gift cards, merchandise, experiences and charitable organizations based on client requirements. New SKUs, categories and brands can be added on request. Catalogue settings are controlled centrally by [Client] administrators, ensuring global consistency while preserving regional flexibility.

**Partner ecosystem & single accountability** (P1 Q6.8, P2 Q8.57)
> Our fulfilment partners include Tango Card (Blackhawk Network), Pine Labs/Qwikcilver, YouGotaGift, Amazon, Snappy and other vetted providers across geographies. Regardless of the partner involved, Vantage Circle remains fully accountable for end-to-end delivery and is the sole contracting entity — [Client] never needs to engage a third-party fulfilment partner directly.

**Delivery timelines**
> Digital e-codes: instant or near real-time (brand T&Cs allow up to 24 hours in exceptional cases). Physical merchandise: dispatched within 1–3 business days, delivered per local supplier SLAs.

⚠ **Pricing stance conflict:** the standard line is "face value, no markup, zero fees". When an RFP asks for *discounts* (e.g. Infosys), this line must be replaced by the agreed discount structure — get commercial sign-off.

---

## 4. Billing, invoicing & settlement

**Billing on issuance vs redemption** (P2 Q6.28, Nikhil)
> Our platform supports both billing on issuance and billing on redemption, and allows these models to coexist across different program types, so each program can be configured for the best fit with tax compliance and accounting practices. Under billing on redemption, invoices and reports are driven by actual redemption data (item, value, date, employee).

**Invoice flexibility** (P1 Q15.13, P2 Q6.40/6.44/8.53)
> We can issue a single consolidated invoice or region-, country- or legal-entity-specific invoices in local currency. We support global clients such as Wipro and Amdocs, which operate across multiple countries and legal entities, with invoicing models tailored to their finance and chargeback structures.
> ⚠ The original text says "points issued" — reword to "redeemed" for redemption-billed bids.

**Invoice itemisation** (P2 Q6.62)
> Every redemption generates a transaction record — employee details, entity/department, reward selected, value, applicable shipping and taxes, and redemption date and time — producing a clean, auditable invoice package itemised per employee and per entity.

**Procurement** (P1 Q15.11–15.19) — cXML and REST purchase orders; invoice per PO line; SFTP billing file supported; supplier responsible for applicable GST/VAT.

---

## 5. Tax & compliance

**India GST** (P2 Q8.54)
> All gift card and merchandise redemptions processed through our India catalogue comply with GST guidelines. GST is applied as mandated by Indian tax authorities, our local supplier partners issue GST-compliant invoices, and Vantage Circle has a locally registered entity in India.

**Closed-loop vouchers / RBI** (P1 Q5.11)
> Vantage Circle does not issue open-loop stored-value instruments. Closed-loop brand vouchers are issued by the brands and their authorised issuers/aggregators, who hold the applicable regulatory authorisations.

**Tax data support** (P2 Q6.17)
> Vantage Circle does not interpret tax law or perform statutory filings. We provide structured, auditable data, configurable workflows and integration-ready exports so [Client]'s tax and payroll teams can meet their obligations. (Example: delayed gift-card activation for Ireland to support employer tax reporting.)

**Security & privacy certifications** (P2 Q8.49/8.51, Kongkona)
> We are certified for SOC 2 Type II, ISO 27001 (Information Security Management) and ISO 27701 (Privacy Information Management), with regular external audits, and comply with GDPR, CCPA and India's DPDPA.

**Incident notification** (P2 Q4.113)
> Clients are notified within 24 hours of confirming any data breach or major outage, with a formal root-cause analysis shared afterwards.

---

## 6. Support & SLAs

**SLAs** (P1 Q6.6)
> Platform availability: 99.9% uptime (total minutes in month minus unplanned downtime, divided by total minutes). Critical issues: response within 1 hour, resolution target 8 hours. High/Medium: response within 4 hours, resolution within 24–72 hours. Digital e-codes: instant or near real-time.

**Support model** (P1 Q10.6, P2 Q10.21)
> 24×7×365 support via email (support@vantagecircle.com), live chat, phone and a self-service help centre. Human agents in English, Spanish and Hindi, with AI translation across 70+ languages. Tickets are managed in Freshdesk with L1/L2/L3 escalation.

**Account team** (P1 Q7.1)
> Executive Sponsor, Account Director, Customer Success Manager, Technical Account Manager, Rewards Operations (catalogue, partner SLAs, fulfilment exceptions) and an Analytics lead, with weekly/monthly reviews and QBRs.

**Escalation matrix** — Agent → Supervisor → Regional CSM → TAM → Account Director → Executive Sponsor.

⚠ Acknowledgement time has been stated as both "2 hours" and "2–6 hours" — pick one per bid.

---

## 7. Technology & integrations
- **SSO:** SAML 2.0 / OAuth 2.0 with Entra ID, Okta, AD; SSO-only enforcement available.
- **Provisioning:** SCIM 2.0 (Azure), HRIS REST API, Workday RaaS/WWS, ADP.
- **APIs:** Bulk Award Points v3.0, Gift Cards v1.1, Partner Redemption, Reporting API (Power BI/Tableau). Specs in `product-information/specs/`.
- **Reporting:** HR admin dashboard (24h refresh) with redemption, points, budget and utilisation reports; segmentation by country/BU/location; scheduled emailed reports; CSV/Excel export.
- **Collaboration:** Microsoft Teams, Outlook, SharePoint, Slack.
- **Mobile:** iOS and Android.

---

## 8. Implementation
> We recommend a phased approach with a pilot, delivered in agile increments: Kickoff & Discovery → Design/Configure → Testing (UAT) → Training & Change Management → Go-live → Hypercare. All implementation, onboarding and training are included at no additional cost.

Typical timelines: full R&R platform 6–9 months; redemption-only/back-end integration 2–4 weeks (see `pre-built-solutions/blueprints/2026-08-18-external-recognition-redemption-backend.md`).

---

## 9. References & case studies
- **Wipro** — 230,000+ employees, 66 countries, since 2019; 553,000+ recognitions; Brandon Hall HCM Gold 2024.
- **Deloitte** — 4 countries, 100,000+ US employees, renewed to 2027.
- **Amdocs** — multi-country, contract 2023–2027.
- **TCS North America** — gift-card-redemption-only program.
⚠ Contacts are in the Wells Fargo source; re-confirm consent with Atif for every bid.

---

## 10. Clarification-question style
Use a short topic label, then a polite, specific question:
> **Regional Coverage:** Beyond India and the US, what other countries require redemption support, and what is the approximate volume split across regions?
