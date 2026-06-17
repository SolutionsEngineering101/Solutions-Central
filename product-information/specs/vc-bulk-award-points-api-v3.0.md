---
title: "Vantage Circle — Bulk Award Points API v3.0"
date: 2026-06-17
domain: "API Documentation"
source: "Vantage Circle Bulk Award Points API v3.0.pdf"
tags: [api, bulk-award-points, points, integration]
---

# Vantage Circle Bulk Award Points API v3.0

*Document version 1.0.0*

---

## CONTENT

- [CONTENT](#content)
- [INTRODUCTION](#introduction)
  - [Base URL](#base-url)
- [BULK AWARD POINTS API](#bulk-award-points-api)
  - [Request](#request)
  - [Header Parameters](#header-parameters)
  - [Body Parameters](#body-parameters)
  - [Nomination List Parameters](#nomination-list-parameters)
  - [Success Response Models (HTTP Code: 200, Delivery Method: api)](#success-response-models-http-code-200-delivery-method-api)
  - [Root Object](#root-object)
  - [Example Success Response](#example-success-response)
  - [Error Response Object](#error-response-object)
  - [Example Error Response](#example-error-response)
- [GET ORDER/BATCH STATUS AND DETAILS API](#get-orderbatch-status-and-details-api)
  - [Request](#request-1)
  - [Header Parameters](#header-parameters-1)
  - [Example Success Response 1](#example-success-response-1)
  - [Example Error Response](#example-error-response-1)
  - [Example Success Response 2](#example-success-response-2)
  - [Employee Points Details Status](#employee-points-details-status)
- [GET EMPLOYEE POINTS API](#get-employee-points-api)
  - [Request](#request-2)
  - [Header Parameters](#header-parameters-2)
  - [Example Success Response](#example-success-response-1)
- [GET EMPLOYEE POINTS STATEMENT API](#get-employee-points-statement-api)
  - [Request](#request-3)
  - [Header Parameters](#header-parameters-3)
  - [Example Success Response](#example-success-response-2)
- [AUTHORIZATION/AUTHENTICATION](#authorizationauthentication)
  - [Abstract Protocol Flow Diagram](#abstract-protocol-flow-diagram)
  - [Get the access_token](#get-the-access_token)
  - [API Information](#api-information)
    - [Request](#request-4)
    - [Header Parameters](#header-parameters-4)
    - [Body Parameters](#body-parameters-1)
  - [Pass the access_token in headers in the API calls](#pass-the-access_token-in-headers-in-the-api-calls)
  - [Using the refresh_token](#using-the-refresh_token)
    - [API Information](#api-information-1)
    - [Request](#request-5)
    - [Header Parameters](#header-parameters-5)
    - [Body Parameters](#body-parameters-2)
  - [IP Authentication](#ip-authentication)
- [COUNTRY CODE](#country-code)
- [APPENDIX - A](#appendix---a)
  - [HTTP Status Code](#http-status-code)
  - [Error Codes](#error-codes)

---

## INTRODUCTION

Welcome to the Vantage Circle Bulk Award Points API documentation.

The Vantage Circle Bulk Award Points API allows one to award employees irrespective of registered or unregistered in the form of points in a simple, programmatic way using conventional HTTP requests. The endpoints are intuitive and powerful, allowing one to easily make calls to retrieve information or to execute actions.

### Base URL

| Environment | URL |
|---|---|
| Sandbox | `https://partner-api.vantagecircle.co.in` |
| Production | `https://partner-api.vantagecircle.com` |

---

## BULK AWARD POINTS API

To award points in bulk.

### Request

| Method | URL |
|---|---|
| POST | `/v1/award/bulkpoints` |

### Header Parameters

| Key | Value |
|---|---|
| Content-Type | `application/json` |
| Authorization | `...` |

### Body Parameters

| Field Name | Data Type | Comment |
|---|---|---|
| `batch_id` | string | Unique Batch Id / Order Id |
| `country_id` | integer | We will provide |
| `list_of_nominations` | array[object] | Nomination details |

### Nomination List Parameters

| Field Name | Data Type | Comment |
|---|---|---|
| `employee_id` | string | Email Id or Employee Id of the employee/awardee. |
| `client_reference` | string | Idempotent field that can be used for client-side order cross reference and prevent accidental order duplication. Must be unique. |
| `points` | integer | Denomination/Amount. |
| `employee_name` | string | Used to address the email if the user is not yet registered. (Optional Field) |
| `employee_unit` | string | Used for Reporting. (Optional Field) |
| `awarding_unit` | string | Used for Reporting. (Optional Field) |
| `spoc` | string | Used for Reporting. (Optional Field) |
| `reason` | string | Reason for award. Used in email and also appears in the statement. (Optional Field) |

### Success Response Models (HTTP Code: 200, Delivery Method: api)

#### Root Object

| Field Name | Data Type | Comment |
|---|---|---|
| `status` | string | Status of the Order (SUCCESS\|ERROR) |
| `status_message` | string | Success/Failure message/description |
| `count` | integer | Count of employees nominated |
| `batch_id` | string | Unique Batch Id processed |

### Example Success Response

```json
{
    "status": "SUCCESS",
    "status_message": "Points successfully allocated.",
    "count": 99,
    "batch_id": "xx-01"
}
```

### Error Response Object

| Field Name | Data Type | Value |
|---|---|---|
| `status` | string | ERROR |
| `error_code` | string | [Error Codes](#error-codes) |
| `error_message` | string | |
| `error_description` | string | |

### Example Error Response

```json
{
    "status": "ERROR",
    "error_code": "SE002",
    "error_message": "A required field is missing from request.",
    "error_description": "List of Nominations not found."
}
```

---

## GET ORDER/BATCH STATUS AND DETAILS API

To get the status and details of a particular batch for the list of nominations.

### Request

| Method | URL |
|---|---|
| GET | `/v1/award/bulkorder?bacth_id=xxxxxxx` |
| GET | `/v1/award/bulkorder/details?batch_id=xxxxxxx` |

### Header Parameters

| Key | Value |
|---|---|
| Authorization | `...` |

### Example Success Response 1

```json
{
    "batch_id": "xx-01",
    "is_processed": true,
    "country_id": 91,
    "created_at": "2019-07-18T11:44:29.000+05:30",
    "processed_at": "2019-07-18T11:57:23.000+05:30"
}
```

### Example Error Response

```json
{
    "status": "ERROR",
    "error_code": "SE002",
    "error_message": "A required field is missing from request.",
    "error_description": "Batch Id not found."
}
```

### Example Success Response 2

```json
{
    "batch_id": "xx-01",
    "is_processed": true,
    "country_id": 1,
    "created_at": "2019-07-18T11:44:29.000+05:30",
    "processed_at": "2019-07-18T11:57:23.000+05:30",
    "list_of_nominations": [
        {
            "employee_id": "12345",
            "client_reference": "142545446",
            "employee_name": "Xx Xx",
            "employee_unit": "XX",
            "awarding_unit": "XX",
            "spoc": "XX",
            "points": 1000,
            "reason": "Award for excellent work.",
            "status": "ALLOCATED",
            "processed_at": "2019-07-18T11:57:23.000+05:30"
        },
        {
            "employee_id": "12346",
            "client_reference": "142545447",
            "employee_name": "Yy Yy",
            "employee_unit": "XX",
            "awarding_unit": "XX",
            "spoc": "XX",
            "points": 5000,
            "reason": "Award for outstanding service.",
            "status": "ALLOCATED",
            "processed_at": "2019-07-18T11:57:23.000+05:30"
        }
    ]
}
```

### Employee Points Details Status

| status | Description |
|---|---|
| PENDING | Award not Approved yet |
| APPROVED | Award Approved |
| NOT_REGISTERED | User not registered |
| BOUNCED | Email bounced |
| DIFFERENT_COUNTRY | Award allocated country and User country does not match |
| DECLINED | Award Declined |
| REVOKED | Award Revoked |
| RE-INITIATED | Award Re-initiated |
| NOT_PROCESSED/ERROR | Error |

---

## GET EMPLOYEE POINTS API

To get the employee reward points.

### Request

| Method | URL |
|---|---|
| GET | `/v1/award/employee/points?employee_id=xxxxxxx&country_id=xx` |

### Header Parameters

| Key | Value |
|---|---|
| Authorization | `...` |

### Example Success Response

```json
{
    "points": 1000,
    "real_value": 1000,
    "country_id": 1,
    "currency_name": "USD",
    "currency_hex": "&#x20B9;",
    "pointsPerUnitCurrency": 100
}
```

---

## GET EMPLOYEE POINTS STATEMENT API

To get the employee points statement.

### Request

| Method | URL |
|---|---|
| GET | `/api/external/v1/rewardPointHistory?emailIdOrEmployeeId=xx` |

### Header Parameters

| Key | Value |
|---|---|
| Authorization | `...` |

### Example Success Response

```json
{
    "history": [
        {
            "date": "02-02-2022 3:39 PM",
            "siteName": "Awarded by <b>XYZ</b><br/> Valid till 02-02-2023",
            "siteLogo": "https://d2czc53zv9aek5.cloudfront.net/images/jitr/logo/award/xyz.jpg",
            "description": "Awarded by <b>XYZ</b><br/> Valid till 02-02-2023",
            "credit": 100,
            "debit": null,
            "balance": 100,
            "dateStr": "02 Feb 2022",
            "balanceAmount": 100
        }
    ]
}
```

---

## AUTHORIZATION/AUTHENTICATION

Type: **OAuth 2.0**

IP Authentication: **NO (can be enabled if required)**

### Abstract Protocol Flow Diagram

**Abstract Protocol Flow (OAuth 2.0)**

The flow involves the following actors:

- **Application (Client)**
- **Vantage Circle (Resource Owner)** — for trusted parties this leg can be skipped.
- **Authorization Server** and **Resource Server** — together forming the **Service API**.

Steps shown in the diagram:

1. Authorization Request (Application → Vantage Circle)
2. Authorization Grant (Vantage Circle → Application)
3. Authorization Grant (Application → Authorization Server)
4. Access Token (Authorization Server → Application)
5. Access Token (Application → Resource Server)
6. Protected Resource (Resource Server → Application)

Here is a more detailed explanation of the steps in the diagram:

1. The *application* requests authorization to access service resources from the *user*.
2. If the *user* authorized the request, the *application* receives an authorization grant.
3. The *application* requests an access token from the *authorization server* (API) by presenting authentication of its own identity, and the authorization grant.
4. If the application identity is authenticated and the authorization grant is valid, the *authorization server* (API) issues an access token to the application. Authorization is complete.
5. The *application* requests the resource from the *resource server* (API) and presents the access token for authentication.
6. If the access token is valid, the *resource server* (API) serves the resource to the *application*.

Vantage Circle will provide the following identifiers —

- **client_id**
- **client_secret**

### Get the access_token

**client_id**, **client_secret** along with **grant_type** will be required to be passed in the post body in the form of json body in order to get the **access_token**.

- Pass the **grant_type** in the body. In this case **grant_type** will be **client_credentials** to get the **access_token**.
- Pass the **client_id** in the body (which is used for client identification).
- Pass the **client_secret** in the body.

### API Information

#### Request

| METHOD | URL |
|---|---|
| POST | `/v1/oauth2/access/token` |

#### Header Parameters

| Key | Value |
|---|---|
| Content-Type | `application/json` |

#### Body Parameters

| Field Name | Data Type | Optional | Description |
|---|---|---|---|
| `grant_type` | String | NO | GRANT TYPE |
| `client_id` | String | NO | CLIENT ID |
| `client_secret` | String | NO | CLIENT SECRET |

**CURL Example**

```bash
curl -X POST \
  https://partner-api.vantagecircle.in/v1/oauth2/access/token \
  -H 'Content-Type: application/json' \
  -d '{
        "grant_type": "client_credentials",
        "client_id": "xx",
        "client_secret": "xx"
}'
```

**Success Response**

```json
{
    "token_type": "Bearer",
    "access_token": "jaZ96DnmSuXKvdQfMqQAKjW8utWeAiKAQdzKbqgusP6xtId32H7xTci3tVaMskZb",
    "expires_in": 3600,
    "refresh_token": "9cbho9gMwkODSMknvwsnublqtpToulqlqQdq7iSTdTnq9lDuFlyfnvMjbi48xpSZ"
}
```

**Response Details**

- **token_type: "Bearer"** — Bearer Tokens are the predominant type of access token used with OAuth 2.0.
- **access_token** — The access token is used for authentication and authorization to get access to the resources from the resource server.
- **expires_in** — The lifetime in seconds of the access token. For example, the value "3600" denotes that the access token will expire in one hour from the time the response was generated.
- **refresh_token** — The refresh token is used to get a new access token, when the old one expires. Instead of the normal grant type, the client provides the refresh token, and receives a new access token.

**Error Responses**

```json
{ "err": "Unauthorized! Grant Type does not match." }
```

```json
{ "err": "Unauthorized! Client Id not found." }
```

```json
{ "err": "Unauthorized! Client Secret not found." }
```

```json
{ "err": "Unauthorized! Client Id and Client Secret not found." }
```

### Pass the access_token in headers in the API calls

Key: **Authorization**

Value: **Bearer 39d7SFhPMZN16B2XEOgIMQaI6IbQnl7LnU9Me84ly7tCTjTi7G95T7td1lOUCj2j**

**CURL Example**

```bash
curl -X GET \
  'https://partner-api.vantagecircle.in/v1/award/bulkorder?batch_id=xx-01' \
  -H 'Authorization: Bearer jaZ96DnmSuXKvdQfMqQAKjW8utWeAiKAQdzKbqgusP6xtId32H7xTci3tVaMskZb'
```

### Using the refresh_token

The refresh token is used to get a new access token, when the old one expires. Instead of the normal grant type, the client provides the refresh token, and receives a new access token.

- In this case **grant_type** will be **refresh_token** to get the new **access_token**.

#### API Information

#### Request

| METHOD | URL |
|---|---|
| POST | `/api/v1/oauth2/refresh/token` |

#### Header Parameters

| Key | Value |
|---|---|
| Content-Type | `application/json` |

#### Body Parameters

| Field Name | Data Type | Optional | Description |
|---|---|---|---|
| `grant_type` | String | NO | GRANT TYPE |
| `client_id` | String | NO | CLIENT ID |
| `client_credentials` | String | NO | CLIENT CREDENTIALS |
| `refresh_token` | String | NO | REFRESH TOKEN |

**CURL Example**

```bash
curl -X POST \
  https://partner-api.vantagecircle.in/v1/oauth2/refresh/token \
  -H 'Content-Type: application/json' \
  -d '{
        "grant_type": "refresh_token",
        "client_id": "xx",
        "client_secret": "xx",
        "refresh_token": "9cbho9gMwkODSMknvwsnublqtpToulqlqQdq7iSTdTnq9lDuFlyfnvMjbi48xpSZ"
}'
```

**Success Response**

```json
{
    "token_type": "Bearer",
    "access_token": "jaZ96DnmSuXKvdQfMqQAKjW8utWeAiKAQdzKbqgusP6xtId32H7xTci3tVaMskZb",
    "expires_in": 3406,
    "refresh_token": "9cbho9gMwkODSMknvwsnublqtpToulqlqQdq7iSTdTnq9lDuFlyfnvMjbi48xpSZ"
}
```

**Note: If the refresh_token expires a new refresh_token will be provided.**

### IP Authentication

Bulk Award Points API are authorized for only whitelisted **Ip Addresses**.

The client needs to provide the IP Address list to Vantage Circle in order to whitelist those ip (can be enabled if required).

---

## COUNTRY CODE

| ID | COUNTRY NAME | CURRENCY |
|---|---|---|
| 1 | United States | USD |
| 7 | Russia | RUB |
| 12 | Puerto Rico | USD |
| 13 | Guam | USD |
| 14 | Virgin Islands US | USD |
| 20 | Egypt | EGP |
| 27 | South Africa | ZAR |
| 30 | Greece | EUR |
| 31 | Netherlands | EUR |
| 32 | Belgium | EUR |
| 33 | France | EUR |
| 34 | Spain | EUR |
| 36 | Hungary | HUF |
| 39 | Italy | EUR |
| 40 | Romania | RON |
| 41 | Switzerland | CHF |
| 43 | Austria | EUR |
| 44 | United Kingdom | GBP |
| 45 | Denmark | DKK |
| 46 | Sweden | SEK |
| 47 | Norway | NOK |
| 48 | Poland | PLN |
| 49 | Germany | EUR |
| 51 | Peru | PEN |
| 52 | Mexico | MXN |
| 54 | Argentina | ARS |
| 55 | Brazil | BRL |
| 56 | Chile | CLP |
| 57 | Colombia | COP |
| 58 | Venezuela | VEF |
| 60 | Malaysia | MYR |
| 61 | Australia | AUD |
| 62 | Indonesia | IDR |
| 63 | Philippines | PHP |
| 64 | New Zealand | NZD |
| 65 | Singapore | SGD |
| 66 | Thailand | THB |
| 71 | Kazakhstan | KZT |
| 81 | Japan | JPY |
| 82 | South Korea | KRW |
| 84 | Vietnam | VND |
| 86 | China | CNY |
| 90 | Turkey | TRL |
| 91 | India | INR |
| 92 | Pakistan | PKR |
| 93 | Afghanistan | AFN |
| 94 | Sri Lanka | LKR |
| 95 | Myanmar | MMK |
| 98 | Iraq | IQD |
| 99 | Iran | IRR |
| 212 | Morocco | MAD |
| 213 | Algeria | DZD |
| 216 | Tunisia | TND |
| 218 | Libya | LYD |
| 221 | Senegal | XOF |
| 223 | Mali | XOF |
| 224 | Guinea | GNF |
| 225 | Cote DIvoire | XOF |
| 226 | Burkina Faso | XOF |
| 227 | Niger | XOF |
| 228 | Togo | CFA |
| 229 | Benin | XOF |
| 230 | Mauritius | MUR |
| 232 | Sierra Leone | SLL |
| 233 | Ghana | GHC |
| 234 | Nigeria | NGN |
| 235 | Chad | XAF |
| 236 | Central African Republic | XAF |
| 237 | Cameroon | XAF |
| 240 | Equatorial Guinea | XAF |
| 241 | Gabon | XAF |
| 244 | Angola | AOA |
| 251 | Ethiopia | ETB |
| 254 | Kenya | KES |
| 255 | Tanzania | TZS |
| 256 | Uganda | UGX |
| 258 | Mozambique | MZN |
| 260 | Zambia | ZMK |
| 263 | Zimbabwe | ZWD |
| 264 | Namibia | NAD |
| 267 | Botswana | BWP |
| 297 | Aruba | AWG |
| 351 | Portugal | EUR |
| 352 | Luxembourg | EUR |
| 353 | Ireland | EUR |
| 354 | Iceland | kr, Íkr |
| 355 | Albania | ALL |
| 356 | Malta | EUR |
| 357 | Cyprus | EUR |
| 358 | Finland | EUR |
| 359 | Bulgaria | BGN |
| 370 | Lithuania | LTL |
| 371 | Latvia | EUR |
| 372 | Estonia | EUR |
| 373 | Republic of Moldova | LEU |
| 374 | Armenia | AMD |
| 377 | Monaco | EUR |
| 380 | Ukraine | UAH |
| 381 | Serbia | RSD |
| 385 | Croatia | HRK |
| 386 | Slovenia | EUR |
| 387 | Bosnia and Herzegovina | BAM |
| 389 | Macedonia | MKD |
| 420 | Czech Republic | CZK |
| 421 | Slovakia | EUR |
| 423 | Liechtenstein | CHF |
| 502 | Guatemala | GTQ |
| 503 | El Salvador | USD |
| 504 | Honduras | HNL |
| 505 | Nicaragua | NIO |
| 506 | Costa Rica | CRC |
| 507 | Panama | PAB |
| 509 | Haiti | HTG |
| 591 | Bolivia | BOB |
| 593 | Ecuador | USD |
| 594 | French Guiana | EUR |
| 595 | Paraguay | PYG |
| 596 | Martinique | EUR |
| 597 | Suriname | SRD |
| 598 | Uruguay | UYU |
| 599 | Netherlands Antilles | ANG |
| 673 | Brunei Darussalam | BND |
| 675 | Papua New Guinea | PGK |
| 684 | American Samoa | USD |
| 809 | Dominican Republic | DOP |
| 852 | HongKong | HKD |
| 853 | Macau | MOP |
| 855 | Cambodia | KHR |
| 868 | Trinidad and Tobago | TTD |
| 876 | Jamaica | JMD |
| 880 | Bangladesh | BDT |
| 886 | Taiwan | TWD |
| 961 | Lebanon | LBP |
| 962 | Jordan | JOD |
| 965 | Kuwait | KWD |
| 966 | Saudi Arabia | SAR |
| 967 | Yemen | MAD |
| 968 | Oman | OMR |
| 971 | United Arab Emirates | AED |
| 972 | Israel | ILS |
| 973 | Bahrain | BHD |
| 974 | Qatar | QAR |
| 975 | Bhutan | BTN |
| 976 | Mongolia | MNT |
| 977 | Nepal | NPR |
| 992 | Tajikistan | TJS |
| 993 | Turkmenistan | TMT |
| 994 | Azerbaijan | AZN |
| 995 | Georgia | GEL |
| 1001 | Canada | CAD |
| 1242 | Bahamas | BSD |
| 1246 | Barbados | BBD |
| 1264 | Anguilla | XCD |
| 1268 | Antigua and Barbuda | XCD |
| 1285 | British Virgin Islands | USD |
| 1441 | Bermuda | BMD |

---

## APPENDIX - A

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
