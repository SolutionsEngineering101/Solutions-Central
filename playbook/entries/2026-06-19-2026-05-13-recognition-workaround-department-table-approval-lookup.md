# Playbook Entry — Department Table as Approver Lookup

## Entry Details
- **Date:** 2026-05-13
- **Product:** Recognition
- **Classification:** Workflow — Config Driven
- **Solution Type:** Workaround
- **Client Type:** Enterprise
- **Industry:** Technology / IT Consulting
- **Maturity:** First Instance
- **Effort:** Medium

## When to Use This
- Client needs one or two levels of department-wide approvals routed to a role not available in the `employee_details` table
- The required approver is consistent across all employees in a department — not unique per employee
- Client cannot or will not share approver information per employee via API
- Client can share approver information at department or group level (e.g., via a mapping file)

## Core Capability
The Department table acts as a supplementary lookup layer — storing approver information at department level so the system can resolve the right approver without needing it per employee in the API payload.

## Problem Statement
The platform's approval workflow resolves approvers from the `employee_details` table. When the required approver information is not available in this table — and the client's API feed does not carry it per employee — the system has no native way to fetch it.

This gap appears when the approval hierarchy is defined at a group or department level rather than individually, or when the client's integration cannot pass the required approver data per employee.

## Solution Approach
Since the required approver is consistent across all employees in a department, it can be stored at department level rather than per employee.

1. Identify which approval levels cannot be resolved from `employee_details`
2. Confirm the approver is consistent per department — same approver for all employees in that department
3. Use the existing **Approver field** in the Department table for one level of approval routing
4. If a second level of approval is needed, use the Department SPOC field to map the second level approval
5. Populate the Department table with the approver emails per department — done manually at implementation and updated by the VC SPOC as needed
6. Tech Ops writes the routing logic to resolve each approval level from the configured Department table fields

## Features Used
- **Department Configuration** (Admin Dashboard) — Approver field used for approval routing; extended with Department SPOC field when a second level is required
- **Employee Department attribute** — used as the lookup key to the Department table

## Custom Development Involved
**Yes** — a new field, **Department SPOC**, was added to the Department table to support a second level of approval routing.

## Client Example
- **Client:** LTM
- **Industry:** Technology / IT Consulting
- **What they needed:** Two levels of approval for Star Award nominations, with both approvers defined at BU level and not available per employee via API
- **How it played out:** The existing Approver field was used for one approval level. A new Department SPOC field was added to the Department table for the second level. Each BU was configured with the relevant approver emails. Tech Ops wrote the routing logic to resolve both levels from the Department table. Both approval levels were successfully routed without per-employee API data.

## Reusability
- **Can this be reused?** Yes
- **For which client types or industries?** Any enterprise client where approval hierarchy is defined at department level and cannot be passed per employee via API
- **What would need to change for reuse?** The fields already exist. What is needed each time: the client's approver mapping per department, and Tech Ops to configure the Department table and write the workflow routing logic for that engagement

## Limitations & Edge Cases
- Approver updates are manual — changes must be communicated by the client and applied by the VC SPOC
- If the Department field is not configured or the approver is inactive, nominations will be blocked
- Works only when the approver is consistent per department — cannot handle cases where the approver varies per employee within the same department
- Department must be correctly populated in `employee_details` for the lookup to work

## Related Documents
- Approach Note: BU-Level Quota Management — LTM (stored in client OneDrive)

## Entry Created By
- **Author:** Garima Kayal
- **Reviewed By:** —
