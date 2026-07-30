# KGeN Gaming Titles — Reward Category Evaluation

## Document Details
- **Date:** 2026-07-30
- **Source:** Inbound email — KGeN (Shikha Battoo, AVP-New Initiatives), forwarded by Partha Neog
- **Type:** Category evaluation / decision record
- **Area:** Rewards Marketplace — Redemption supply
- **Prepared by:** Hemanga Bharadwaj

## When This Is Relevant
- A reward supply partner pitches gaming as a new redemption category
- A client or RFP asks whether we support gaming rewards, and in which geographies
- Anyone proposes a separate integration for a niche redemption category and we need the volume bar it has to clear

## Core Finding
**96.5% of gaming redemptions are platform wallet top-ups, not game purchases.** Employees load a
PSN / Xbox / Nintendo / Steam / Google Play wallet and choose their own game. They do not want a
third party selecting the title. Any gaming supply proposition that sells *game keys* is selling into
a format our users have not shown appetite for.

## Trigger
Inbound approach from KGeN (Shikha Battoo, AVP-New Initiatives, ex-Vantage Circle) offering premium
PC/console gaming titles — Human Fall Flat, For The King II, Blazing Sails, Airport Sim, Strange
Horticulture, Circle Empires 2, Legend of Khiimori — for the rewards catalogue. Not available via
Quicksilver, so a separate integration would be required. Forwarded by Partha Neog asking whether
there is demand or opportunity in gaming.

## Evidence

### Client demand: none
Across 286 solution requests and the RFPs on file, **no client has ever asked for gaming titles as a
reward.** The only two gaming mentions are geography-availability questions about the existing Games
category (supplied by RewardTheWorld):
- `intake/solutions-forms/SF-2025-03-25-005.md` — Hershey's RFP (Mar 2025). Games available in US +
  ~27 European countries. No India, no APAC.
- `intake/solutions-forms/SF-2025-08-28-115.md` — CQ Fluency (Aug 2025). Prospect asked about LATAM
  (Brazil, Argentina, Colombia, Egypt) — Games not available in any of them.

Not a match: `intake/solutions-forms/SF-2026-05-15-256.md` (DHL "Gamification of Awards") is award
gamification mechanics, unrelated to gaming rewards.

### Redemption behaviour
Source: `~/venice/projects/breakage-tool/data/store.parquet` — 2,194,411 deduped cards,
Nov 2024 – 30 Jun 2026. Gaming brands identified across ~50 SKUs out of 2,097 distinct brands.

| Metric | Value |
|---|---|
| Gaming cards | 3,321 (0.15% of all cards) |
| Distinct employees redeeming gaming | 1,398 of 495,054 (0.28%) |
| Repeat gaming redeemers (2+ cards) | 715 of 1,398 |
| **Platform currency / wallet** | **3,205 (96.5%)** |
| Retail store credit (GameStop, EB Games) | 116 (3.4%) |
| Direct game-key purchases | effectively zero |

**By ecosystem:** PlayStation 43.9%, Nintendo 18.7%, Xbox 13.0%, Google Play 10.1%, Roblox 7.1%,
retail 3.4%, Steam 1.4%. **By platform: console 75.6%, mobile 10.1%, PC 2.0%.**

**By geography:** USD 2,702 cards (gaming = 0.88% of US volume), BRL 207, EUR 90, CAD 72, GBP 72,
MXN 61. Median denomination USD 50 (mean 43, cap 100) — wallet-topping behaviour.

**Growth:** cards issued by quarter — 187 → 571 → 975 → 684 → 904. Roughly 5x across five quarters,
with a Q1-2026 dip. Real growth, tiny base.

**Concentration:** Deloitte alone accounts for 1,625 of 3,321 gaming cards (49%), then LPL Financial
(424), Amdocs (309), Wipro (287). Closer to one client's habit than a broad trend.

**Breakage:** on mature cohorts (redeemed before Jan 2026), gaming breaks at 2.1% vs 2.2% overall.
In line — employees who choose gaming do use it. The problem is how few of them there are.

### India — the market KGeN pitches
India is **80.7% of our total card volume (1.77M cards)** and has produced **4 gaming redemptions
ever**, all in Mar–May 2026, all currency rather than titles:

| Brand | Company | Date | Amount |
|---|---|---|---|
| Valorant Gift Card 1000 VP | Wipro | 2026-05-20 | ₹950 |
| Valorant Gift Card 2575 VP | Deloitte | 2026-05-22 | ₹2,375 |
| Riot Valorant 415 INR Digital Code | Qualitest | 2026-05-09 | ₹415 |
| INR 50 Razer Gold Gift Card | Renault Nissan | 2026-03-25 | ₹50 |

India's top brands are entirely utility and commerce — Amazon Pay, Amazon Shopping, Myntra, Zomato,
Swiggy, Flipkart. No gaming anywhere near the top.

Market context: India is ~79% mobile gaming revenue, with only ~39M PC gamers and ~20M console
gamers (3.38%). A PC/console title proposition is aimed at the smallest slice of that market.

## Decision
**Do not greenlight a separate integration for game titles.** No client demand, 0.15% of volume,
0.28% employee penetration, wrong format, and the target geography is where we have effectively zero
gaming demand. We already carry Steam Wallet, PSN, Xbox, Nintendo eShop, Google Play, Roblox, Razer
Gold, Garena, Riot/Valorant and Blizzard through existing partners.

**Worth a 30-minute call** on two other angles: (a) India mobile gaming *currency* supply — BGMI,
Free Fire, Valorant top-ups — which matches the only real India signal we have; (b) their Proof of
Gamer verified user-acquisition / data business, unrelated to rewards.

**Cheaper test first:** our India gaming SKUs only went live around Mar 2026. Merchandise them for
2–3 quarters before concluding India has no gaming appetite.

## Partner Due Diligence — KGeN
- Kratos Gamer Network, founded 2022 in Bangalore by Manish Agarwal and Ishank Gupta. Owner of the
  IndiGG gaming DAO.
- ~$42.8M raised across 4 rounds (Prosus Ventures, Jump Crypto, Accel), incl. $13.5M Sept 2025 at a
  reported ~$500M valuation. Reported revenue run-rate ~$48M, claimed ~$80M by Jan 2026.
- Core product is a Web3 "Proof of Gamer" reputation protocol on Aptos, sold as verified user
  acquisition to game publishers, with a $KGEN token.
- **kgen.io today positions the company as a verified-human AI training-data network** for Physical
  AI and LLMs. Gaming, rewards, loyalty and Exlr8now do not appear on the site.
- **"Exlr8now" has no public footprint** — no site, no coverage, no catalogue found.
- Approach originates from an AVP-New Initiatives, i.e. an exploratory side motion.

Well-funded company; this specific product line is unproven.

## Caveats
- Ledger ends 30 Jun 2026. Recent cohorts are right-censored, so breakage figures use mature cohorts
  (redeemed before Jan 2026) only.
- Brand classification is regex-based over 2,097 brand strings; false positives (IKEA, Gamma,
  Wagamama, Epic On) were excluded manually. Small misclassifications possible at the tail.
- India gaming SKUs have only ~3 months of shelf time — "no demand" is not yet a safe conclusion for
  India, only "no demand observed".
- Gaming volume is 49% one client (Deloitte). Treat aggregate gaming trends with that in mind.
- The structural finding — currency over titles, console over PC, US over India — should be re-tested
  annually, not assumed permanent. The category is growing ~5x off a small base.

## References
- `intake/solutions-forms/SF-2025-03-25-005.md` — Hershey's, Games geo availability
- `intake/solutions-forms/SF-2025-08-28-115.md` — CQ Fluency, LATAM marketplace options
- `rfps/entries/2026-06-30-global-recognition-program-rfp-part-2-of-21.md:463` — partner ecosystem;
  RewardtheWorld listed as the Europe-focused Books/Music/Games partner
- `rfps/entries/2026-06-30-global-recognition-program-rfp-part-2-of-21.md:358` — Steam Wallet is a
  top-10 redeemed gift card in the Philippines
- `product-information/specs/vc-partner-brand-integration-oauth2-api-v2.0.md` — standard partner
  brand integration path
- `product-information/specs/vc-partner-redemption-api-v1.0.md` — standard partner redemption path
- `~/venice/projects/breakage-tool/data/store.parquet` — redemption ledger (outside this repo)
