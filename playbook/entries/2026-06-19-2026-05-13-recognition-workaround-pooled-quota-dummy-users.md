# Playbook Entry — Pooled Quota Management via Dummy Users

## Entry Details
- **Date:** 2026-05-13
- **Product:** Recognition
- **Classification:** Workflow — Quota Management
- **Solution Type:** Workaround
- **Client Type:** Enterprise
- **Industry:** Technology / IT Consulting
- **Maturity:** First Instance
- **Effort:** High

## When to Use This
- Client requires quota to be managed at a common group level — shared across all employees in a group rather than held per nominator or approver
- Client has a grouped structure where multiple departments share a common group quota pool
- Quota must be deducted based on the nominee's or nominator's group
- **Note:** If quota is deducted from the **nominee's** group, this applies to individual awards only. If the client is okay with quota being deducted from the **nominator's** group, it can also support group or team awards.

## Core Capability
Dummy user accounts act as proxies for common group-level quota pools. Each group is represented by a dummy user who holds the quota. The Department table maps employees to their quota pool, enabling group-level quota deduction where the platform natively supports only user-level quota.

> **How grouping works:** A "group" in this context is a department or BU — whatever common grouping the client defines. The client must pass this grouping information in the **Department column** of the `employee_details` table. The same grouping must be configured as departments in the Department table. This solution hinges on the Department table, so if the client's grouping is not reflected in both places, it will not work.

## Problem Statement
The platform supports quota at the user level — a nominator or approver can be assigned a quota limiting how many awards they give or approve. There is no native mechanism to hold quota at a common group level, or to deduct it based on the nominee's or nominator's group.

This is a gap for clients who manage award quotas centrally per group — where the control logic is based on a shared pool (how many awards are available for this group this quarter) rather than per individual.

## Solution Approach
Dummy user accounts are created to represent each group and hold the common quota for that pool.

1. Obtain the group mapping from the client — a mapping of individual departments to their parent group, shared as a manual file at implementation and updated quarterly
2. Create one dummy user account per group (e.g., `GROUP_CX_USER`, `GROUP_SALES_USER`)
3. Allocate quota per award type to each dummy user based on values shared by the client
4. In the Department table, set the HOD field for each department to the dummy user email of its group — this is configured via the Admin Dashboard Department Configuration, not in the back end
5. Tech Ops writes reusable code to map the HOD field for quota deduction. As per client configuration, the nominee's or nominator's Department is identified → the HOD (dummy user) for that department is fetched → quota availability is checked → quota is deducted at the correct stage

**Deduction timing:**
| Award Type | Deduction Stage |
|---|---|
| Auto-approved | Immediately on nomination submission |
| Approval-based | After final approval |

## Features Used
- **Dummy user accounts** — used as quota holders (existing capability, previously used for pooled budget only)
- **Department Configuration** (Admin Dashboard) — HOD field maps departments to their group quota dummy user
- **User-level quota allocation** — applied to dummy users instead of real employees

## Custom Development Involved
**Yes** — Tech Ops writes reusable code to map the HOD field for quota deduction. This code identifies the nominee's or nominator's Department (as per client configuration), resolves the mapped dummy user via the HOD field, and deducts the quota at the correct stage based on the award type.

## Client Example
- **Client:** LTM
- **Industry:** Technology / IT Consulting
- **What they needed:** Award quota had to be managed at common group level, with multiple departments sharing one pool. Quota had to deduct based on the nominee's group. Two award types — Spot (auto-approved) and Star (two-level approval) — each with separate quota values per group.
- **How it played out:** Groups were set up with corresponding dummy users (e.g., CX, Sales, Solution Engineering). Quota was allocated per award type per dummy user. Department HOD fields were configured via the Admin Dashboard to map each department to its group dummy user. Tech Ops wrote the quota deduction logic — on submission for Spot, on final approval for Star. This was the first time common group quota (as distinct from pooled budget) was implemented on the platform.

## Reusability
- **Can this be reused?** Yes
- **For which client types or industries?** Any enterprise client requiring common group-level quota management for nomination-based awards, where quota pools are shared across departments within a group
- **What would need to change for reuse?** Group definitions, dummy user names, quota values, and deduction timing will differ per client. If pooled budget (not quota) is needed, the same dummy user approach applies using the budget module instead.

## Limitations & Edge Cases
- Manual maintenance — dummy user creation, quota allocation, and group mapping updates must all be done manually via the VC SPOC. Client should communicate changes no more than once per quarter.
- No quota visibility — nominators and approvers cannot see group quota balance. Dummy user balances are not surfaced to end users.
- Department change after nomination — quota is deducted based on the department at time of submission. Post-submission changes are not retroactively applied.
- Configuration gaps block nominations — if HOD is not configured or the dummy user is inactive, nominations will be blocked.
- **Individual vs group awards** — if quota is deducted from the nominee's department, this supports individual awards only. If quota is deducted from the nominator's department, group or team awards can also be supported.

## Related Documents
- Approach Note: BU-Level Quota Management — LTM (stored in client OneDrive)

## Entry Created By
- **Author:** Garima Kayal
- **Reviewed By:** —
