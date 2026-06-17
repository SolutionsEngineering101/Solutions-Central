---
title: "Vantage Circle — SCIM 2.0 Azure Provisioning"
date: 2026-06-17
domain: "API Documentation"
source: "SCIM 2.0 Vantage Circle Azure Documentation.pdf"
tags: [api, scim, azure, provisioning, integration]
---

# SCIM 2.0 — Microsoft Azure AD Integration

Step-by-step guide for configuring SCIM 2.0 automated user provisioning between Azure Active Directory and Vantage Circle.

## Architecture

The System for Cross-domain Identity Management (SCIM) specification is designed to make managing user identities in cloud-based applications easier. Azure AD acts as the Identity Provider (IdP) and pushes user data to Vantage Circle via standard SCIM 2.0 REST operations (GET, POST, PATCH, PUT, DELETE) over the `/Users` endpoint.

| Component | Role |
|---|---|
| Azure Active Directory | Identity Provider — source of user records |
| SCIM 2.0 Connector | Translates Azure AD provisioning actions to REST calls |
| Vantage Circle | Service Provider — receives and stores user data |

## Base URL & Authentication

### Tenant URL (Base URL)

| Environment | URL |
|---|---|
| UAT | `https://scim.vantagecircle.co.in/api/v1/scim` |
| Production | `https://scim.vantagecircle.com/api/v1/scim` |

### Authentication

Azure AD uses **Bearer Token** (Secret Token) authentication for SCIM provisioning.

| Field | Value |
|---|---|
| Authentication Method | Bearer Token (Base64-encoded) |
| Secret Token | Provided by Vantage Circle POC |
| User Attributes | Provided by Vantage Circle POC |
| **Token Format** | Secret Token = `Base64("username:password")` — the Base64 string of your VC-issued credentials. Azure sends this as `"Authorization: Bearer <token>"` and the VC SCIM endpoint decodes it as Basic Auth. |

> **Note:** All required details — Tenant URL, Secret Token, and user attributes — will be provided by the Vantage Circle POC.

## STEP 1 — Create an Enterprise Application in Azure AD

Sign in to the Azure Portal and navigate to **Azure Active Directory → Enterprise Applications → New Application**. Select "Create your own application", enter a name (e.g. Vantage Circle), choose "Integrate any other application you don't find in the gallery (Non-gallery)", and click Create.

| Field | Value |
|---|---|
| App Name | Vantage Circle (or any name chosen by the client) |
| Application Type | Non-gallery (Integrate any other application) |

## STEP 2 — Configure Provisioning — Enter Admin Credentials

Inside the newly created application, navigate to **Provisioning** in the left menu. Click "Get started", set Provisioning Mode to Automatic, then expand Admin Credentials and enter the Tenant URL and Secret Token provided by the Vantage Circle POC.

| Field | Value |
|---|---|
| Provisioning Mode | Automatic |
| Tenant URL | `https://scim.vantagecircle.com/api/v1/scim` |
| Secret Token | Provided by Vantage Circle POC |

## STEP 3 — Test the Connection and Save

Click **Test Connection** to verify that Azure AD can reach the Vantage Circle SCIM endpoint. A success message confirms the credentials are valid. Click Save to persist the configuration.

| Capability | Supported |
|---|---|
| Create Users | Yes |
| Update User Attributes | Yes — via PUT only. Azure sends updates as PATCH which is not currently supported (returns 405). Attribute updates require a full PUT request. |
| Deactivate Users | Yes — via DELETE or PUT (active=false). Azure delivers deactivations as PATCH (returns 405). Manual deactivation via DELETE works correctly. |
| Import Users | No — VC is Service Provider only. Read endpoints exist solely for Azure matching; no inbound sync-back path. |
| Push Groups | No |

## STEP 4 — Configure Provisioning Settings

Under the Settings section, set the Scope to "Sync only assigned users and groups" so that only users explicitly assigned to the application are provisioned to Vantage Circle. Optionally enable email notifications for provisioning failures.

| Setting | Recommended Value |
|---|---|
| Provisioning Mode | Automatic |
| Scope | Sync only assigned users and groups |
| Send email notification on failure | Enabled (recommended) |
| Provision Azure Active Directory Users | Yes |
| Provision Azure Active Directory Groups | No |

## STEP 5 — Configure Attribute Mappings

Click "Provision Azure Active Directory Users" under the Mappings section. Review and configure the attribute mappings to ensure the fields required by Vantage Circle are correctly mapped from Azure AD. Add any custom attributes provided by the Vantage Circle POC.

| Azure AD Attribute | Vantage Circle Attribute | Notes / Code Verdict |
|---|---|---|
| `userPrincipalName` | `userName` | **1 (Primary)** Verified. Used as login and email. Filter matching currently broken — surrounding quotes prevent `userName eq "..."` from matching stored login. See Known Limitations #2. |
| `givenName` | `name.givenName` | **Required** Required field. Provisioning fails with HTTP 500 if omitted from the Azure payload. Ensure givenName is always mapped. |
| `surname` | `name.familyName` | **Required** Required field. Provisioning fails with HTTP 500 if omitted. Ensure surname/familyName is always mapped. |
| `mail` | `emails[type eq "work"].value` | — Parsed by VC but not stored. Vantage Circle keys off userName (UPN) as the email address. This field has no effect unless UPN differs from mail. |
| `Switch([IsSoftDeleted], ...)` | `active` | — Read correctly. However, deactivation (active=false) is delivered by Azure as PATCH, which returns 405. Only takes effect via DELETE or PUT. See Known Limitations #1. |
| `[ custom attributes ]` | `[ as provided by VC POC ]` | — Supported via enterprise extension: `department`, `employeeNumber`, `gender`, `city`, `employeeId`, `reportingManager`, `gradeGroup`, `dob`, `doj`. |

## STEP 6 — Assign Users and Groups to the Application

Navigate to **Users and groups** in the left menu. Click Add user/group, search for and select the users or Azure AD groups that should be provisioned to Vantage Circle, then click Assign.

| Object Type | How to Assign |
|---|---|
| Individual User | Add user/group → search by name or email → Assign |
| Azure AD Group | Add user/group → search for group name → Assign |

## STEP 7 — Turn Provisioning Status to "On"

Return to the Provisioning page. Toggle the Provisioning Status to On and click Save. Azure AD will begin an initial sync cycle, creating all assigned users in Vantage Circle. Subsequent incremental cycles run automatically every ~40 minutes.

| Action | Description |
|---|---|
| Provisioning Status → On | Starts the initial full sync cycle |
| View provisioning logs | Monitor sync progress and errors |
| Restart provisioning | Re-triggers a full sync if needed |

> **Note:** The initial sync may take some time depending on the number of users. Monitor progress via View provisioning logs to check for any errors.

## Endpoint Reference

The following SCIM 2.0 endpoints are available on the Vantage Circle SCIM server. All endpoints require Basic Auth (Bearer Token = Base64-encoded credentials).

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/api/v1/scim/Users/:id` | `fetchUser` | Fetch a single user by internal ID |
| `GET` | `/api/v1/scim/Users` | `fetchUsers` | List users or filter by userName (Azure test-connection) |
| `POST` | `/api/v1/scim/Users` | `createUser2` | Create a new user; deduplicates by email + companyId |
| `PUT` | `/api/v1/scim/Users/:id` | `updateUser2` | Full update of an existing user by email |
| `DELETE` | `/api/v1/scim/Users/:id` | `deleteUser` | Deactivate a user (sets status=false) |
| `GET` | `/api/v1/scim/ServiceProviderConfig` | `fetchServiceProviderConfig` | Returns static SCIM capability config |
| `GET` | `/api/v1/scim/ResourceTypes` | `fetchResourceTypes` | Returns supported resource type definitions |

> **Note:** No PATCH route exists. Azure provisioning actions that use PATCH (attribute updates and deactivations) will return HTTP 405.
