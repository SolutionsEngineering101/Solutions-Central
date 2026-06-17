---
title: "Vantage Circle — Partner Brand Integration (OAuth2) API v2.0"
date: 2026-06-17
domain: "API Documentation"
source: "Vantage Circle - Partner Brand integration(OAuth2) API v2.0.pdf"
tags: [api, partner-brand, oauth2, integration]
---

# Vantage Circle — Partner Brand Integration (OAuth2) API v2.0

## Content

- [Content](#content)
- [Introduction](#introduction)
  - [Base URL](#base-url)
- [Workflow Diagram](#workflow-diagram)
- [API Information](#api-information)
  - [Get the access_token by authorization_code](#get-the-access_token-by-authorization_code)
  - [Get the access_token by refresh_token](#get-the-access_token-by-refresh_token)
  - [Get user details by access_token](#get-user-details-by-access_token)
- [Appendix - A](#appendix---a)
  - [HTTP Status Code](#http-status-code)
  - [Error Codes](#error-codes)

---

## Introduction

Welcome to the Vantage Circle OAuth2 API documentation.

The Vantage Circle OAuth2 API allows you to authenticate employees that are registered with Vantage Circle in a programmatic way using conventional HTTPS requests. The endpoints are intuitive and powerful, allowing you to easily make calls to retrieve information or to execute actions.

### Base URL

| Environment | URL |
|---|---|
| Sandbox | `https://partner-api.vantagecircle.co.in` |
| Production | `https://partner-api.vantagecircle.com` |

---

## Workflow Diagram

**BRAND STORE REDIRECTION WORKFLOW**

1. User clicks **GET OFFER / REDIRECT** at Vantage Circle Platform.
2. VC redirects the user to Brand Store's Redirect URL with `authorization_code`.
3. Brand Store invokes VC APIs:
   1. GET `access_token` by `authorization_code`
   2. GET user info by `access_token`
4. Brand Store successfully registers/logs in the user.

---

## API Information

- **Type:** OAuth 2.0
- **IP Authentication:** NOT REQUIRED

Vantage Circle will provide the following identifiers:

- `client_id`
- `client_secret`

---

### Get the access_token by authorization_code

`grant_type`, `code` along with `redirect_uri` will be required to be passed in the post body in the form of `form-data(x-www-form-urlencoded)` in order to get the `access_token`.

- Pass the `client_id` and `client_secret` in the headers encoded with Base64.
  Format: `base64encode(<client-id>:<client-secret>)`
- Pass the `grant_type` in the form data.
  In this case `grant_type` will be `authorization_code` to get the `access_token`.
- Pass the `code` in the form data.
  (can be retrieved from the redirect url once the user is redirected from Vantage Circle site).
- Pass the `redirect_uri` in the form data. (Partner Client has to provide this URL)

#### API Information

- **API METHOD:** POST
- **Access Token URL:** `/v2/oauth2/access/token`
- **Headers:**
  - `Content-Type : application/x-www-form-urlencoded`
  - `Authorization: Basic {{base64encode(<client-id>:<client-secret>)}}`
- **Post Body (Form-data key):** `grant_type, code, redirect_uri`

#### Form-data

| KEY | VALUE |
|---|---|
| `grant_type` | `authorization_code` |
| `code` | `SamF2ZjXtmTYy4Eu408iBn3kuIqqF7ObsZWUSOSCFFl8Jdh4gPuptginphwmIdk4` |
| `redirect_uri` | `https://<redirect_uri>/in/api/v1/sso/oauth/vantagecircle/request` |

#### CURL Example

```bash
curl -X POST 'https://partner-api.vantagecircle.co.in/v2/oauth2/access/token' \
--header 'Authorization: Basic c2Ftc3VuZzpzYW1zdW5n' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=authorization_code' \
--data-urlencode 'code=SamF2ZjXtmTYy4Eu408iBn3kuIqqF7ObsZWUSOSCFFl8Jdh4gPuptginphwmIdk4' \
--data-urlencode 'redirect_uri=https://<redirect_uri>/in/api/v1/sso/oauth/vantagecircle/request'
```

#### Success Response

```json
{
    "token_type": "Bearer",
    "access_token": "PpCupQjUYcXACcya8e9Dq9txQuurgBiqRYiVEm0u1EUmByxRN9ectuSc6S1lsCVE",
    "expires_in": 3600,
    "refresh_token": "dqwi7pZQ2ejGZjd1MjdPUuyg7kYMVRk60RF3qjduzJBhd5B23aJNXdsLbhiXTG96"
}
```

#### Response Details

- **`token_type: "Bearer"`** — Bearer Tokens are the predominant type of access token used with OAuth 2.0.
- **`access_token`** — The access token is used for authentication and authorization to get access to the resources from the resource server.
- **`expires_in`** — The lifetime in seconds of the access token. For example, the value "3600" denotes that the access token will expire in one hour from the time the response was generated.
- **`refresh_token`** — The refresh token is used to get a new access token, when the old one expires. Instead of the normal grant type, the client provides the refresh token, and receives a new access token.

#### Error Responses

```json
{ "err": "Unauthorized! Grant Type does not match." }
```

```json
{ "err": "Unauthorized! Client Id not found." }
```

```json
{ "err": "Unauthorized! Client Secret not found." }
```

---

### Get the access_token by refresh_token

The refresh token is used to get a new access token, when the old one expires. Instead of the normal grant type, the client provides the refresh token, and receives a new access token.

`grant_type` along with `refresh_token` will be required to be passed in the post body.

- Pass the `client_id` and `client_secret` in the headers encoded with Base64.
  Format: `base64encode(<client-id>:<client-secret>)`
- Pass the `grant_type` as `refresh_token` in the form data to get the `access_token`.

#### API Information

- **API METHOD:** POST
- **Access Token URL:** `/v2/oauth2/refresh/token`
- **Headers:**
  - `Content-Type : application/x-www-form-urlencoded`
  - `Authorization: Basic {{base64encode(<client-id>:<client-secret>)}}`
- **Post Body (Form-data key):** `grant_type, refresh_token`

#### Form-data

| KEY | VALUE |
|---|---|
| `grant_type` | `refresh_token` |
| `refresh_token` | `dqwi7pZQ2ejGZjd1MjdPUuyg7kYMVRk60RF3qjduzJBhd5B23aJNXdsLbhiXTG96` |

#### CURL Example

```bash
curl -X POST 'https://partner-api.vantagecircle.co.in/v2/oauth2/refresh/token' \
--header 'Authorization: Basic c2Ftc3VuZzpzYW1zdW5n' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=refresh_token' \
--data-urlencode 'refresh_token=dqwi7pZQ2ejGZjd1MjdPUuyg7kYMVRk60RF3qjduzJBhd5B23aJNXdsLbhiXTG96'
```

#### Success Response

```json
{
    "token_type": "Bearer",
    "access_token": "PpCupQjUYcXACcya8e9Dq9txQuurgBiqRYiVEm0u1EUmByxRN9ectuSc6S1lsCVE",
    "expires_in": 3484,
    "refresh_token": "dqwi7pZQ2ejGZjd1MjdPUuyg7kYMVRk60RF3qjduzJBhd5B23aJNXdsLbhiXTG96"
}
```

---

### Get user details by access_token

The access token can be used to get user details or user information.

- Pass the `client_id` and `client_secret` in the headers encoded with Base64.
  Format: `base64encode(<client-id>:<client-secret>)`
- Pass the `access_token` as `token` in the form data to get the user details.

#### API Information

- **API METHOD:** POST
- **Access Token URL:** `/v2/oauth2/user/info`
- **Headers:**
  - `Content-Type : application/x-www-form-urlencoded`
  - `Authorization: Basic {{base64encode(<client-id>:<client-secret>)}}`
- **Post Body (Form-data key):** `token`

#### Form-data

| KEY | VALUE |
|---|---|
| `token` | `PpCupQjUYcXACcya8e9Dq9txQuurgBiqRYiVEm0u1EUmByxRN9ectuSc6S1lsCVE` |

#### CURL Example

```bash
curl -X POST 'https://partner-api.vantagecircle.co.in/v2/oauth2/user/info' \
--header 'Authorization: Basic c2Ftc3VuZzpzYW1zdW5n' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'token=PpCupQjUYcXACcya8e9Dq9txQuurgBiqRYiVEm0u1EUmByxRN9ectuSc6S1lsCVE'
```

#### Success Response

```json
{
    "name": "Subhendu Gogoi",
    "email": "subhendu.gogoi@vantagecircle.com",
    "user_id": 709701,
    "return_url": "https://app.vantagecircle.com"
}
```

---

## Appendix - A

### HTTP Status Code

| HTTP Status Code | Reason |
|---|---|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 500 | Internal Server Error |

### Error Codes

| Error Code | Reason |
|---|---|
| SE001 | Authentication failed. |
| SE002 | A required field is missing from the request. |
| SE003 | A request field not found. |

---

*Powered by Vantage Circle*
