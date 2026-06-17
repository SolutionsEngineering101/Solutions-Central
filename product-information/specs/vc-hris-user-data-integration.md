---
title: "Vantage Circle — HRIS Integration & User Data Integration"
date: 2026-06-17
domain: "API Documentation"
source: "Vantage_Circle - HRIS Integration & User Data Integration Documentation.pdf"
tags: [api, hris, user-data, integration]
---

# Vantage Circle — HRIS Integration & User Data Integration

## Content

- [Introduction](#introduction)
- [HRIS Integration (REST API calls)](#hris-integration-rest-api-calls)
- [Authorization / Authentication — OAuth 2.0](#authorization--authentication--oauth-20)
  - [Abstract Protocol Flow Diagram](#abstract-protocol-flow-diagram)
  - [Get the access_token](#get-the-access_token)
    - [API Information](#api-information)
      - [Request](#request)
      - [Header Parameters](#header-parameters)
      - [Body Parameters](#body-parameters)
      - [Request Body Example](#request-body-example)
      - [CURL Example](#curl-example)
      - [Success Response](#success-response)
      - [Response Details](#response-details)
      - [Error Response](#error-response)
  - [Using the refresh_token](#using-the-refresh_token)
    - [API Information](#api-information-1)
      - [Request](#request-1)
      - [Header Parameters](#header-parameters-1)
      - [Body Parameters](#body-parameters-1)
      - [CURL Example](#curl-example-1)
      - [Success Response](#success-response-1)
  - [How to do API calls with access_token?](#how-to-do-api-calls-with-access_token)
    - [CURL Example](#curl-example-2)
- [Employee Add Or Update V4 — Bulk Records](#employee-add-or-update-v4--bulk-records)
  - [Add or Update Employee Information in Bulk](#add-or-update-employee-information-in-bulk)
    - [Request](#request-2)
    - [Header Parameters](#header-parameters-2)
    - [Body Parameters](#body-parameters-2)
    - [employee_data list parameters](#employee_data-list-parameters)
    - [Example CURL Request](#example-curl-request)
    - [Example CURL Request (with encrypted JSON body)](#example-curl-request-with-encrypted-json-body)
    - [Encryption details](#encryption-details)
    - [Example Success Response](#example-success-response)
    - [Example Error Response](#example-error-response)
- [Appendix - A](#appendix---a)
  - [HTTP Status Code](#http-status-code)
  - [Error Codes](#error-codes)

---

## Introduction

This document describes how our corporate partners ingest their employee data to our System via HRIS Integration (REST API call). This documentation is a guide to push employee data in bulk or in batches.

---

## HRIS Integration (REST API calls)

When a corporate partner takes up our Vantage Rewards module, further integration is needed in order to get employee hierarchy information as well as employee department information, reporting manager's information, etc.

An HRMS system stores further details about the employees along with employee hierarchy in terms of designation, roles, etc. This is useful since only a handful of roles in an organization will have the authority to nominate colleagues for rewards.

Before implementing the HRMS system integration, the company needs to share its employee details with us. The company can use the following API to push their employee information directly to our database:

### Base URL

| Environment | URL |
|---|---|
| Sandbox | `https://api.vantagecircle.co.in` |
| Production | `https://dashboard.vantagecircle.com` |

---

## Authorization / Authentication — OAuth 2.0

**Type:** OAuth 2.0
**IP Restriction:** Available if required

### Abstract Protocol Flow Diagram

```
                         Abstract Protocol Flow (OAuth 2.0)

                          1. Authorization Request          ┌──────────────────────┐
   ┌──────────────┐  ───────────────────────────────────►  │    Vantage Circle     │   For trusted parties
   │              │  ◄───────────────────────────────────   │   (Resource Owner)    │   this leg can be
   │              │          2. Authorization Grant         └──────────────────────┘   skipped.
   │              │
   │              │          3. Authorization Grant         ┌──────────────────────┐
   │  Application │  ───────────────────────────────────►   │  Authorization Server │
   │   (Client)   │  ◄───────────────────────────────────   │                       │  ┐
   │              │          4. Access Token                └──────────────────────┘  │
   │              │                                                                     ├─ Service API
   │              │          5. Access Token                ┌──────────────────────┐  │
   │              │  ───────────────────────────────────►   │   Resource Server     │  ┘
   │              │  ◄───────────────────────────────────   │                       │
   └──────────────┘          6. Protected Resource          └──────────────────────┘
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

**client_id**, **client_secret** along with **grant_type** will be required to be passed in the post body in the form of JSON body in order to get the **access_token**.

- Pass the **grant_type** in the body. In this case, **grant_type** will be **client_credentials** to get the **access_token**
- Pass the **client_id** in the body (which is used for client identification).
- Pass the **client_secret** in the body.

#### API Information

##### Request

| METHOD | URL |
|---|---|
| POST | `/api/v1/oauth2/access/token` |

##### Header Parameters

| Key | Value |
|---|---|
| Content-Type | `application/json` |

##### Body Parameters

| Field Name | Data Type | Optional | Description |
|---|---|---|---|
| grant_type | String | NO | GRANT TYPE |
| client_id | String | NO | CLIENT ID |
| client_credentials | String | NO | CLIENT CREDENTIALS |

##### Request Body Example

```json
{
    "grant_type": "client_credentials",
    "client_id": "xx",
    "client_secret": "xx"
}
```

##### CURL Example

```bash
curl -X POST \
  https://api.vantagecircle.co.in/api/v1/oauth2/access/token \
  -H 'Content-Type: application/json' \
  -d '{
        "grant_type": "client_credentials",
        "client_id": "xx",
        "client_secret": "xx"
}'
```

##### Success Response

```json
{
    "token_type": "Bearer",
    "access_token": "jaZ96DnmSuXKvdQfMqQAKjW8utWeAiKAQdzKbqgusP6xtId32H7xTci3tVaMskZb",
    "expires_in": 3600,
    "refresh_token": "9cbho9gMwkODSMknvwsnublqtpToulqlqQdq7iSTdTnq9lDuFlyfnvMjbi48xpSZ"
}
```

##### Response Details

- **token_type:** "Bearer" - Bearer Tokens are the predominant type of access token used with OAuth 2.0.
- **access_token** - The access token is used for authentication and authorization to get access to the resources from the resource server.
- **expires_in** - The lifetime in seconds of the access token. For example, the value "3600" denotes that the access token will expire in one hour from the time the response was generated.
- **refresh_token** - The refresh token is used to get a new access token when the old one expires. Instead of the normal grant type, the client provides the refresh token and receives a new access token.

##### Error Response

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

### Using the refresh_token

The refresh token is used to get a new access token when the old one expires. Instead of the normal grant type, the client provides the refresh token and receives a new access token.

- In this case, **grant_type** will be **refresh_token** to get the new **access_token**

#### API Information

##### Request

| METHOD | URL |
|---|---|
| POST | `/api/v1/oauth2/refresh/token` |

##### Header Parameters

| Key | Value |
|---|---|
| Content-Type | `application/json` |

##### Body Parameters

| Field Name | Data Type | Optional | Description |
|---|---|---|---|
| grant_type | String | NO | GRANT TYPE |
| client_id | String | NO | CLIENT ID |
| client_credentials | String | NO | CLIENT CREDENTIALS |
| refresh_token | String | NO | REFRESH TOKEN |

##### CURL Example

```bash
curl -X POST \
  https://api.vantagecircle.co.in/api/v1/oauth2/refresh/token \
  -H 'Content-Type: application/json' \
  -d '{
        "grant_type": "refresh_token",
        "client_id": "xxx",
        "client_secret": "xxx",
        "refresh_token": "9cbho9gMwkODSMknvwsnublqtpToulqlqQdq7iSTdTnq9lDuFlyfnvMjbi48xpSZ"
}'
```

##### Success Response

```json
{
    "token_type": "Bearer",
    "access_token": "jaZ96DnmSuXKvdQfMqQAKjW8utWeAiKAQdzKbqgusP6xtId32H7xTci3tVaMskZb",
    "expires_in": 3406,
    "refresh_token": "9cbho9gMwkODSMknvwsnublqtpToulqlqQdq7iSTdTnq9lDuFlyfnvMjbi48xpSZ"
}
```

> **Note:** If the refresh_token expires a new refresh_token will be provided.

### How to do API calls with access_token?

Pass the **access_token** in headers in the API calls.

- **Key:** `Authorization`
- **Value:** `Bearer 39d7SFhPMZN16B2XEOgIMQaI6lbQnl7LnU9Me84ly7tCTjTi7G95T7td1lOUCj2j`

#### CURL Example

```bash
curl -X GET \
  'https://api.vantagecircle.co.in/xxxxxxx' \
  -H 'Authorization: Bearer jaZ96DnmSuXKvdQfMqQAKjW8utWeAiKAQdzKbqgusP6xtId32H7xTci3tVaMskZb'
```

---

## Employee Add Or Update V4 — Bulk Records

### Add or Update Employee Information in Bulk

#### Request

| Method | URL |
|---|---|
| POST | `/api/employee/v4/addOrUpdate` |

#### Header Parameters

| Key | Value |
|---|---|
| Authorization | ... |

#### Body Parameters

| Field Name | Data Type | Optional | Description |
|---|---|---|---|
| employee_data | array[object] | No | Contains the array of employee data |

#### employee_data list parameters

| Field Name | Data Type | Optional | Description |
|---|---|---|---|
| emailId | String | NO | Employee email Id |
| employeeId | String | NO | Employee Id |
| name | String | NO | Employee name |
| department | String | YES | Employee department |
| gradeGroup | String | YES | Employee grade |
| reportingManagerEmail | String | YES | Employee reporting manager email id |
| reportingManagerEmployeeId | String | YES | Employee reporting manager employee id |
| phone | String | YES | Employee mobile no |
| city | String | YES | Employee city |
| country | String | YES | Employee country |
| dob | DateTime | YES | Employee date of birth |
| gender | String | YES | Employee gender (Male/Female) |
| doj | DateTime | YES | Employee date of joining |
| status | Integer | YES | Employee's status - (0 = terminated) |
| additionalInfo1 | String | YES | Additional info1 if applicable |
| additionalInfo2 | String | YES | Additional info2 if applicable |
| additionalInfo3 | String | YES | Additional info3 if applicable |
| additionalInfo4 | String | YES | Additional info4 if applicable |

**Key Points**

- All Dates should be in `dd/mm/yyyy` format.
- (If a city/country is not provided it will be treated as India-Others).
- `employee_data` array must not exceed a length of 100 units.
- If the optional field "status" is not passed in the body then, it will be considered as `status=1` (i.e. active), if `status=0` is passed for an existing user then the user will be deactivated.

#### Example CURL Request

```bash
curl --location --request POST 'https://api.vantagecircle.org/api/employee/v4/addOrUpdate' \
--header 'Authorization: Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
--header 'Content-Type: application/json' \
--data-raw '{
  "employee_data": [
    {
      "emailId": "emp1@yourcompany.com",
      "employeeId": "emp001",
      "name": "Emp 1",
      "department": "Development",
      "gradeGroup": "",
      "reportingManagerEmail": "",
      "reportingManagerEmployeeId": "",
      "phone": "",
      "city": "",
      "country": "",
      "dob": "",
      "gender": "",
      "doj": "",
      "status": 1,
      "additionalInfo1": "",
      "additionalInfo2": ""
    },
    {
      "emailId": "emp2@yourcompany.com",
      "employeeId": "emp002",
      "name": "Emp 2",
      "department": "Development",
      "gradeGroup": "",
      "reportingManagerEmail": "",
      "reportingManagerEmployeeId": "",
      "phone": "",
      "city": "",
      "country": "",
      "dob": "",
      "gender": "",
      "doj": "",
      "additionalInfo1": "",
      "additionalInfo2": ""
    },
    {
      "emailId": "emp3@yourcompany.com",
      "employeeId": "emp003",
      "name": "Emp 3",
      "department": "Development",
      "gradeGroup": "",
      "reportingManagerEmail": "",
      "reportingManagerEmployeeId": "",
      "phone": "",
      "city": "",
      "country": "",
      "dob": "",
      "gender": "",
      "doj": "",
      "status": 0,
      "additional_info1": "",
      "additional_info2": ""
    }
  ]
}'
```

#### Example CURL Request (with encrypted JSON body)

```bash
curl --location --request POST 'https://api.vantagecircle.org/api/employee/v4/addOrUpdate' \
--header 'Authorization: Bearer mx2Z0ayx00RkqcRXD7eQ9hvpR1wKvkUmGrJ59uG2rQQZAc2QMgg5L4vBlbcPCtHs' \
--header 'Content-Type: text/plain' \
--header 'Cookie: HttpOnly' \
--data-raw '7CZmpCl5onOEa/9mZ1aucnKUeU74wsoVgQQw6ZUeHOJptvuGvxdP2R6DugrtGrwRtI6C4ViQt+7BJ2IwTolvTrEN0c2mwVYhQGakcvmWgHUGTkqonT973R9djNnlChoKE8kxvciD8o212jX6LJf6qLpHAWsZq3G/2qpdXGDJip+MhlK+OYzdG6GekBLlXdkw7IRXKb+tNU9zn2xJPVuLpwvULOFdASNy9P6huQ+k4KalgzO7Gv12kjVgWoqvPdyOmpt3Wte9RVbFC5P0S/a8+6mZAT5/Vt0tEbeT0++fLoEoYZov1jZZAilDwKZ+gyZooMuMmneSAXusYHfsLOLfFDTEVjxg9TDDL16MTehLfwLDCTmNLqsZvmw0sQIepp9yMdK+VPhm04JAFv9hIonL1EZJcyUkUfCL0xlgcklYyToQimKe+M6byHtezH8ItBM9Jj0L4EoggEKGgILdBkX+Nyhi9FjrbusrMt2Mr8aofmKnkfF9MjgTqFVEC5ygaiy48cEtGOk4iK9Fs5se/PE7nhTZyFomYQnLK3v/c83RFB14b5P2JGve/HeeSFVQO7vOWtKh9unfl8Y+YCwT5rutbVsGhEDvyksrSP52Rb1zgyOfskCC4OS2aF4UZV8TwXGdSTFYyep5E2el+QEAwAPJP9Ja8aHa9va/d2xgcXPSpKbhgXPK07eNpv+NFyEIpphjMT3RP7/AXt/7prefTmJLB6jZWYuWvaY3xQik6VZSfW2S54/X5UgvmW+TzLdIj9DhtOA4jlwNl0Szqmh2lQDwq9DUGxN+sQvS2CYZaO/3g8ZH8MBxufalc7Aialre6jMoipj4wty321BdZHJG37kbsizI7N9WC2FtGYjoqX7R+mczo8G7C5h+/TMqsbQ3gj4goPjukKp8/SwTUncpr7vwOCGoI9pKZY6tZXEod36qefjmqPB59d/ryWB5MuGNIlu8Tj7oF3vWSh3fS3yCbOgvH4pLC6CmxvNdCCkY8Aigt6i/QupqbxeNkV+eqS9tl7guGCdhKq4ToyzJuiNCMoPEfQGBRY8heFcU12bWqTxY/Oll0aMiCKG4lklHHuVbCKuvgvFILqiKdwZhr/keVNBd0x8s67LJeasqRelMByNwsvATalcYLaGuTdfLRb+AL+yXkFYOQkDKYMt9vdflQBVnJqxiFafPhkZu3saSzcS/tI4='
```

#### Encryption details

| Setting | Value |
|---|---|
| Algorithm used | AES |
| Key Size in Bits | 256 |
| Cipher mode of encryption | CBC |
| IV Key | `<not implemented>` |
| Secret Key | `<will be shared via email>` |

**Sample Secret Key:** `JaNdRgUkXp2r5u8x/A?D(G+KbPeShVmY`

**Sample payload to be encrypted:**

```json
{"employee_data":[{"emailId":"emp1@yourcompany.com","employeeId":"emp001","name":"Emp1","department":"Development","gradeGroup":"","reportingManagerEmail":"","reportingManagerEmployeeId":"","phone":"","city":"","country":"","dob":"","gender":"","doj":"","status":1,"additionalInfo1":"","additionalInfo2":""},{"emailId":"emp2@yourcompany.com","employeeId":"emp002","name":"Emp2","department":"Development","gradeGroup":"","reportingManagerEmail":"","reportingManagerEmployeeId":"","phone":"","city":"","country":"","dob":"","gender":"","doj":"","additionalInfo1":"","additionalInfo2":""},{"emailId":"emp3@yourcompany.com","employeeId":"emp003","name":"Emp3","department":"Development","gradeGroup":"","reportingManagerEmail":"","reportingManagerEmployeeId":"","phone":"","city":"","country":"","dob":"","gender":"","doj":"","status":0,"additional_info1":"","additional_info2":""}]}
```

**Decrypted sample payload:**

```
7CZmpCl5onOEa/9mZ1aucnKUeU74wsoVgQQw6ZUeHOJptvuGvxdP2R6DugrtGrwRtI6C4ViQt+7BJ2IwTolvTrEN0c2mwVYhQGakcvmWgHUGTkqonT973R9djNnlChoKE8kxvciD8o212jX6LJf6qLpHAWsZq3G/2qpdXGDJip+MhlK+OYzdG6GekBLlXdkw7IRXKb+tNU9zn2xJPVuLpwvULOFdASNy9P6huQ+k4KalgzO7Gv12kjVgWoqvPdyOmpt3Wte9RVbFC5P0S/a8+6mZAT5/Vt0tEbeT0++fLoEoYZov1jZZAilDwKZ+gyZooMuMmneSAXusYHfsLOLfFDTEVjxg9TDDL16MTehLfwLDCTmNLqsZvmw0sQIepp9yMdK+VPhm04JAFv9hIonL1EZJcyUkUfCL0xlgcklYyToQimKe+M6byHtezH8ItBM9Jj0L4EoggEKGgILdBkX+Nyhi9FjrbusrMt2Mr8aofmKnkfF9MjgTqFVEC5ygaiy48cEtGOk4iK9Fs5se/PE7nhTZyFomYQnLK3v/c83RFB14b5P2JGve/HeeSFVQO7vOWtKh9unfl8Y+YCwT5rutbVsGhEDvyksrSP52Rb1zgyOfskCC4OS2aF4UZV8TwXGdSTFYyep5E2el+QEAwAPJP9Ja8aHa9va/d2xgcXPSpKbhgXPK07eNpv+NFyEIpphjMT3RP7/AXt/7prefTmJLB6jZWYuWvaY3xQik6VZSfW2S54/X5UgvmW+TzLdIj9DhtOA4jlwNl0Szqmh2lQDwq9DUGxN+sQvS2CYZaO/3g8ZH8MBxufalc7Aialre6jMoipj4wty321BdZHJG37kbsizI7N9WC2FtGYjoqX7R+mczo8G7C5h+/TMqsbQ3gj4goPjukKp8/SwTUncpr7vwOCGoI9pKZY6tZXEod36qefjmqPB59d/ryWB5MuGNIlu8Tj7oF3vWSh3fS3yCbOgvH4pLC6CmxvNdCCkY8Aigt6i/QupqbxeNkV+eqS9tl7guGCdhKq4ToyzJuiNCMoPEfQGBRY8heFcU12bWqTxY/Oll0aMiCKG4lklHHuVbCKuvgvFILqiKdwZhr/keVNBd0x8s67LJeasqRelMByNwsvATalcYLaGuTdfLRb+AL+yXkFYOQkDKYMt9vdflQBVnJqxiFafPhkZu3saSzcS/tI4=
```

> **Note:** For encryption reference - <https://www.devglan.com/online-tools/aes-encryption-decryption>

#### Example Success Response

```json
{
  "success": [
    {
      "status": "Successfully saved",
      "employeeId": "emp001",
      "emailId": "emp1@yourcompany.com"
    },
    {
      "status": "Successfully updated",
      "employeeId": "emp002",
      "emailId": "emp2@yourcompany.com"
    },
    {
      "status": "Successfully updated",
      "employeeId": "emp003",
      "emailId": "emp3@yourcompany.com"
    }
  ]
}
```

#### Example Error Response

```json
{ "err": "Invalid email : emp5.com, Employee Id not found : emp6@test.com, Employee Name not found for emp001"}
```

```json
{ "err": "employee_data list length above limit" }
```

```json
{ "err": "employee_data list not found" }
```

```json
{ "err": "json not found" }
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
| 401 | Authentication failed. User not found. Invalid credentials. |
| 401 | Authentication failed. Please provide valid Token. |
| 401 | Authentication failed. Please provide valid AppKey. |
| 401 | Authentication failed. Please provide a valid password. |
| 401 | Authentication failed. Please provide valid details. |
