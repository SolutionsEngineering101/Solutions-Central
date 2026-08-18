---
title: "External Recognition Platform → VC Redemption Backend"
date: 2026-08-18
author: "Hemanga Bharadwaj"
domain: "Rewards & Redemption / API Integration"
client_type: "Companies running their own recognition platform with no redemption catalog"
tags: [api, bulk-award-points, sso, redemption, gift-cards]
artifact: "https://claude.ai/code/artifact/16663ae2-39f0-491b-8e87-4341fd43e398"
artifact_label: "Open the formatted options doc"
---

# External Recognition Platform → VC Redemption Backend

## Use Case

A prospect already runs recognition on their own platform and already issues points to
employees. They have no redemption catalog and no intent to build fulfilment. They want
Vantage Circle to sit behind their platform as the place points turn into rewards.

Their recognition layer stays untouched. The only real decisions are **where the wallet
lives** and **who owns the redemption screen** — those two answers drive ~90% of the build
effort on both sides.

## Solution Overview

Three options. Recommend A, keep B available permanently, deprioritise C.

| Option | Wallet lives | Redemption screen | They build | Time to live | Verdict |
|---|---|---|---|---|---|
| **A · Points push + SSO** | Vantage Circle | VC platform | One API call + SSO | 2–4 weeks | **Recommend** |
| **B · Manual upload + SSO** | Vantage Circle | VC platform | SSO only | Days | Always available |
| **C · Embedded gift cards** | Their side | Their UI | Catalog, checkout, fulfilment | Quarter+ | Phase 2 |

A and B share one destination — only how points get in differs. B is not a throwaway
prototype; it is A with a human standing in for one API call. Nothing is rebuilt on graduation.

## Components

### Option A — Points push + SSO (recommended)

- [ ] `POST /v1/award/bulkpoints` fired per recognition event
- [ ] "Redeem now" link in the award email they already send
- [ ] SSO (SAML / OIDC) into the VC platform
- [ ] User provisioning — SCIM 2.0 (Azure AD) or HRIS `POST /api/employee/v4/addOrUpdate`
- [ ] Optional read-only balance in their UI via `GET /v1/award/employee/points`

Points live only in the VC wallet. Their UI shows no wallet by default — this keeps the two
systems from disagreeing about a number. Read-only display is safe; a second writable
ledger is not, and we should decline it.

### Option B — Manual upload + SSO

Same architecture, CSV upload via the VC admin console instead of the API call. Fits a
week-one pilot, one-off bonus rounds, and low-volume clients. Breaks down on award-to-wallet
lag, and has **no idempotency key** — a re-uploaded file is a real double-credit risk.

### Option C — Embedded gift cards (phase 2)

`GET /v1/giftcard/products` + `POST /v1/giftcard/order` rendered inside their own product.
Two honest limitations: it is **gift cards only** (no perks, merch, experiences, or engagement
surface), and they inherit catalog UI, cart, order lifecycle, failure states and support load.

## Implementation Steps

1. Agree the points peg before any code (see Caveats).
2. Stand up provisioning first — SCIM or HRIS v4. This is the critical path, not the points API.
3. Configure SSO; confirm the post-login landing page is the redemption catalog.
4. Sandbox `partner-api.vantagecircle.co.in`: OAuth2 `client_credentials`, refresh-token handling.
5. Pilot on Option B with a real CSV to validate the redeem experience end to end.
6. Cut over to `POST /v1/award/bulkpoints` per event, keyed on `client_reference`.
7. Reconcile daily via `batch_id` + `GET /v1/award/bulkorder/details`.

## Real-time vs Scheduled — recommend real-time

The endpoint is named "bulk" but `list_of_nominations` accepts an array of one, so a
single-award call is legitimate. Fire per event because:

- **`client_reference` is a documented idempotency key** — unique per nomination, explicitly
  there to "prevent accidental order duplication". Retries are safe *by design*, which is the
  spec signalling that per-event calls are intended.
- **Recognition decays fast.** Points landing seconds after the shout-out is the product
  experience; points landing tomorrow is a payroll entry.
- **Auditability is unchanged.** `batch_id` + batch details gives per-employee status at any size.

Keep scheduled batching for genuinely periodic programmes — quarterly awards, tenure
milestones, annual allowances. Clean compromise to offer: **real-time for recognition events,
nightly batch for HR-driven allocations**, one `batch_id` per day for reconciliation.

## Email Behaviour

The award payload carries `employee_name` and `reason`; the spec states `reason` is "used in
email and also appears in the statement". **VC sends an award email by default**, including to
unregistered employees — that is the registration on-ramp. If their platform also notifies,
employees get two emails per award.

**No suppression flag is documented.** Do not promise one. Say we control the VC-side email and
will confirm with engineering whether it can be suppressed or co-branded.

Division that works: **they own the recognition email** (their moment, their brand);
**we own the redemption email** (it carries the SSO link that drives the redeem action).

## Not This Pattern — Partner Redemption API

`vc-partner-redemption-api-v1.0.md` runs the *opposite* direction and is the SwitchFly pattern.
It pairs with `vc-partner-brand-integration-oauth2-api-v2.0.md` as one flow:

1. Employee clicks **GET OFFER** on the VC platform; VC redirects to the partner with an
   `authorization_code`.
2. Partner exchanges it at `POST /v2/oauth2/user/info` → `{ name, email, user_id, return_url }`.
3. Employee orders on the partner store.
4. Partner calls `POST /v1/placeOrderUpdatePoints` with that same numeric `user_id` to debit
   the VC wallet.

It presumes **we hold the wallet and own the redeeming user**, with the partner as a merchant we
send traffic to. A points *source* with no catalog is the mirror image — wrong direction.
Worth mentioning as a future path if they ever build a storefront.

## Suggested Attachments

- `product-information/specs/vc-bulk-award-points-api-v3.0.md`
- `product-information/specs/vc-hris-user-data-integration.md`
- `product-information/specs/vc-scim-2.0-azure.md`
- `product-information/specs/vc-gift-cards-api-v1.1.md` (phase 2 only)
- `product-information/specs/vc-points-currency-conversion-rates.md` (peg conversation)

## Caveats / Constraints

- **Points peg.** ~76% of clients run 1 pt = 1 unit of local currency; 26 run 100 pts = 1 unit;
  27 use custom per-country maps. Their internal scale probably isn't ours — agree it first.
- **`country_id` is per batch, not per employee.** Multi-country means one call per country;
  a mismatch surfaces as `DIFFERENT_COUNTRY`.
- **Points expire.** Statements carry a "Valid till" date. Confirm the window and who
  communicates it.
- **Tokens expire in 3600s.** Refresh-token handling required, not a hardcoded token.
- **Awarding precedes registration.** `NOT_REGISTERED` is a valid status, but SSO needs
  identities in place — provisioning gates go-live.
- **Strategic:** if the employee never lands on our platform (Option C), we lose the engagement
  surface — catalog, perks, data, and the renewal conversation.

## Past Usage

- First documented 2026-08-18 — pattern derived from spec review, not yet deployed with a client.
