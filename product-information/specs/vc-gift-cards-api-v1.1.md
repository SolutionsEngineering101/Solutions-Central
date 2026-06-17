---
title: "Vantage Circle — Gift Cards API v1.1"
date: 2026-06-17
domain: "API Documentation"
source: "Vantage Circle Gift Cards API v1.1 (1).pdf"
tags: [api, gift-cards, redemption, integration]
---

# Vantage Circle Gift Card API v1.0

**Document version 1.0.0**

> Note: The source file is named "v1.1" but the document body identifies itself as "Vantage Circle Gift Card API v1.0 / Document version 1.0.0". Content below reflects the document body verbatim.

---

## CONTENT

- [CONTENT](#content)
- [INTRODUCTION](#introduction)
  - [Base URL](#base-url)
- [AUTHENTICATION / AUTHORIZATION](#authentication--authorization)
  - [Example 1 - For calling the GET API to fetch products:](#example-1---for-calling-the-get-api-to-fetch-products)
  - [Example 2 - For calling the POST API to create an order:](#example-2---for-calling-the-post-api-to-create-an-order)
- [LIST ALL PRODUCTS API](#list-all-products-api)
  - [Header Parameters](#header-parameters)
  - [Success Response Models (HTTP Code: 200)](#success-response-models-http-code-200)
  - [CURL Request](#curl-request)
- [CREATE ORDER API](#create-order-api)
  - [Request](#request)
    - [Header Parameters](#header-parameters-1)
    - [Body Parameters](#body-parameters)
  - [Success Response Models (HTTP Code: 200, Delivery Method: api)](#success-response-models-http-code-200-delivery-method-api)
    - [Root Object](#root-object)
    - [Card Info Object](#card-info-object)
    - [Card Object](#card-object)
  - [Examples -](#examples--1)
  - [CURL Request](#curl-request-1)
  - [Success Response (Delivery Method: api)](#success-response-delivery-method-api)
  - [Response Models (Success, HTTP Code: 200, Delivery Method: email)](#response-models-success-http-code-200-delivery-method-email)
    - [Root Object](#root-object-1)
  - [Example Success Response (Delivery Method: email)](#example-success-response-delivery-method-email)
  - [Error Response Models](#error-response-models)
    - [Error Response Object](#error-response-object)
  - [Example Error Response](#example-error-response)
- [RESEND API](#resend-api)
  - [Request](#request-1)
  - [Header Parameters](#header-parameters-2)
  - [Success Response Models (HTTP Code: 200)](#success-response-models-http-code-200-1)
    - [Root Object](#root-object-2)
  - [Example -](#example--)
  - [CURL Request](#curl-request-2)
  - [Success Response (HTTP Code: 200)](#success-response-http-code-200)
- [APPENDIX - A](#appendix---a)
  - [HTTP Status Code](#http-status-code)
  - [Error Codes](#error-codes)
  - [Error Codes (specific to orders)](#error-codes-specific-to-orders)
- [VIEWING ORDER HISTORY AND FUNDING HISTORY](#viewing-order-history-and-funding-history)
- [APPENDIX - B](#appendix---b)
  - [List of Countries](#list-of-countries)

---

## INTRODUCTION

Welcome to the Vantage Circle Gift Card API documentation.

The Vantage Circle Gift Card API allows you to order gift card(s) in a simple, programmatic way using conventional HTTP requests. The endpoints are intuitive and powerful, allowing you to easily make calls to retrieve information or to execute actions.

### Base URL

| Environment | URL |
|---|---|
| Sandbox | `https://partner-api.vantagecircle.co.in` |
| Production | `https://partner-api.vantagecircle.com` |

---

## AUTHENTICATION / AUTHORIZATION

Vantage Circle will provide the following identifiers which will be needed for API authentication.

```
public_key
private_key
```

**Important Note**

*public_key and hash_key are required for all API calls which will be needed to be passed in the headers.*

Pass `public_key` in the header (which is used for client identification).
Use `private_key` to generate a HMAC hash (`hash_key`) which is used to verify data integrity. Refer to the process below to generate a HMAC hash.

**How to generate a hash_key?**

In order to generate a hash key, create a HMAC hash. Please find the details below:

Use the `private_key` and message (which can be the json encoded format of the data passed if POST API or an empty string passed if GET API) with the MD5 algorithm to generate a hash.

### Example 1 - For calling the GET API to fetch products:

```
private_key : xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Take the query parameters as the message. In case, there is no query parameter, it will be `""` (an empty string).

Generate the hash using the `private_key` and message.

Algorithm used : MD5

### Example 2 - For calling the POST API to create an order:

```
private_key : xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Message: (json encoded), for example -

```json
{
    "client_reference" : "90bJIU90hI889iw",
    "product_id" : 10615,
    "amount" : 500,
    "quantity" : 1,
    "country_id" : 91,
    "currency_code" : "INR",
    "delivery_method" : "api",
    "receiver_email" : "",
    "email_subject" : "",
    "email_template" : "",
    "notification_email" : ""
}
```

Generate the hash using the `private_key` and message.

Algorithm used : MD5

The hash key can also be generated at the following url:
https://codebeautify.org/hmac-generator

While generating the hash at the above mentioned url, the json body should be exactly in the following format:

```json
{"client_reference":"90bJIU90hI8k9iw","product_id":10615,"amount":500,"quantity":1,"country_id":91,"currency_code":"INR","delivery_method":"api","receiver_email":"","email_subject":"","email_template":"","notification_email":""}
```

---

## LIST ALL PRODUCTS API

To fetch the list of products.

### Request

| Method | API Endpoint |
|---|---|
| GET | `/v1/giftcard/products` |

### Header Parameters

| Key | Value |
|---|---|
| public_key | Provide the public key shared. |
| hash_key | Provide the hash key generated. |

**Query Parameters**

| Query name | Data type | Description |
|---|---|---|
| country_id | integer | Country filter. |
| limit | integer | Number of items per page. |
| offset | integer | Page number. |

### Success Response Models (HTTP Code: 200)

| Field Name | Data Type | Description |
|---|---|---|
| country_id | integer | The country to which the catalog belongs. |
| products | array[object] | Each object of the array contains information about a product. |
| product_id | integer | Product identifier. |
| product_name | string | Name of the product. |
| description | string | A brief description of the product. |
| category | string | |
| currency | string | |
| denominations | array[integer] | |
| image_url | string | |

**Examples**

### CURL Request

```bash
curl --location --request GET 'https://partner-api.vantagecircle.in/v1/giftcard/products' \
--header 'hash_key: 52ba82168f93744d40333f4883ae5f0e' \
--header 'public_key: 7060'
```

**SUCCESS RESPONSE**

```json
{
    "count": 100,
    "products": [
        {
            "product_id": 9932,
            "product_name": "PVR Cinemas E-Gift Card",
            "description": "<ul><li>PVR Cinemas has gone from strength to strength since it opened its first multiplex theater in 1995.</li><li> What better way to gift them this experience than through the PVR e-Gift card? It takes a few minutes to order and it's in your gift recipient's inbox in another few minutes.</li></ul>",
            "terms_and_conditions": "<ul>\r\n\t<li>This E-Gift Card is Powered by Qwikcilver.</li>\r\n\t<li>This E-gift card is valid for all purchases done online through www.pvrcinemas.com (Tickets and F&amp;B menu present online if applicable)</li>\r\n\t<li>This Gift card/ E- Gift Card can be redeemed only at selected outlets.</li>\r\n\t<li>This E-Gift card can be used for multiple purchases made online</li>\r\n\t<li>No refund of cash will be made for any items purchased with the E-gift card.</li>\r\n\t<li>E-Gift card cannot be used to purchase movie vouchers and candy bar vouchers.</li>\r\n\t<li>This E-Gift card does not guarantee seating and ticket availability</li>\r\n\t<li>This E-Gift card can neither be redeemed for cash or credit nor would any unutilized balance be refunded &amp; cannot be exchanged for a Gift card.</li>\r\n\t<li>This E-Gift Card is freely transferable</li>\r\n\t<li>In case the value of the service exceeds the value of the Gift card, the difference must be paid by credit card or debit card.</li>\r\n\t<li>If the E Gift card is lost or stolen, neither will a new E Gift Card will be issued nor will the money be reimbursed in any manner.</li>\r\n\t<li>Protect the card numbers and pin numbers to avoid misuse. In case the card number gets stolen, it cannot be replaced, nor cash refunded.</li>\r\n\t<li>E-Gift Cards are normally delivered instantly. But sometimes due to system issues, the delivery can be delayed up-to 24 hours.</li>\r\n</ul>\r\n",
            "category": "ticket booking",
            "currency": "INR",
            "denominations": [
                500
            ],
            "image_url": "pvr_gift2.jpg"
        },
        {
            "product_id": 9937,
            "product_name": "Shoppers Stop E-Gift Voucher",
            "description": "<ul><li>Shoppers Stop is the perfect one-stop-shop for every imaginable luxury item a person might desire.</li><li> Shoppers Stop hosts multiple lifestyle brands in beauty, fashion, accessories, home products, health, fragrances and many other categories.</li><li> Purchase a Shoppers Stop e-Gift card as a last-minute gift for any special occasion.</li></ul>",
            "terms_and_conditions": "<ul>\r\n\t<li>This e-gift voucher is redeemable online at the Shoppers Stop website i.e www.shoppersstop.com and at the Shoppers Stop stores.</li>\r\n\t<li>Purchase of Mobiles, Mobile Phone Accessories, Cameras, mp3 players, laptops, 22K &amp; 24K Gold Jewelry &amp; Gold Coins of any Jewelry brand is not allowed through this e-gift voucher.</li>\r\n\t<li>E-gift voucher is not redeemable for cash or credit nor can be exchanged for a gift voucher/Gift card.</li>\r\n\t<li>E-gift voucher cannot be reloaded.</li>\r\n\t<li>Only a credit note shall be issued for part utilization of the e-gift voucher.</li>\r\n\t<li>If the e-gift voucher is lost or stolen, neither will a new e-gift voucher will be issued nor will the money be reimbursed in any manner. No duplicate E-gift card will be issued.</li>\r\n\t<li>Shoppers Stop Limited shall not be liable and responsible for any unauthorized and/or fraudulent purchase/s made using this e-gift voucher. The holder of this e-gift voucher shall be solely responsible for the safe custody of the e-gift voucher and the credentials mentioned on it.</li>\r\n\t<li>E-gift voucher is property of Shoppers Stop Limited to whom it should be returned on request.</li>\r\n\t<li>For balance enquiry &amp; expiry, contact a cashier or SMS GCBAL16 digit e-gift voucher number to 56161 or log on to www.shoppersstop.com</li>\r\n\t<li>Shoppers Stop reserves the right to amend the terms &amp; conditions at its discretion without prior notice. Dispute/s subject to Mumbai jurisdiction.</li>\r\n\t<li>Please carry a print out of e-gift voucher to the outlet to redeem it.</li>\r\n</ul>\r\n",
            "category": "fashion",
            "currency": "INR",
            "denominations": [
                250,
                500,
                1000,
                2000
            ],
            "image_url": "shopperstop_gift1.jpg"
        }
    ]
}
```

---

## CREATE ORDER API

To create an order for a Gift Card.

### Request

| Method | API Endpoint |
|---|---|
| POST | `/v1/giftcard/order` |

#### Header Parameters

| Key | Value |
|---|---|
| Content-Type | application/json |
| public_key | Provide the public key shared. |
| hash_key | Provide the hash key generated. |

#### Body Parameters

| Field Name | Data Type | Comment |
|---|---|---|
| client_reference | string | Idempotent field that can be used for client-side order cross reference and prevent accidental order duplication. Will be returned in order response, order details, and order history. |
| product_id | integer | We will provide |
| amount | integer | min(US) = $5, min(IN) = ₹250 |
| quantity | integer | 1 for outside India<br>1 to 10 for India (and only 1 for product id 3364) |
| country_id | integer | Refer to the Country List |
| currency_code | string | E.g. USD, GBP, INR, etc. |
| delivery_method | string | email or api |
| receiver_email | string | Optional if delivery method is **api** |
| email_subject | string | Optional |
| email_template | string | Optional, we can send a default if not given |
| notification_email | string | Optional |

### Success Response Models (HTTP Code: 200, Delivery Method: api)

#### Root Object

| Field Name | Data Type | Description |
|---|---|---|
| status | string | Status of the Order (COMPLETE/PENDING) |
| status_message | string | |
| order_id | string | Unique identifier of an order. |
| client_reference | string | |
| quantity | integer | |
| card_info | object | Card Info Object |

#### Card Info Object

| Field Name | Data Type | Description |
|---|---|---|
| currency_code | string | E.g. USD, GBP, INR, etc. |
| quantity | integer | Number of gift cards the client wants to purchase in a single order. |
| card_value | integer | Value of each card. |
| redemption_instructions | string | Pin or url to redeem the gift card. |
| cards | array[object] | Card Object |

#### Card Object

| Field Name | Data Type | Description |
|---|---|---|
| card_price | string | Price of each card. |

| Field Name | Data Type | Description |
|---|---|---|
| expiry_date | string | Date till which the card is valid. |
| cardnumber | string | Number of the card. |
| pin_or_url | string | Redemption code for the gift card. |

### Examples -

### CURL Request

```bash
curl --location --request POST 'https://partner-api.vantagecircle.in/v1/giftcard/order' \
--header 'public_key: 7060' \
--header 'hash_key: 4161bd9ed5a377e3e03586c88306f480' \
--header 'Content-Type: application/json' \
--data-raw '{
    "client_reference": "1234abcd",
    "product_id": 10615,
    "amount": 500,
    "quantity": 1,
    "country_id": 91,
    "currency_code": "INR",
    "delivery_method": "api",
    "receiver_email": "",
    "email_subject": "",
    "email_template": "",
    "notification_email": ""
}'
```

### Success Response (Delivery Method: api)

```json
{
    "status": "Complete",
    "status_message": "Order has been completed successfully.",
    "order_id": "443833",
    "client_reference": "1234abcd",
    "card_info": {
        "currency_code": "INR",
        "quantity": 1,
        "card_value": 500,
        "redemption_instructions": "Use the pin_or_url to redeem gift card",
        "cards": [
            {
                "card_price": "500.0000",
                "expiry_date": "2022-09-28",
                "cardnumber": "7575751203393938",
                "pin_or_url": "KC6V-9S6AEM-UR55",
                "activation_code": ""
            }
        ]
    }
}
```

### Response Models (Success, HTTP Code: 200, Delivery Method: email)

#### Root Object

| Field Name | Data Type | Description |
|---|---|---|
| status | string | Status of the Order (COMPLETE/PENDING) |
| status_message | string | For a successful order: "Order has been completed successfully." |
| order_id | string | Unique identifier of an order. |
| client_reference | string | Alphanumeric string sent by the user. Used to verify duplicate orders. |
| receiver_email | string | Email at which the gift card is intended to be sent. |

### Example Success Response (Delivery Method: email)

```json
{
    "status": "COMPLETE",
    "status_message": "The gift card details have been sent to the respective email.",
    "order_id": "VC190710-13159-89",
    "client_reference": "8fe83ee6d226aa10405ad52cf741bb4f",
    "receiver_email": "user@example.com"
}
```

### Error Response Models

#### Error Response Object

| Field Name | Data Type | Description |
|---|---|---|
| status | string | ERROR |
| error_code | string | Error Codes |
| error_message | string | APPENDIX - A |
| error_details | string | |

### Example Error Response

```json
{
    "status": "ERROR",
    "error_code": "SE002",
    "error_message": "Required field missing from request",
    "error_details": "Field \"delivery_method\" missing from request"
}
```

---

## RESEND API

To fetch the details of a gift card already redeemed.

### Request

| Method | API Endpoint |
|---|---|
| GET | `/v1/giftcard/resend?orderId=$orderId` |

### Header Parameters

| Key | Value |
|---|---|
| Content-Type | application/json |
| public_key | Provide the public key shared. |
| hash_key | Provide the hash key generated. |

### Success Response Models (HTTP Code: 200)

#### Root Object

| Field Name | Data Type | Description |
|---|---|---|
| success | boolean | |
| status | string | Status of the order |
| carddetails | object | Object containing details of a gift card. |
| order_id | string | |

**For orders that are still PENDING**

| Field Name | Data Type | Description |
|---|---|---|
| message | string | |

### Example -

### CURL Request

```bash
curl --location --request GET 'https://partner-api.vantagecircle.in/v1/giftcard/resend?orderId=443833' \
--header 'public_key: 7060' \
--header 'hash_key: 8301da938b799a0aff185a114081a22a'
```

### Success Response (HTTP Code: 200)

```json
{
    "success": true,
    "status": "Complete",
    "carddetails": {
        "Amazon Pay E-Gift Card": [
            {
                "card_price": "500.0000",
                "expiry_date": "2022-09-28",
                "cardnumber": "7575751203393938",
                "pin_or_url": "KC6V-9S6AEM-UR55",
                "activation_code": "",
                "labels": {
                    "cardnumber": "Gift Card ID",
                    "card_pin": "Claim Code",
                    "activation_code": "",
                    "validity": "Validity"
                }
            }
        ]
    },
    "order_id": "3181715662"
}
```

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
| SE003 | A request field has an invalid value. |
| SE004 | Not enough credit to complete the requested purchase. Please top up your account and try again. |
| SE005 | Duplication external reference. The given external reference value has already been used. Please use a new reference value and try again. |
| SE006 | No results found. For example, a requested product does not exist. Mostly a caller error. Please check your query parameters and try again. |
| SE007 | Customer account is not active. |
| SE008 | Ordering is disabled for this customer account. Please contact Vantage Circle support for more information. |
| SE999 | An unexpected error occurred. Please check the error_message response fields for more detail on this error. |

### Error Codes (specific to orders)

| Error Code | Reason |
|---|---|
| EC001 | Error retrieving Card Details from data processor |
| EC002 | Data processor connection timed out |
| EC003 | Could not establish a connection to data processor |
| EC004 | Product not active |
| EC005 | The currency doesn't match the product |
| EC006 | Invalid value for Card Details |
| EC007 | This combination of product and value is currently out of stock |
| EC008 | This e-code request has been canceled |
| EC998 | Persistence error |
| EC999 | Internal server error |

---

## VIEWING ORDER HISTORY AND FUNDING HISTORY

History of orders and funds can be viewed by visiting the following urls:

| Environment | URL |
|---|---|
| Sandbox | `https://dashboard.vantagecircle.in` |
| Production | `https://dashboard.vantagecircle.com` |

Please contact Vantage Circle to obtain the credentials to log into the gift cards dashboard portal.

**Guide to viewing order history and funding history:**

1. Log in to the dashboard portal.
   - Sign In screen: Use your **corporate email-id** to sign in. Enter Email and Password, then click **Sign In**. ("Welcome to Vantage Circle — Your one-stop solution for managing your employee engagement suite.")
2. Click on the **Gift Cards** menu tab.
   - The Gift Cards menu shows two options: **Order History** and **Funding History**.
3. **Viewing Order History:**
   - The Order History view shows **TOTAL BUDGET AVAILABLE** (e.g. `2663287.4800000004`), a date range filter (Start Date / End Date with a **Go** button), and **Export** options (Csv, Excel, Text).
   - The order table columns are: **Ref Order ID**, **Rewards**, **Total**, **Currency**, **Created**, **External Order ID**.
   - Example rows (Rewards = "Amazon.in E-Gift Card", Currency = INR):

     | Ref Order ID | Rewards | Total | Currency | Created | External Order ID |
     |---|---|---|---|---|---|
     | 1306276 | Amazon.in E-Gift Card | 1500.0 | INR | 30-11-2021 03:26:03 pm | 4241239899 |
     | 1306210 | Amazon.in E-Gift Card | 2500.0 | INR | 30-11-2021 03:04:52 pm | 4241239817 |
     | 1306209 | Amazon.in E-Gift Card | 2500.0 | INR | 30-11-2021 03:04:28 pm | 4241239816 |
     | 1306208 | Amazon.in E-Gift Card | 2500.0 | INR | 30-11-2021 03:03:54 pm | 4241239815 |
     | 1306206 | Amazon.in E-Gift Card | 250.0 | INR | 30-11-2021 03:03:35 pm | 4241239813 |

4. **Viewing Funding History:**
   - The Funding History view shows **TOTAL BUDGET AVAILABLE** (e.g. `2663287.4800000004`), a date range filter (Start Date / End Date with a **Go** button), and **Export** options (Csv, Excel, Text).
   - The funding table columns are: **Date**, **Type**, **Transaction ID**, **Amount**, **Currency**, **Status**.
   - Example rows (Type = "Bank Transfer", Currency = INR, Status = Processed):

     | Date | Type | Transaction ID | Amount | Currency | Status |
     |---|---|---|---|---|---|
     | 25-11-2021 12:06:26 pm | Bank Transfer | 75 | 5000648.0 | INR | Processed |
     | 18-11-2021 10:51:05 pm | Bank Transfer | 74 | 36710.0 | INR | Processed |
     | 18-11-2021 07:40:38 pm | Bank Transfer | 73 | 3649105.0 | INR | Processed |
     | 02-11-2021 12:52:10 pm | Bank Transfer | 72 | 3673175.0 | INR | Processed |
     | 19-10-2021 05:56:08 pm | Bank Transfer | 71 | 3687598.0 | INR | Processed |
     | 12-10-2021 01:39:01 pm | Bank Transfer | 70 | 5519696.0 | INR | Processed |

---

## APPENDIX - B

### List of Countries

| Id | Name | Currency Code |
|---|---|---|
| 1 | United States | USD |
| 44 | United Kingdom | GBP |
| 60 | Malaysia | MYR |
| 61 | Australia | AUD |
| 62 | Indonesia | IDR |
| 63 | Philippines | PHP |
| 65 | Singapore | SGD |
| 66 | Thailand | THB |
| 81 | Japan | JPY |
| 82 | South Korea | KRW |
| 84 | Vietnam | VND |
| 91 | India | INR |
| 94 | Sri Lanka | LKR |
| 880 | Bangladesh | BDT |
| 886 | Taiwan | TWD |
| 965 | Kuwait | KWD |
| 966 | Saudi Arabia | SAR |
| 968 | Oman | OMR |
| 971 | United Arab Emirates | AED |
| 973 | Bahrain | BHD |
| 974 | Qatar | QAR |

---

*Powered by Vantage Circle*
