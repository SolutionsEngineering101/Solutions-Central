---
title: "Vantage Circle — Lead Share OAuth API"
date: 2026-06-17
domain: "API Documentation"
source: "Lead share OAuth Documentation 1.pdf"
tags: [api, lead-share, oauth, integration]
---

# Partner OAuth2 API Reference

Integrate with Vantage Circle to authenticate your users and access their profile and lead data using the OAuth2 Authorization Code Grant flow.

## Overview

The integration is a two-step flow. After the user completes the Vantage Circle login/consent screen and is redirected back to your `redirect_uri` with an authorization code, your server performs the following calls:

| # | Call | Purpose |
|---|------|---------|
| 1 | `POST /v2/oauth2/access/token` | exchange `code` for `access_token` |
| 2 | `POST /v2/oauth2/user/info` | use `access_token` to fetch user profile |
| 3 | `POST /v2/oauth2/refresh/token` | renew expired `access_token` using `refresh_token` |

> **Credentials:** Your `client_id`, `client_secret`, permitted `grant_types`, and registered `redirect_uri` are provisioned by Vantage Circle. Contact your POC to obtain them.

## Authentication

Token endpoints authenticate your client using HTTP Basic credentials passed as a Base64-encoded `Authorization` header:

**FORMAT**

```
Authorization: Bearer base64(<client_id>:<client_secret>)
```

Encode `client_id:client_secret` as a single Base64 string and pass it as `Bearer <encoded>` in the `Authorization` header.

## Token Lifecycle

| Authorization Code | Access Token | Refresh Token |
|--------------------|--------------|---------------|
| **One-time** | **1 hour** | **1 year** |
| Issued by VC redirect. Single use only. | Used to call user info. Renew with refresh token. | Exchanges for a new access token. No re-login needed. |

## Step 1 — Exchange Authorization Code for Access Token

After the user is redirected back to your `redirect_uri` with a `code` query parameter, exchange it for an access token and refresh token.

```
POST /v2/oauth2/access/token
```

### Request Headers

| HEADER | VALUE |
|--------|-------|
| `Authorization` | `Bearer base64(client_id:client_secret)` |
| `Content-Type` | `application/x-www-form-urlencoded` |

### Request Body

| PARAMETER | TYPE | | DESCRIPTION |
|-----------|------|--|-------------|
| `grant_type` | string | required | Must be `authorization_code` |
| `code` | string | required | The authorization code received in your redirect callback |
| `redirect_uri` | string | required | Must exactly match the redirect URI registered for your client |

### Example Request

**CURL**

```bash
curl --request POST '{base_url}/v2/oauth2/access/token' \
    --header 'Authorization: Bearer <base64(client_id:client_secret)>' \
    --header 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode 'grant_type=authorization_code' \
    --data-urlencode 'code=<authorization_code>' \
    --data-urlencode 'redirect_uri=<your_registered_redirect_uri>'
```

**200 OK**

```json
{
    "token_type":    "Bearer",
    "access_token":  "Vy92FD4tWvpc20HmSqNIbyraSTFVYQKDaaE3qrn5RCAvjWnte7I9sDkBFZdFK0gb",
    "expires_in":    3600,
    "refresh_token": "5jCKKqNQ7BmdVSQ8FUhAdJbg2k297SwyDx8jWczTYxeu3GVGMEyLecHohNOX2TOK"
}
```

### Response Fields

| FIELD | TYPE | DESCRIPTION |
|-------|------|-------------|
| `token_type` | string | Always `"Bearer"` |
| `access_token` | string | 64-character token. Valid for 1 hour. Pass to Step 2. |
| `expires_in` | integer | Seconds until the access token expires |
| `refresh_token` | string | 64-character token. Valid for 1 year. Use to renew the access token. |

### Error Responses

| HTTP STATUS | MESSAGE | CAUSE |
|-------------|---------|-------|
| 400 | Unauthorized! Authorization Code not found. | Code is invalid or has expired |
| 400 | Unauthorized! Grant Type and Redirect URI does not match! | `grant_type` not permitted for this client, or `redirect_uri` mismatch |
| 400 | Unauthorized! User not found. | No user associated with the authorization code |
| 401 | Invalid client id or client secret | Credentials in Authorization header are incorrect |
| 404 | Unauthorized! Grant Type not found. | `grant_type` missing from body |
| 404 | Unauthorized! Code not found. | `code` missing from body |
| 404 | Unauthorized! Redirect Uri not found. | `redirect_uri` missing from body |

## Step 2 — Fetch User Information

Using the `access_token` from Step 1, retrieve the authenticated user's profile. If your client was provisioned with the `leads:share` scope, a `lead_share` object is included in the response.

```
POST /v2/oauth2/user/info
```

### Request Headers

| HEADER | VALUE |
|--------|-------|
| `Content-Type` | `application/x-www-form-urlencoded` |

### Request Body

| PARAMETER | TYPE | | DESCRIPTION |
|-----------|------|--|-------------|
| `token` | string | required | The `access_token` received from Step 1 |

### Example Request

**CURL**

```bash
curl --request POST '{base_url}/v2/oauth2/user/info' \
    --header 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode 'token=Vy92FD4tWvpc20HmSqNIbyraSTFVYQKDaaE3qrn5RCAvjWnte7I9sDkBFZdFK0gb'
```

**200 OK — BASIC SCOPE**

```json
{
    "name":       "Jaspreet Singh",
    "email":      "jaspreet.singh@vantagecircle.com",
    "user_id":    2889849,
    "return_url": "https://app.vantagecircle.co.in",
    "country_id": 1,
    "contact_no": "+918486006074"
}
```

**200 OK — WITH LEADS:SHARE SCOPE**

```json
{
    "name":       "Jaspreet Singh",
    "email":      "jaspreet.singh@vantagecircle.com",
    "user_id":    2889849,
    "return_url": "https://app.vantagecircle.co.in",
    "country_id": 1,
    "contact_no": "+918486006074",
    "lead_share": {
        "personal_email": "jaspreet.singh@vantagecircle.com",
        "phone_number":   "+918486006074",
        "city":           "Mumbai",
        "salary_bracket": "10000"
    }
}
```

> **Note:** The `lead_share` object is only present when the access token carries the `leads:share` scope. The exact fields returned within `lead_share` depend on the configuration agreed upon with Vantage Circle for your deal.

### Response Fields

| FIELD | TYPE | DESCRIPTION |
|-------|------|-------------|
| `name` | string | Full name of the user |
| `email` | string | Work email registered on Vantage Circle |
| `user_id` | integer | Unique Vantage Circle user ID |
| `return_url` | string | Company portal URL — use this to redirect the user back to Vantage Circle |
| `country_id` | integer | User's country identifier |
| `contact_no` | string | Registered phone number with country code |
| `lead_share` | object | User's lead profile data. Present only with `leads:share` scope. See Lead Share Fields. |

### Error Responses

| HTTP STATUS | MESSAGE | CAUSE |
|-------------|---------|-------|
| 401 | Token expired | Access token has expired — proceed to Step 3 to refresh |
| 401 | Invalid access token | Token not found or malformed |
| 401 | User Information not found | No Vantage Circle user associated with this token |
| 401 | Access Token not found | `token` field missing from body |

## Step 3 — Refresh an Expired Access Token

When an access token expires, use the `refresh_token` to obtain a new one without requiring the user to re-authenticate.

```
POST /v2/oauth2/refresh/token
```

### Request Headers

| HEADER | VALUE |
|--------|-------|
| `Authorization` | `Bearer base64(client_id:client_secret)` |
| `Content-Type` | `application/x-www-form-urlencoded` |

### Request Body

| PARAMETER | TYPE | | DESCRIPTION |
|-----------|------|--|-------------|
| `grant_type` | string | required | Must be `refresh_token` |
| `refresh_token` | string | required | The `refresh_token` received from Step 1 |

### Example Request

**CURL**

```bash
curl --request POST '{base_url}/v2/oauth2/refresh/token' \
    --header 'Authorization: Bearer <base64(client_id:client_secret)>' \
    --header 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode 'grant_type=refresh_token' \
    --data-urlencode 'refresh_token=5jCKKqNQ7BmdVSQ8FUhAdJbg2k297SwyDx8jWczTYxeu3GVGMEyLecHohN'
```

**200 OK**

```json
{
    "token_type":    "Bearer",
    "access_token":  "<new_access_token>",
    "expires_in":    3600,
    "refresh_token": "5jCKKqNQ7BmdVSQ8FUhAdJbg2k297SwyDx8jWczTYxeu3GVGMEyLecHohNOX2TOK"
}
```

> The `refresh_token` in the response is the same one you sent. A new one is not issued. If the refresh token itself expires (after 1 year), the user must complete the VC login/consent flow again.

### Error Responses

| HTTP STATUS | MESSAGE | CAUSE |
|-------------|---------|-------|
| 400 | Unauthorized! Refresh token not found. | Refresh token is invalid or does not belong to this client |
| 400 | Unauthorized! Grant Type does not match! | `grant_type` is not `refresh_token` or not permitted for this client |
| 401 | Invalid client id or client secret | Credentials in Authorization header are incorrect |
| 404 | Unauthorized! Grant Type not found. | `grant_type` missing from body |
| 404 | Unauthorized! Refresh Token not found. | `refresh_token` missing from body |

## Lead Share Fields

The `lead_share` object is returned when your access token carries the `leads:share` scope. The specific fields included are configured per deal by Vantage Circle — only fields enabled for your deal will appear in the response.

| FIELD | TYPE | DESCRIPTION |
|-------|------|-------------|
| `personal_email` | string | Personal email address of the user |
| `phone_number` | string | Phone number with country code |
| `city` | string | City of residence |
| `salary_bracket` | string | Salary bracket |
| `designation` | string | Job designation / title |
| `address` | string | Residential address |
| `age` | string | Age of the user |
| `dob` | string | Date of birth in `yyyy-MM-dd` format |
| `gender` | string | Gender of the user |
| `preferred_model` | string | Preferred loan or product model |

## Error Codes

All error responses follow this shape:

```json
{
    "err": "<error message>"
}
```

| HTTP STATUS | MEANING |
|-------------|---------|
| 400 Bad Request | The request was understood but rejected due to invalid parameters or authorization failure |
| 401 Unauthorized | Client credentials are invalid, or the token is expired / not found |
| 404 Not Found | A required body parameter is missing |

---

*Vantage Circle Partner API — Confidential. For authorized partners only.*
