---
title: "Vantage Circle — Partner Redemption API v1.0"
date: 2026-06-17
domain: "API Documentation"
source: "Vantage Circle - Partner Redemption API v1.0.pdf"
tags: [api, partner-redemption, redemption, integration]
---

# Vantage Circle — Partner Redemption API v1.0

**Document version 1.0.0**

## Content

- [Content](#content)
- [Introduction](#introduction)
  - [Base URL](#base-url)
- [Get Balance Points API](#get-balance-points-api)
  - [Request](#request)
  - [Header Parameters](#header-parameters)
  - [Example Success Response](#example-success-response)
- [Post Order API](#post-order-api)
  - [Request](#request-1)
  - [Header Parameters](#header-parameters-1)
  - [Example Request](#example-request)
  - [Example Success Response](#example-success-response-1)
- [Authorization/Authentication](#authorizationauthentication)
  - [Abstract Protocol Flow Diagram](#abstract-protocol-flow-diagram)
  - [Get the access_token](#get-the-access_token)
  - [API Information](#api-information)
    - [Request](#request-2)
    - [Header Parameters](#header-parameters-2)
    - [Body Parameters](#body-parameters)
  - [Pass the access_token in headers in the API calls](#pass-the-access_token-in-headers-in-the-api-calls)
  - [Using the refresh_token](#using-the-refresh_token)
  - [API Information](#api-information-1)
  - [Request](#request-3)
    - [Header Parameters](#header-parameters-3)
    - [Body Parameters](#body-parameters-1)
- [Country Code](#country-code)
- [Appendix - A](#appendix---a)
  - [HTTP Status Code](#http-status-code)
  - [Error Codes](#error-codes)

---

## Introduction

Welcome to the Vantage Circle - Partner Redemption API documentation.

The Vantage Circle Redemption API allows Partners to debit points at VC's end once any order is placed at the Partner's end in a simple, programmatic way using conventional HTTP requests. The endpoints are intuitive and powerful, allowing one to easily make calls to retrieve information or to execute actions.

### Base URL

| Environment | URL |
|---|---|
| Sandbox | `https://partner-api.vantagecircle.co.in` |
| Production | `https://partner-api.vantagecircle.com` |

---

## Get Balance Points API

To get the employee reward points via `employee_id` or `email_id`.

`employee_id` can be `email_id`
Eg: `employee_id="xx@xx.com"`

### Request

| Method | URL |
|---|---|
| GET | `/v1/award/employee/points?employee_id=xxxxxxx&country_id=xx` |

### Header Parameters

| Key | Value |
|---|---|
| Authorization | ... |

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

## Post Order API

To update the reward points and record placement of orders.

### Request

| Method | URL |
|---|---|
| POST | `/v1/placeOrderUpdatePoints` |

### Header Parameters

| Key | Value |
|---|---|
| Authorization | ... |

### Example Request

```json
{
    "user_id": 212521,
    "country_id": 91,
    "order_details": [{
            "order_id": "vAFJF3578",
            "order_status": "complete",
            "ordered_at": "02-03-2022 12:14:08",
            "product_id": "WTHFHW2752751",
            "price": 1200.00,
            "quantity": 1
        },
        {
            "order_id": "qtoJF3578",
            "order_status": "complete",
            "ordered_at": "02-03-2022 12:14:08",
            "product_id": "PKGTOTHW2752751",
            "price": 1000.00,
            "quantity": 2
        }
    ]
}
```

### Example Success Response

```json
{
    "status": "Success",
    "transaction_id": "369771060081",
    "message": "Orders successfully processed"
}
```

---

## Authorization/Authentication

Type: **OAuth 2.0**
IP Authentication: **NO (can be enabled if required)**

### Abstract Protocol Flow Diagram

```
                        Abstract Protocol Flow (OAuth 2.0)

  +-------------+    1. Authorization Request    +------------------------+   For trusted parties
  |             | -----------------------------> |     Vantage Circle     |   this leg can be
  |             |    2. Authorization Grant      |    (Resource Owner)    |   skipped.
  |             | <----------------------------- +------------------------+
  |             |
  | Application |    3. Authorization Grant      +------------------------+
  |  (Client)   | -----------------------------> |  Authorization Server  |
  |             |    4. Access Token             |                        |
  |             | <----------------------------- +------------------------+   Service API
  |             |
  |             |    5. Access Token             +------------------------+
  |             | -----------------------------> |    Resource Server     |
  |             |    6. Protected Resource       |                        |
  |             | <----------------------------- +------------------------+
  +-------------+
```

Here is a more detailed explanation of the steps in the diagram:

1. The *application* requests authorization to access service resources from the *user*
2. If the *user* authorized the request, the *application* receives an authorization grant
3. The *application* requests an access token from the *authorization server* (API) by presenting authentication of its own identity, and the authorization grant
4. If the application identity is authenticated and the authorization grant is valid, the *authorization server* (API) issues an access token to the application. Authorization is complete.
5. The *application* requests the resource from the *resource server* (API) and presents the access token for authentication
6. If the access token is valid, the *resource server* (API) serves the resource to the *application*

Vantage Circle will provide the following identifiers -

- **client_id**
- **client_secret**

### Get the access_token

**client_id**, **client_secret** along with **grant_type** will be required to be passed in the post body in the form of a json body in order to get the **access_token**.

- Pass the **grant_type** in the body. In this case **grant_type** will be **client_credentials** to get the **access_token**
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
| Content-Type | application/json |

#### Body Parameters

| Field Name | Data Type | Optional | Description |
|---|---|---|---|
| grant_type | String | NO | GRANT TYPE |
| client_id | String | NO | CLIENT ID |
| client_secret | String | NO | CLIENT SECRET |

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

- **token_type: "Bearer"** - Bearer Tokens are the predominant type of access token used with OAuth 2.0.
- **access_token** - The access token is used for authentication and authorization to get access to the resources from the resource server.
- **expires_in** - The lifetime in seconds of the access token. For example, the value "3600" denotes that the access token will expire in one hour from the time the response was generated.
- **refresh_token** - The refresh token is used to get a new access token, when the old one expires. Instead of the normal grant type, the client provides the refresh token, and receives a new access token.

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
Value: **Bearer 39d7SFhPMZN16B2XEOgIMQaI6lbQnl7LnU9Me84ly7tCTjTi7G95T7td1lOUCj2j**

**CURL Example**

```bash
curl -X GET \
'https://partner-api.vantagecircle.in/v1/award/bulkorder?batch_id=xx-01 \
  -H 'Authorization: Bearer jaZ96DnmSuXKvdQfMqQAKjW8utWeAiKAQdzKbqgusP6xtId32H7xTci3tVaMskZb'
```

### Using the refresh_token

The refresh token is used to get a new access token when the old one expires. Instead of the normal grant type, the client provides the refresh token, and receives a new access token.

- In this case **grant_type** will be **refresh_token** to get the new **access_token**

### API Information

#### Request

| METHOD | URL |
|---|---|
| POST | `/api/v1/oauth2/refresh/token` |

#### Header Parameters

| Key | Value |
|---|---|
| Content-Type | application/json |

#### Body Parameters

| Field Name | Data Type | Optional | Description |
|---|---|---|---|
| grant_type | String | NO | GRANT TYPE |
| client_id | String | NO | CLIENT ID |
| client_credentials | String | NO | CLIENT CREDENTIALS |
| refresh_token | String | NO | REFRESH TOKEN |

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

---

## Country Code

| ID | Country Name | Currency |
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
