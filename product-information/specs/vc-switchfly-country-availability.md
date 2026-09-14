---
title: "Switchfly — Country Availability (VC Experiences & Travel)"
date: 2026-09-14
domain: "Redemption / Experiences & Travel"
source: "Switchfly Final Mapping as on 28th March'25 (Final Mapping).csv"
data_as_of: 2025-03-28
tags: [switchfly, experiences, travel, redemption, country-availability]
---

# Switchfly — Country Availability

The **37 countries** in which Vantage Circle can offer Switchfly experiences. Switchfly is
the **travel and experiences** catalogue — hotels, activities and car hire. It is a dynamic,
real-time catalogue (benchmarked against Expedia/Viator) surfaced by redirecting the employee
to the partner platform.

> **Not to be confused with Reward the World**, which is the *digital* catalogue — audiobooks,
> eBooks, eMagazines, mobile top-up, movies, software, games, music and gift cards — and has a
> completely different country matrix. See
> [`../../intake/solutions-forms/SF-2025-03-25-005.md`](../../intake/solutions-forms/SF-2025-03-25-005.md)
> for the Reward the World per-category country list.

**Data as of 28 March 2025.** Re-confirm with the partner before quoting in a live RFP or
contract — country coverage, currencies and rollout phases may have moved since.

## Availability Matrix

| # | Country | Currency in VC | Region | Rollout Phase | Hotels | Activities | Car |
|---|---|---|---|---|---|---|---|
| 1 | Australia | AUD | Australia | 1 | Yes | Yes | Yes |
| 2 | Austria | EUR | Europe | 2 | Yes | Yes | Yes |
| 3 | Belgium | EUR | Europe | 2 | Yes | Yes | Yes |
| 4 | Brazil | BRL | South America | 1 | Yes | Yes | Yes |
| 5 | Canada | CAD | North America | 1 | Yes | Yes | Yes |
| 6 | Colombia | COP | South America | 3 | Yes | Yes | Yes |
| 7 | Costa Rica | CRC | North America - Central | 1 | Yes | Yes | Yes |
| 8 | Croatia | EUR | Europe | 2 | Yes | Yes | Yes |
| 9 | Dominican Republic | DOP | North America - Caribbean | 2 | Yes | Yes | Yes |
| 10 | Finland | EUR | Europe | 2 | Yes | Yes | Yes |
| 11 | France | EUR | Europe | 1 | Yes | Yes | Yes |
| 12 | Germany | EUR | Europe | 1 | Yes | Yes | Yes |
| 13 | India | INR | Asia | 1 | Yes | Yes | **Disabled** |
| 14 | Indonesia | IDR | Asia | 2 | Yes | Yes | Yes |
| 15 | Ireland | EUR | Europe | 1 | Yes | Yes | Yes |
| 16 | Israel | ILS | Asia | 1 | Yes | Yes | Yes |
| 17 | Italy | EUR | Europe | 1 | Yes | Yes | Yes |
| 18 | Japan | JPY | Asia | 1 | Yes | Yes | Yes |
| 19 | Luxembourg | EUR | Europe | 2 | Yes | Yes | Yes |
| 20 | Malaysia | MYR | Asia | 1 | Yes | Yes | Yes |
| 21 | Mexico | MXN | North America | 1 | Yes | Yes | Yes |
| 22 | Netherlands | EUR | Europe | 2 | Yes | Yes | Yes |
| 23 | New Zealand | NZD | Australia | 2 | Yes | Yes | Yes |
| 24 | Norway | NOK | Europe | 2 | Yes | Yes | Yes |
| 25 | Peru | PEN | South America | 3 | Yes | Yes | Yes |
| 26 | Philippines | PHP | Asia | 1 | Yes | Yes | Yes |
| 27 | Poland | PLN | Europe | 2 | Yes | Yes | Yes |
| 28 | Portugal | EUR | Europe | 2 | Yes | Yes | Yes |
| 29 | Singapore | SGD | Asia | 2 | Yes | Yes | Yes |
| 30 | South Africa | ZAR | Africa | 3 | Yes | Yes | Yes |
| 31 | Spain | EUR | Europe | 2 | Yes | Yes | Yes |
| 32 | Thailand | THB | Asia | 2 | Yes | Yes | Yes |
| 33 | United Arab Emirates | AED | Asia | 1 | Yes | Yes | Yes |
| 34 | United Kingdom | GBP | Europe | 1 | Yes | Yes | Yes |
| 35 | United States | USD | North America | 1 | Yes | Yes | Yes |
| 36 | Uruguay | UYU | South America | 2 | Yes | Yes | Yes |
| 37 | Vietnam | VND | Asia | 2 | Yes | Yes | Yes |

## Rollout Phases

| Phase | Countries | Beneficiary Users | Markets |
|---|---|---|---|
| 1 | 17 | 2,321,412 | Australia, Brazil, Canada, Costa Rica, France, Germany, India, Ireland, Israel, Italy, Japan, Malaysia, Mexico, Philippines, United Arab Emirates, United Kingdom, United States |
| 2 | 17 | 20,014 | Austria, Belgium, Croatia, Dominican Republic, Finland, Indonesia, Luxembourg, Netherlands, New Zealand, Norway, Poland, Portugal, Singapore, Spain, Thailand, Uruguay, Vietnam |
| 3 | 3 | 1,203 | Colombia, Peru, South Africa |

Phase 1 carries **99.1%** of beneficiary users (2,321,412 of 2,342,629) — driven almost entirely
by India (2,048,070) and the United States (193,760).

## Regional Spread

| Region | Countries |
|---|---|
| Europe | 15 |
| Asia | 10 |
| South America | 4 |
| North America | 3 |
| Australia | 2 |
| North America - Central | 1 |
| North America - Caribbean | 1 |
| Africa | 1 |

## Notes & Caveats

- **India — car hire is `disabled`.** This is the only product exclusion anywhere in the matrix;
  every other country/product cell is live. Hotels and activities are available in India.
- **26 distinct currencies** across 37 countries — EUR covers 12 European markets (Austria,
  Belgium, Croatia, Finland, France, Germany, Ireland, Italy, Luxembourg, Netherlands, Portugal,
  Spain); the remaining 25 countries each use their own.
- **Switchfly cannot be geo-restricted to a single country.** It serves both domestic and
  international inventory by design. Clients needing India-only experiences (e.g. HUL) were
  routed to Hammock Holidays instead — see
  [`../../intake/solutions-forms/SF-2025-07-30-082.md`](../../intake/solutions-forms/SF-2025-07-30-082.md).
- Because the catalogue is a real-time redirect to the partner, individual inventory within a
  supported country is always current — this matrix governs *country enablement*, not inventory.

## References

- `intake/solutions-forms/SF-2025-03-25-005.md` — Hershey's RFP; Switchfly vs Reward the World
- `intake/solutions-forms/SF-2025-07-30-082.md` — HUL; Switchfly vs Hammock Holidays
- `pre-built-solutions/blueprints/2026-08-18-external-recognition-redemption-backend.md` — the
  partner-redirect OAuth pattern Switchfly follows
- Internal SPOC: Bhargav Nath (`skills/member/bhargav-nath.md`)
