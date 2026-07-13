# Vantage Circle — Points ⇄ Currency Conversion Rates (Reference)

> **Purpose:** Give this file to an AI assistant (Claude, ChatGPT, etc.) as context. It contains everything needed to answer: *"For client X in country Y, how many points equal 1 unit of currency?"* and to convert points ⇄ money.
> **As of:** 2026-07-10 · derived from platform configuration + empirically validated against **2.19M gift-card redemptions (Nov 2024 – Jun 2026)** with **zero contradictions**.

---

## 1. How conversion works

- Formula: **`currency_amount = points ÷ points_per_unit`** (so `points_per_unit` = points needed for 1 unit of currency).
- Rate resolution order:
  1. **Explicit client rule** — a per-client (sometimes per-country) override configured in the application.
  2. **Country default** — if no client rule exists, the country's default `points_per_unit` applies (Section 3). Defaults are always 1, 10, or 100.
- **Cross-currency (FX-linked) redemptions:** points are pegged to the employee's *home* currency. If they redeem in a different currency (usually USD/EUR), the observed ratio = home peg × FX rate of that day, so it varies. Example: Amdocs Mexico peg is 1 pt = 1 MXN; a USD gift card therefore costs ≈17–19 pts per $1 (the MXN/USD rate). Rows marked `FX` below are of this kind — quote the peg, not a fixed cross rate.

## 2. The three dominant policies

| Policy | Clients | Notes |
|---|---|---|
| **1 pt = 1 unit of local currency** | 172 of 226 (~76%, ~95% of txn volume) | Deloitte, Infosys, Amdocs, Bosch, Tata Motors, most others |
| **100 pts = 1 unit** | 26 | LTIMindtree, Tata Communications, LPL Financial, L&T Tech (non-India) |
| **Custom per-country map** | 27 | Wipro is the largest (25 pts = 1 USD, 38.92 = 1 GBP, 1.52 = 1 PHP, …) |

## 3. Country default rates (apply when a client has no override)

| Country | Currency | Default pts per 1 unit |
|---|---|---|
| Afghanistan | AFN | 1 |
| Albania | ALL | 1 |
| Algeria | DZD | 1 |
| American Samoa | USD | 100 |
| Andorra | EUR | 100 |
| Angola | AOA | 1 |
| Anguilla | XCD | 10 |
| Antigua and Barbuda | XCD | 10 |
| Argentina | ARS | 1 |
| Armenia | AMD | 1 |
| Aruba | AWG | 10 |
| Australia | AUD | 100 |
| Austria | EUR | 100 |
| Azerbaijan | AZN | 100 |
| Bahamas | BSD | 100 |
| Bahrain | BHD | 100 |
| Bangladesh | BDT | 1 |
| Barbados | BBD | 10 |
| Belarus | BYN | 100 |
| Belgium | EUR | 100 |
| Belize | BZD | 100 |
| Benin | XOF | 1 |
| Bermuda | BMD | 100 |
| Bhutan | BTN | 1 |
| Bolivia | BOB | 10 |
| Bonaire, Sint Eustatius and Saba | USD | 100 |
| Bosnia and Herzegovina | BAM | 10 |
| Botswana | BWP | 10 |
| Brazil | BRL | 10 |
| British Virgin Islands | USD | 100 |
| Brunei Darussalam | BND | 100 |
| Bulgaria | EUR | 100 |
| Burkina Faso | XOF | 1 |
| Burundi | BIF | 1 |
| Cambodia | KHR | 1 |
| Cameroon | XAF | 1 |
| Canada | CAD | 100 |
| Cape Verde | CVE | 1 |
| Central African Republic | XAF | 1 |
| Chad | XAF | 1 |
| Chile | CLP | 1 |
| China | CNY | 10 |
| Colombia | COP | 1 |
| Congo | XAF | 1 |
| Congo (Democratic Republic) | CDF | 1 |
| Costa Rica | CRC | 1 |
| Cote DIvoire | XOF | 1 |
| Croatia | EUR | 100 |
| Cuba | CUP | 10 |
| Cyprus | EUR | 100 |
| Czech Republic | CZK | 1 |
| Denmark | DKK | 10 |
| Djibouti | DJF | 1 |
| Dominica | XCD | 10 |
| Dominican Republic | DOP | 1 |
| East Timor | USD | 100 |
| Ecuador | USD | 100 |
| Egypt | EGP | 1 |
| El Salvador | SVC | 10 |
| Equatorial Guinea | XAF | 1 |
| Eritrea | ERN | 1 |
| Estonia | EUR | 1 |
| Eswatini | SZL | 1 |
| Eswatini (Swaziland) | SZL | 1 |
| Ethiopia | ETB | 1 |
| Fiji | FJD | 100 |
| Finland | EUR | 100 |
| France | EUR | 100 |
| French Guiana | EUR | 10 |
| Gabon | XAF | 1 |
| Gambia | GMD | 1 |
| Georgia | GEL | 10 |
| Germany | EUR | 100 |
| Ghana | GHS | 10 |
| Greece | EUR | 100 |
| Greenland | DKK | 10 |
| Grenada | XCD | 10 |
| Guam | USD | 100 |
| Guatemala | GTQ | 10 |
| Guinea | GNF | 1 |
| Guinea-Bissau | XOF | 1 |
| Guyana | GYD | 1 |
| Haiti | HTG | 1 |
| Honduras | HNL | 1 |
| HongKong | HKD | 10 |
| Hungary | HUF | 1 |
| Iceland | ISK | 1 |
| India | INR | 1 |
| Indonesia | IDR | 1 |
| Iran | IRR | 1 |
| Iraq | IQD | 1 |
| Ireland | EUR | 100 |
| Israel | ILS | 10 |
| Italy | EUR | 100 |
| Jamaica | JMD | 1 |
| Japan | JPY | 1 |
| Jordan | JOD | 100 |
| Kazakhstan | KZT | 1 |
| Kenya | KES | 1 |
| Kiribati | AUD | 100 |
| Korea (North) | KPW | 1 |
| Korea (South) | KRW | 1 |
| Kuwait | KWD | 100 |
| Kyrgyzstan | KGS | 1 |
| Laos | LAK | 1 |
| Latvia | EUR | 100 |
| Lebanon | LBP | 1 |
| Lesotho | LSL | 1 |
| Liberia | LRD | 1 |
| Libya | LYD | 100 |
| Liechtenstein | CHF | 100 |
| Lithuania | EUR | 100 |
| Luxembourg | EUR | 100 |
| Macau | MOP | 10 |
| Macedonia | MKD | 1 |
| Madagascar | MGA | 1 |
| Malawi | MWK | 1 |
| Malaysia | MYR | 10 |
| Mali | XOF | 1 |
| Malta | EUR | 100 |
| Marshall Islands | USD | 100 |
| Martinique | EUR | 100 |
| Mauritania | MRU | 1 |
| Mauritius | MUR | 1 |
| Mexico | MXN | 1 |
| Micronesia | USD | 100 |
| Monaco | EUR | 100 |
| Mongolia | MNT | 1 |
| Montenegro | EUR | 100 |
| Morocco | MAD | 10 |
| Mozambique | MZN | 1 |
| Myanmar | MMK | 1 |
| Namibia | NAD | 1 |
| Nauru | AUD | 100 |
| Nepal | NPR | 1 |
| Netherlands | EUR | 100 |
| Netherlands Antilles | ANG | 10 |
| New Zealand | NZD | 100 |
| Nicaragua | NIO | 1 |
| Niger | XOF | 1 |
| Nigeria | NGN | 1 |
| Norway | NOK | 10 |
| Oman | OMR | 100 |
| Others | Others | 100 |
| Pakistan | PKR | 1 |
| Palau | USD | 100 |
| Palestine | ILS | 10 |
| Panama | PAB | 100 |
| Papua New Guinea | PGK | 10 |
| Paraguay | PYG | 1 |
| Peru | PEN | 10 |
| Philippines | PHP | 1 |
| Poland | PLN | 10 |
| Portugal | EUR | 100 |
| Puerto Rico | USD | 100 |
| Qatar | QAR | 10 |
| Republic of Moldova | MDL | 1 |
| Rest of the world | USD | 100 |
| Romania | RON | 10 |
| Russia | RUB | 1 |
| Rwanda | RWF | 1 |
| Saint Helena | SHP | 100 |
| Saint Kitts and Nevis | XCD | 10 |
| Saint Lucia | XCD | 10 |
| Saint Vincent and the Grenadines | XCD | 10 |
| Samoa | WST | 10 |
| San Marino | EUR | 100 |
| Saudi Arabia | SAR | 10 |
| Senegal | XOF | 1 |
| Serbia | RSD | 1 |
| Sierra Leone | SLL | 1 |
| Singapore | SGD | 100 |
| Slovakia | EUR | 100 |
| Slovenia | EUR | 100 |
| Solomon Islands | SBD | 1 |
| Somalia | SOS | 1 |
| South Africa | ZAR | 10 |
| South Korea | KRW | 1 |
| South Sudan | SSP | 1 |
| Spain | EUR | 100 |
| Sri Lanka | LKR | 1 |
| Sudan | SDG | 1 |
| Suriname | SRD | 10 |
| Sweden | SEK | 10 |
| Switzerland | CHF | 100 |
| Syria | SYP | 1 |
| Taiwan | TWD | 1 |
| Tajikistan | TJS | 10 |
| Tanzania | TZS | 1 |
| Thailand | THB | 1 |
| Togo | XOF | 1 |
| Tonga | TOP | 100 |
| Trinidad and Tobago | TTD | 10 |
| Tunisia | TND | 10 |
| Turkey | TRY | 10 |
| Turkmenistan | TMT | 10 |
| Tuvalu | AUD | 100 |
| Uganda | UGX | 1 |
| Ukraine | UAH | 1 |
| United Arab Emirates | AED | 10 |
| United Kingdom | GBP | 100 |
| United States | USD | 100 |
| United States Minor Outlying Islands | USD | 100 |
| Uruguay | UYU | 1 |
| Uzbekistan | UZS | 1 |
| Vanuatu | VUV | 1 |
| Venezuela | VEF | 10 |
| Vietnam | VND | 1 |
| Virgin Islands US | USD | 100 |
| Wallis and Futuna | XPF | 1 |
| Yemen | YER | 1 |
| Zambia | ZMK | 1 |
| Zimbabwe | ZWL | 1 |

## 4. Client-specific rates (configured + observed)

Columns: **Rate** = points per 1 unit of the redemption currency. **Source**: `rule` = explicit app configuration (validated by data); `default` = country default (validated); `observed` = derived from redemption data only (stable flat rate, client not matched to a named rule); `FX` = cross-currency, floats with FX — the client's peg is the home-currency row. **Txns** = redemptions observed (confidence; `0` = configured but not yet used).

Clients sorted by redemption volume; countries by volume within each client.

### Deloitte
*Policy: Custom per-country rates · 531,544 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 303,573 |
| United States | USD | 1 | observed | 227,963 |
| Singapore | SGD | 100 | default | 5 |
| Malaysia | MYR | 10 | default | 1 |
| Malaysia (pegged to MYR) | USD | 44.62 (≈ varies with FX) | FX | 1 |
| Philippines | PHP | 1 | default | 1 |

### Wipro
*Policy: Custom per-country rates · 469,148 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | rule | 405,712 |
| Philippines | PHP | 1.52 | rule | 23,620 |
| United States | USD | 25 | rule | 11,073 |
| United Kingdom | GBP | 38.92 | rule | 5,914 |
| Romania | RON | 11.12 | rule | 4,367 |
| Canada | CAD | 20 | rule | 2,852 |
| China | CNY | 7.15 | rule | 2,041 |
| Brazil | BRL | 8.34 | rule | 1,600 |
| Australia | AUD | 20 | rule | 1,526 |
| Germany | EUR | 33.34 | rule | 1,386 |
| Saudi Arabia | SAR | 7.15 | rule | 1,175 |
| Poland | PLN | 12.5 | rule | 801 |
| Taiwan | TWD | 1 | rule | 779 |
| Switzerland | CHF | 25 | rule | 701 |
| Mexico | MXN | 3.572 | rule | 542 |
| Portugal | EUR | 33.34 | rule | 539 |
| Singapore | SGD | 20 | rule | 499 |
| Netherlands | EUR | 33.34 | rule | 347 |
| South Africa | ZAR | 1.852 | rule | 312 |
| Malaysia | MYR | 11.12 | rule | 295 |
| Sweden | SEK | 2.942 | rule | 273 |
| Brazil (pegged to BRL) | USD | 44.5 (≈ varies with FX) | FX | 260 |
| United Arab Emirates | AED | 7.15 | rule | 250 |
| Japan | JPY | 0.25 | rule | 248 |
| Costa Rica (pegged to CRC) | USD | 22.9 (≈ varies with FX) | FX | 236 |
| Spain | EUR | 33.34 | rule | 229 |
| Ireland | EUR | 33.34 | rule | 199 |
| Sri Lanka | LKR | 0.242 | rule | 178 |
| Costa Rica | CRC | 0.05 | rule | 169 |
| France | EUR | 33.34 | rule | 156 |
| Italy | EUR | 33.34 | rule | 116 |
| Qatar | QAR | 7.16 | rule | 88 |
| Mexico (pegged to MXN) | USD | 62 (≈ varies with FX) | FX | 77 |
| Belgium | EUR | 33.34 | rule | 66 |
| Finland | EUR | 33.34 | rule | 64 |
| Romania (pegged to RON) | EUR | 56.54 (≈ varies with FX) | FX | 46 |
| Philippines (pegged to PHP) | USD | 89 (≈ varies with FX) | FX | 45 |
| Austria | EUR | 33.34 | rule | 44 |
| Denmark | DKK | 3.847 | rule | 38 |
| Ireland (pegged to EUR) | GBP | 39 (≈ varies with FX) | FX | 33 |
| Singapore (pegged to SGD) | USD | 25.692 (≈ varies with FX) | FX | 29 |
| New Zealand | NZD | 16.6667 | rule | 28 |
| Czech Republic | CZK | 1.283 | rule | 26 |
| Poland (pegged to PLN) | EUR | 53.34 (≈ varies with FX) | FX | 26 |
| Sweden (pegged to SEK) | EUR | 32.52 (≈ varies with FX) | FX | 21 |
| Taiwan (pegged to TWD) | USD | 31.44 (≈ varies with FX) | FX | 16 |
| Colombia (pegged to COP) | USD | 90.08 (≈ varies with FX) | FX | 16 |
| Malaysia (pegged to MYR) | USD | 44.6 (≈ varies with FX) | FX | 15 |
| Czech Republic (pegged to CZK) | EUR | 31 (≈ varies with FX) | FX | 15 |
| Thailand | THB | 1.48 | rule | 14 |
| Norway | NOK | 2.942 | rule | 10 |
| Colombia | COP | 0.025 | rule | 9 |
| South Korea | KRW | 0.025 | rule | 8 |
| Luxembourg | EUR | 33.34 | rule | 6 |
| Hungary | HUF | 0.1668 | rule | 6 |
| Hungary (pegged to HUF) | EUR | 63.6 (≈ varies with FX) | FX | 3 |
| Bahrain | BHD | 100 | rule | 2 |
| Bangladesh | BDT | 0.834 | rule | 1 |
| Denmark (pegged to DKK) | EUR | 28.72 (≈ varies with FX) | FX | 1 |
| Kenya | KES | 0.625 | rule | 0 |
| Israel | ILS | 7.352 | rule | 0 |
| Oman | OMR | 100 | rule | 0 |
| Trinidad and Tobago | TTD | 4.1667 | rule | 0 |
| HongKong | HKD | 3.5714 | rule | 0 |
| Bolivia | BOB | 6.666 | rule | 0 |
| Bulgaria | EUR | 33.3333 | rule | 0 |
| Kazakhstan | KZT | 0.1667 | rule | 0 |
| Nigeria | NGN | 0.1667 | rule | 0 |
| Myanmar | MMK | 0.05 | rule | 0 |
| Turkey | TRY | 6.25 | rule | 0 |
| Indonesia | IDR | 0.005 | rule | 0 |
| Chile | CLP | 0.0625 | rule | 0 |
| Argentina | ARS | 0.5 | rule | 0 |
| Peru | PEN | 12.5 | rule | 0 |
| Code 1999 | In Points | 25 | rule | 0 |

### Infosys
*Policy: 1 pt = 1 unit local currency · 399,948 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | rule | 385,112 |
| United States | USD | 1 | rule | 5,834 |
| Canada | CAD | 1 | rule | 2,538 |
| United Kingdom | GBP | 1 | rule | 1,464 |
| Australia | AUD | 1 | rule | 1,105 |
| Germany | EUR | 1 | rule | 684 |
| Netherlands | EUR | 1 | rule | 485 |
| Japan | JPY | 1 | rule | 324 |
| Singapore | SGD | 1 | rule | 300 |
| China | CNY | 1 | rule | 268 |
| France | EUR | 1 | rule | 213 |
| Mexico | MXN | 1 | rule | 203 |
| Belgium | EUR | 1 | rule | 179 |
| Sweden | SEK | 1 | rule | 117 |
| South Korea | KRW | 1 | rule | 117 |
| Switzerland | CHF | 1 | rule | 115 |
| Czech Republic | CZK | 1 | rule | 91 |
| New Zealand | NZD | 1 | rule | 73 |
| Poland | PLN | 1 | rule | 68 |
| Mexico (pegged to MXN) | USD | 18 (≈ varies with FX) | FX | 66 |
| Ireland | EUR | 1 | rule | 64 |
| Philippines | PHP | 1 | rule | 61 |
| United Arab Emirates | AED | 1 | rule | 58 |
| Mauritius (pegged to MUR) | USD | 45.25 (≈ varies with FX) | FX | 49 |
| Malaysia | MYR | 1 | rule | 48 |
| Denmark | DKK | 1 | rule | 29 |
| HongKong | HKD | 1 | rule | 28 |
| Thailand | THB | 1 | rule | 25 |
| Romania | RON | 1 | rule | 23 |
| New Zealand (pegged to NZD) | USD | 1.76 (≈ varies with FX) | FX | 22 |
| Jordan | JOD | 1 | rule | 15 |
| Brazil (pegged to BRL) | USD | 5.74 (≈ varies with FX) | FX | 14 |
| Hungary | HUF | 1 | rule | 14 |
| Brazil | BRL | 1 | rule | 13 |
| Czech Republic (pegged to CZK) | EUR | 25 (≈ varies with FX) | FX | 13 |
| Luxembourg | EUR | 1 | rule | 12 |
| Spain | EUR | 1 | rule | 11 |
| Norway | NOK | 1 | rule | 11 |
| Finland | EUR | 1 | rule | 11 |
| Singapore (pegged to SGD) | USD | 1.3 (≈ varies with FX) | FX | 10 |
| Ireland (pegged to EUR) | GBP | 1.2 (≈ varies with FX) | FX | 9 |
| Sweden (pegged to SEK) | EUR | 10.82 (≈ varies with FX) | FX | 8 |
| Taiwan | TWD | 1 | rule | 8 |
| Italy | EUR | 1 | rule | 6 |
| Portugal | EUR | 1 | rule | 5 |
| Hungary (pegged to HUF) | EUR | 402.6 (≈ varies with FX) | FX | 4 |
| HongKong (pegged to HKD) | USD | 7.77 (≈ varies with FX) | FX | 4 |
| Peru | PEN | 1 | rule | 3 |
| Thailand (pegged to THB) | USD | 31.64 (≈ varies with FX) | FX | 3 |
| Croatia | EUR | 1 | rule | 2 |
| Taiwan (pegged to TWD) | USD | 30.2 (≈ varies with FX) | FX | 2 |
| Malaysia (pegged to MYR) | USD | 4.44 (≈ varies with FX) | FX | 2 |
| Norway (pegged to NOK) | EUR | 11.8 (≈ varies with FX) | FX | 1 |
| Denmark (pegged to DKK) | EUR | 7.48 (≈ varies with FX) | FX | 1 |
| Malta | EUR | 1 | rule | 1 |
| Qatar | QAR | 1 | rule | 1 |
| South Korea (pegged to KRW) | USD | 1429 (≈ varies with FX) | FX | 1 |

### LTIMindtree
*Policy: Custom per-country rates · 143,355 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 136,865 |
| United States | USD | 100 | default | 2,942 |
| Canada | CAD | 100 | default | 1,073 |
| Poland | PLN | 10 | default | 711 |
| United Kingdom | GBP | 100 | default | 497 |
| Australia | AUD | 100 | default | 140 |
| Luxembourg | EUR | 100 | default | 134 |
| Denmark | DKK | 10 | default | 131 |
| France | EUR | 100 | default | 104 |
| Germany | EUR | 100 | default | 97 |
| South Africa | ZAR | 10 | default | 84 |
| Sweden | SEK | 10 | default | 83 |
| Saudi Arabia | SAR | 10 | default | 82 |
| Singapore | SGD | 100 | default | 69 |
| United Arab Emirates | AED | 10 | default | 68 |
| Costa Rica (pegged to CRC) | USD | 470.6 (≈ varies with FX) | FX | 59 |
| Netherlands | EUR | 100 | default | 50 |
| Mexico | MXN | 1 | default | 44 |
| Malaysia | MYR | 10 | default | 16 |
| China | CNY | 10 | default | 14 |
| Japan | JPY | 1 | default | 10 |
| Finland | EUR | 100 | default | 10 |
| Norway | NOK | 10 | default | 10 |
| Poland (pegged to PLN) | EUR | 42.4 (≈ varies with FX) | FX | 8 |
| Sweden (pegged to SEK) | EUR | 108.36 (≈ varies with FX) | FX | 7 |
| Italy | EUR | 100 | default | 7 |
| Ireland | EUR | 100 | default | 6 |
| Costa Rica | CRC | 1 | default | 5 |
| Belgium | EUR | 100 | default | 5 |
| Brazil (pegged to BRL) | USD | 51.72 (≈ varies with FX) | FX | 4 |
| Cyprus (pegged to EUR) | USD | 87.2 (≈ varies with FX) | FX | 3 |
| Singapore (pegged to SGD) | USD | 128.36 (≈ varies with FX) | FX | 2 |
| Malaysia (pegged to MYR) | USD | 40.58 (≈ varies with FX) | FX | 2 |
| Cyprus | EUR | 100 | default | 2 |
| Mexico (pegged to MXN) | USD | 17.2 (≈ varies with FX) | FX | 2 |
| Norway (pegged to NOK) | EUR | 117.333 (≈ varies with FX) | FX | 2 |
| Spain | EUR | 100 | default | 2 |
| Brazil | BRL | 10 | default | 2 |
| China (pegged to CNY) | USD | 71.85 (≈ varies with FX) | FX | 1 |
| Switzerland | CHF | 100 | default | 1 |
| Hungary | HUF | 1 | default | 1 |

### Amdocs Management Limited
*Policy: 1 pt = 1 unit local currency · 112,938 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | rule | 77,319 |
| United States | USD | 1 | rule | 10,195 |
| Philippines | PHP | 1 | rule | 8,108 |
| Canada | CAD | 1 | rule | 3,744 |
| Mexico | MXN | 1 | rule | 2,066 |
| Cyprus | EUR | 1 | rule | 1,482 |
| United Kingdom | GBP | 1 | rule | 960 |
| Cyprus (pegged to EUR) | USD | 0.88 (≈ varies with FX) | FX | 769 |
| Czech Republic | CZK | 1 | rule | 723 |
| Indonesia | IDR | 1 | rule | 702 |
| Israel (pegged to ILS) | USD | 3.72 (≈ varies with FX) | FX | 678 |
| Brazil | BRL | 1 | rule | 627 |
| Malaysia | MYR | 1 | rule | 610 |
| South Africa | ZAR | 1 | rule | 419 |
| Australia | AUD | 1 | rule | 407 |
| Spain | EUR | 1 | rule | 341 |
| Singapore | SGD | 1 | rule | 332 |
| Ireland (pegged to EUR) | GBP | 1.2 (≈ varies with FX) | FX | 307 |
| Ireland | EUR | 1 | rule | 296 |
| Netherlands | EUR | 1 | rule | 294 |
| Germany | EUR | 1 | rule | 261 |
| Bulgaria | EUR | 1 | rule | 217 |
| Greece | EUR | 1 | rule | 186 |
| Chile | CLP | 1 | rule | 149 |
| Italy | EUR | 1 | rule | 144 |
| Bulgaria (pegged to EUR) | BGN | 1 (≈ varies with FX) | FX | 140 |
| Taiwan | TWD | 1 | rule | 134 |
| Brazil (pegged to BRL) | USD | 5.3 (≈ varies with FX) | FX | 116 |
| Mexico (pegged to MXN) | USD | 18.31 (≈ varies with FX) | FX | 99 |
| Peru | PEN | 1 | rule | 98 |
| Japan | JPY | 1 | rule | 93 |
| Thailand | THB | 1 | rule | 74 |
| Hungary | HUF | 1 | rule | 73 |
| Poland | PLN | 1 | rule | 67 |
| Argentina | ARS | 1 | rule | 63 |
| Colombia (pegged to COP) | USD | 3759.4 (≈ varies with FX) | FX | 61 |
| Costa Rica (pegged to CRC) | USD | 499.26 (≈ varies with FX) | FX | 51 |
| South Korea | KRW | 1 | rule | 49 |
| Chile (pegged to CLP) | USD | 925.07 (≈ varies with FX) | FX | 48 |
| Colombia | COP | 1 | rule | 45 |
| Finland | EUR | 1 | rule | 41 |
| Romania | RON | 1 | rule | 34 |
| Bulgaria (pegged to EUR) | USD | 1.69 (≈ varies with FX) | FX | 33 |
| France | EUR | 1 | rule | 28 |
| Austria | EUR | 1 | rule | 25 |
| Czech Republic (pegged to CZK) | EUR | 24.28 (≈ varies with FX) | FX | 19 |
| Denmark | DKK | 1 | rule | 17 |
| Luxembourg | EUR | 1 | rule | 17 |
| New Zealand | NZD | 1 | rule | 17 |
| Slovakia | EUR | 1 | rule | 14 |
| Philippines (pegged to PHP) | USD | 59.08 (≈ varies with FX) | FX | 13 |
| New Zealand (pegged to NZD) | USD | 1.8 (≈ varies with FX) | FX | 12 |
| Portugal | EUR | 1 | rule | 11 |
| Macau (pegged to MOP) | USD | 8.02 (≈ varies with FX) | FX | 11 |
| Puerto Rico | USD | 1 | rule | 11 |
| Singapore (pegged to SGD) | USD | 1.29 (≈ varies with FX) | FX | 11 |
| United Arab Emirates | AED | 1 | rule | 10 |
| Norway | NOK | 1 | rule | 10 |
| Denmark (pegged to DKK) | EUR | 7.48 (≈ varies with FX) | FX | 9 |
| Sweden | SEK | 1 | rule | 8 |
| Azerbaijan (pegged to AZN) | USD | 1.71 (≈ varies with FX) | FX | 7 |
| Costa Rica | CRC | 1 | rule | 7 |
| Montenegro (pegged to EUR) | USD | 1 (≈ varies with FX) | FX | 6 |
| Dominican Republic (pegged to DOP) | USD | 59.32 (≈ varies with FX) | FX | 4 |
| Malaysia (pegged to MYR) | USD | 4.14 (≈ varies with FX) | FX | 3 |
| Belgium | EUR | 1 | rule | 3 |
| Sweden (pegged to SEK) | EUR | 11.14 (≈ varies with FX) | FX | 3 |
| Canada (pegged to CAD) | USD | 1.38 (≈ varies with FX) | FX | 2 |
| Kazakhstan | KZT | 1 | rule | 1 |
| Hungary (pegged to HUF) | EUR | 393.085 (≈ varies with FX) | FX | 1 |
| Norway (pegged to NOK) | EUR | 11.67 (≈ varies with FX) | FX | 1 |
| Switzerland | CHF | 1 | rule | 1 |
| Dominican Republic | DOP | 1 | rule | 1 |

### Tata Communications
*Policy: Custom per-country rates · 75,530 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 62,964 |
| United Kingdom | GBP | 100 | default | 3,822 |
| United States | USD | 100 | default | 3,448 |
| Singapore | SGD | 100 | default | 1,055 |
| Canada | CAD | 100 | default | 753 |
| Italy | EUR | 100 | default | 641 |
| France | EUR | 100 | default | 601 |
| Germany | EUR | 100 | default | 530 |
| Switzerland | CHF | 100 | default | 244 |
| HongKong | HKD | 10 | default | 226 |
| Japan | JPY | 1 | default | 207 |
| Netherlands | EUR | 100 | default | 204 |
| Spain | EUR | 100 | default | 149 |
| Dominican Republic (pegged to DOP) | USD | 59.68 (≈ varies with FX) | FX | 147 |
| Australia | AUD | 100 | default | 125 |
| Sri Lanka | LKR | 1 | default | 124 |
| United Arab Emirates | AED | 10 | default | 69 |
| Portugal | EUR | 100 | default | 56 |
| Singapore (pegged to SGD) | USD | 129.036 (≈ varies with FX) | FX | 56 |
| Saudi Arabia | SAR | 10 | default | 25 |
| China | CNY | 10 | default | 24 |
| South Africa | ZAR | 10 | default | 17 |
| Sweden | SEK | 10 | default | 11 |
| Philippines | PHP | 1 | default | 11 |
| Indonesia | IDR | 1 | default | 8 |
| HongKong (pegged to HKD) | USD | 77.472 (≈ varies with FX) | FX | 6 |
| Luxembourg | EUR | 100 | default | 4 |
| Ireland | EUR | 100 | default | 2 |
| Indonesia (pegged to IDR) | USD | 16393.5 (≈ varies with FX) | FX | 1 |

### Bosch
*Policy: 1 pt = 1 unit local currency · 51,525 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 51,525 |

### Tata Motors Limited
*Policy: 1 pt = 1 unit local currency · 32,557 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 32,557 |

### Voya India
*Policy: 1 pt = 1 unit local currency · 23,884 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 23,884 |

### L and T Technology Services
*Policy: Custom per-country rates · 22,262 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 21,087 |
| United States | USD | 100 | default | 362 |
| Japan | JPY | 1 | rule | 328 |
| Germany | EUR | 100 | default | 256 |
| United Kingdom | GBP | 100 | default | 65 |
| Sweden | SEK | 10 | default | 53 |
| Poland | PLN | 10 | default | 22 |
| Israel (pegged to ILS) | USD | 33.12 (≈ varies with FX) | FX | 20 |
| Canada | CAD | 100 | default | 16 |
| France | EUR | 100 | default | 15 |
| Netherlands | EUR | 100 | default | 11 |
| United Arab Emirates | AED | 10 | default | 9 |
| Israel | ILS | 10 | default | 5 |
| Saudi Arabia | SAR | 10 | default | 4 |
| Australia | AUD | 100 | default | 4 |
| Taiwan (pegged to TWD) | USD | 30.5 (≈ varies with FX) | FX | 3 |
| Belgium | EUR | 100 | default | 2 |

### LPL Financial
*Policy: 100 pts = 1 unit · 19,253 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 19,253 |

### ITC Hotels
*Policy: 1 pt = 1 unit local currency · 17,205 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 17,205 |

### Mercedes Benz Research and Development India
*Policy: 1 pt = 1 unit local currency · 16,503 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 16,503 |

### SLKSoftware
*Policy: Custom per-country rates · 15,638 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 14,697 |
| United States | USD | 100 | default | 940 |
| United Kingdom | GBP | 100 | default | 1 |

### Factset
*Policy: 1 pt = 1 unit local currency · 13,301 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 13,132 |
| Philippines | PHP | 1 | default | 169 |

### Airtel
*Policy: 1 pt = 1 unit local currency · 13,210 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 13,210 |

### Renault Nissan Technology And Business Centre
*Policy: 1 pt = 1 unit local currency · 12,509 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 12,509 |

### Visteon Technical and Services Centre Pvt Ltd
*Policy: 1 pt = 1 unit local currency · 10,655 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 10,655 |

### Qualitest
*Policy: Custom per-country rates · 9,599 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 8,068 |
| United Kingdom | GBP | 100 | default | 690 |
| United States | USD | 100 | default | 328 |
| Israel | ILS | 10 | default | 265 |
| Israel (pegged to ILS) | USD | 33.32 (≈ varies with FX) | FX | 126 |
| Romania | RON | 10 | default | 43 |
| Portugal | EUR | 100 | default | 40 |
| Canada | CAD | 100 | default | 16 |
| Mexico | MXN | 1 | default | 7 |
| Argentina | ARS | 1 | default | 7 |
| Switzerland | CHF | 100 | default | 5 |
| Mexico (pegged to MXN) | USD | 18.53 (≈ varies with FX) | FX | 3 |
| Romania (pegged to RON) | EUR | 50.78 (≈ varies with FX) | FX | 1 |

### TCS US
*Policy: 1 pt = 1 unit local currency · 9,245 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| Canada | CAD | 1 | observed | 4,725 |
| United States | USD | 1 | observed | 4,520 |

### blueyonder
*Policy: 1 pt = 1 unit local currency · 8,338 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 8,338 |

### Kotak Mahindra Bank
*Policy: 1 pt = 1 unit local currency · 7,161 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 7,161 |

### Vantage Circle
*Policy: Custom per-country rates · 7,156 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 6,920 |
| United States | USD | 100 | default | 104 |
| Canada | CAD | 100 | default | 97 |
| United Kingdom | GBP | 100 | default | 13 |
| Ireland | EUR | 100 | default | 8 |
| Australia | AUD | 100 | default | 4 |
| Germany | EUR | 100 | default | 2 |
| Hungary | HUF | 1 | default | 1 |
| Romania | RON | 10 | default | 1 |
| Mexico | MXN | 1 | default | 1 |
| Brazil | BRL | 10 | default | 1 |
| Philippines | PHP | 1 | default | 1 |
| Nigeria | NGN | 1 | default | 1 |
| Cyprus | EUR | 100 | default | 1 |
| United Arab Emirates | AED | 10 | default | 1 |

### BDO Rise
*Policy: 1 pt = 1 unit local currency · 6,625 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 6,625 |

### Edelman Financial Engines
*Policy: 1 pt = 1 unit local currency · 6,479 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 1 | observed | 5,994 |
| India | INR | 1 | default | 485 |

### Value Labs
*Policy: Custom per-country rates · 6,294 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 6,189 |
| United States | USD | 100 | default | 73 |
| United Arab Emirates | AED | 10 | default | 17 |
| United Kingdom | GBP | 100 | default | 6 |
| Philippines | PHP | 1 | default | 6 |
| Malaysia (pegged to MYR) | USD | 42.56 (≈ varies with FX) | FX | 2 |
| Romania | RON | 10 | default | 1 |

### BNY
*Policy: 1 pt = 1 unit local currency · 6,260 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 6,260 |

### Blue Star Limited
*Policy: 1 pt = 1 unit local currency · 6,025 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 6,025 |

### Tata Technologies
*Policy: Custom per-country rates · 5,775 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 5,667 |
| United States | USD | 100 | default | 76 |
| United Kingdom | GBP | 100 | default | 17 |
| Germany | EUR | 100 | default | 8 |
| Sweden | SEK | 10 | default | 4 |
| China | CNY | 10 | default | 3 |

### Icertis
*Policy: 1 pt = 1 unit local currency · 5,486 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 5,151 |
| United States | USD | 1 | observed | 280 |
| Germany | EUR | 1 | observed | 28 |
| United Kingdom | GBP | 1 | observed | 14 |
| France | EUR | 1 | observed | 8 |
| Australia | AUD | 1 | observed | 4 |
| Netherlands | EUR | 1 | observed | 1 |

### IBS Software
*Policy: Custom per-country rates · 5,473 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 4,912 |
| Canada | CAD | 100 | default | 155 |
| United States | USD | 100 | default | 127 |
| Japan | JPY | 1 | default | 93 |
| Germany | EUR | 100 | default | 68 |
| United Kingdom | GBP | 100 | default | 33 |
| Australia | AUD | 100 | default | 33 |
| France | EUR | 100 | default | 14 |
| United Arab Emirates | AED | 10 | default | 14 |
| Netherlands | EUR | 100 | default | 10 |
| Singapore | SGD | 100 | default | 7 |
| Italy | EUR | 100 | default | 4 |
| Brazil | BRL | 10 | default | 2 |
| South Korea | KRW | 1 | default | 1 |

### DHL Global Forwarding Freight Shared Services LLP
*Policy: Custom per-country rates · 5,416 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 5,087 |
| China | CNY | 10 | default | 161 |
| Colombia | COP | 1 | default | 124 |
| Philippines | PHP | 1 | default | 30 |
| Colombia (pegged to COP) | USD | 3802.3 (≈ varies with FX) | FX | 14 |

### Opella
*Policy: Custom per-country rates · 5,034 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| Vietnam | VND | 1 | default | 2,181 |
| India | INR | 1 | default | 635 |
| Hungary | HUF | 1 | default | 369 |
| Poland | PLN | 10 | default | 273 |
| Brazil | BRL | 10 | default | 261 |
| China | CNY | 10 | default | 223 |
| France | EUR | 100 | default | 199 |
| United States | USD | 100 | default | 184 |
| Egypt | EGP | 1 | default | 108 |
| Italy | EUR | 100 | default | 102 |
| Spain | EUR | 100 | default | 62 |
| Malaysia | MYR | 10 | default | 53 |
| Colombia | COP | 1 | default | 34 |
| Czech Republic | CZK | 1 | default | 29 |
| Argentina | ARS | 1 | default | 28 |
| Japan | JPY | 1 | default | 26 |
| Australia | AUD | 100 | default | 25 |
| Germany | EUR | 100 | default | 24 |
| Romania | RON | 10 | default | 23 |
| South Korea | KRW | 1 | default | 19 |
| Turkey | TRY | 10 | default | 19 |
| Indonesia | IDR | 1 | default | 19 |
| Mexico | MXN | 1 | default | 16 |
| Hungary (pegged to HUF) | EUR | 361.3 (≈ varies with FX) | FX | 15 |
| Colombia (pegged to COP) | USD | 3759.5 (≈ varies with FX) | FX | 14 |
| Brazil (pegged to BRL) | USD | 51.6 (≈ varies with FX) | FX | 13 |
| United Kingdom | GBP | 100 | default | 12 |
| Singapore | SGD | 100 | default | 10 |
| Austria | EUR | 100 | default | 10 |
| Portugal | EUR | 100 | default | 8 |
| Belgium | EUR | 100 | default | 8 |
| Slovakia | EUR | 100 | default | 7 |
| Mexico (pegged to MXN) | USD | 17.4 (≈ varies with FX) | FX | 5 |
| Canada | CAD | 100 | default | 4 |
| Greece | EUR | 100 | default | 3 |
| HongKong | HKD | 10 | default | 3 |
| Philippines | PHP | 1 | default | 2 |
| Netherlands | EUR | 100 | default | 1 |
| Vietnam (pegged to VND) | USD | 26315.8 (≈ varies with FX) | FX | 1 |
| Ukraine (pegged to UAH) | USD | 44.4 (≈ varies with FX) | FX | 1 |
| Malaysia (pegged to MYR) | USD | 41 (≈ varies with FX) | FX | 1 |
| Panama (pegged to PAB) | USD | 100 (≈ varies with FX) | FX | 1 |
| Ecuador | USD | 100 | default | 1 |
| Saudi Arabia | SAR | 10 | default | 1 |
| Singapore (pegged to SGD) | USD | 128.4 (≈ varies with FX) | FX | 1 |

### Randstad GCC
*Policy: 1 pt = 1 unit local currency · 4,947 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 4,947 |

### Tata Teleservices Ltd
*Policy: 1 pt = 1 unit local currency · 4,284 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 4,284 |

### HappiestMinds
*Policy: Custom per-country rates · 4,071 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 4,013 |
| United States | USD | 100 | default | 56 |
| United Kingdom | GBP | 100 | default | 1 |
| Australia | AUD | 100 | default | 1 |

### WPP Media GOC 
*Policy: 1 pt = 1 unit local currency · 3,762 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 3,762 |

### R Systems International Limited
*Policy: 1 pt = 1 unit local currency · 3,390 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2,946 |
| Romania | RON | 1 | observed | 159 |
| Indonesia | IDR | 1 | default | 83 |
| Poland | PLN | 1 | observed | 58 |
| Singapore | SGD | 1 | observed | 49 |
| Malaysia | MYR | 1 | observed | 36 |
| Republic of Moldova (pegged to MDL) | USD | 16.8 (≈ varies with FX) | FX | 20 |
| United States | USD | 1 | observed | 18 |
| Thailand | THB | 1 | default | 8 |
| Canada | CAD | 1 | observed | 5 |
| Singapore (pegged to SGD) | USD | 1.3 (≈ varies with FX) | FX | 4 |
| Mexico | MXN | 1 | default | 2 |
| Malaysia (pegged to MYR) | USD | 4 (≈ varies with FX) | FX | 2 |

### Lendingkart
*Policy: 1 pt = 1 unit local currency · 3,219 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 3,219 |

### Bharat Petroleum Corporation Limited
*Policy: 1 pt = 1 unit local currency · 2,887 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2,887 |

### Compex Legal Services
*Policy: 100 pts = 1 unit · 2,837 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 2,837 |

### Tata Consultancy Services
*Policy: 1 pt = 1 unit local currency · 2,795 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2,795 |

### Apollo Tyres Limited
*Policy: Custom per-country rates · 2,663 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2,534 |
| Hungary | HUF | 1 | default | 77 |
| Netherlands | EUR | 100 | default | 17 |
| Germany | EUR | 100 | default | 16 |
| France | EUR | 100 | default | 6 |
| Singapore | SGD | 100 | default | 5 |
| United States | USD | 100 | default | 3 |
| United Kingdom | GBP | 100 | default | 3 |
| Italy | EUR | 100 | default | 2 |

### Trantor
*Policy: 1 pt = 1 unit local currency · 2,632 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2,632 |

### Vitesco Technologies India Private Limited
*Policy: 1 pt = 1 unit local currency · 2,592 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2,592 |

### Merit Data and Technology Private Limited 
*Policy: 1 pt = 1 unit local currency · 2,491 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2,491 |

### Hyundai Capital Canada
*Policy: 100 pts = 1 unit · 2,363 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| Canada | CAD | 100 | default | 2,363 |

### Bosch RBIN
*Policy: 1 pt = 1 unit local currency · 2,278 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2,278 |

### Aptean
*Policy: 1 pt = 1 unit local currency · 2,235 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,830 |
| China | CNY | 1 | observed | 161 |
| Germany | EUR | 1 | observed | 111 |
| United States | USD | 1 | observed | 66 |
| Canada | CAD | 1 | observed | 18 |
| United Kingdom | GBP | 1 | observed | 14 |
| Italy | EUR | 1 | observed | 13 |
| Belgium | EUR | 1 | observed | 10 |
| Netherlands | EUR | 1 | observed | 5 |
| Serbia | RSD | 1 | default | 5 |
| Poland | PLN | 1 | observed | 2 |

### TATA CAPITAL
*Policy: 1 pt = 1 unit local currency · 2,095 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2,095 |

### Tejas Networks Limited
*Policy: 1 pt = 1 unit local currency · 2,000 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2,000 |

### Technip Energies India Limited
*Policy: 1 pt = 1 unit local currency · 1,990 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,990 |

### Inovalon
*Policy: 1 pt = 1 unit local currency · 1,982 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 1 | observed | 1,571 |
| India | INR | 1 | default | 411 |

### Hexnode
*Policy: 1 pt = 1 unit local currency · 1,947 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,899 |
| United States | USD | 1 | observed | 20 |
| United Kingdom | GBP | 1 | observed | 13 |
| Germany | EUR | 1 | observed | 8 |
| United Arab Emirates | AED | 1 | observed | 5 |
| Philippines (pegged to PHP) | USD | 59.08 (≈ varies with FX) | FX | 1 |
| Singapore (pegged to SGD) | USD | 1.29 (≈ varies with FX) | FX | 1 |

### ICICI Lombard
*Policy: 1 pt = 1 unit local currency · 1,826 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,826 |

### Construction Specialities
*Policy: Custom per-country rates · 1,817 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| Mexico | MXN | 1 | default | 914 |
| United States | USD | 1 | observed | 457 |
| Mexico (pegged to MXN) | USD | 18.4 (≈ varies with FX) | FX | 229 |
| France | EUR | 100 | default | 67 |
| India | INR | 1 | default | 46 |
| Canada | CAD | 100 | default | 35 |
| United Kingdom | GBP | 100 | default | 23 |
| United Arab Emirates | AED | 10 | default | 14 |
| Italy | EUR | 100 | default | 12 |
| Germany | EUR | 100 | default | 6 |
| Australia | AUD | 100 | default | 5 |
| Saudi Arabia | SAR | 10 | default | 4 |
| Poland | PLN | 10 | default | 3 |
| Spain | EUR | 100 | default | 2 |

### Lummus Technology
*Policy: Custom per-country rates · 1,811 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 714 |
| India | INR | 1 | default | 694 |
| China | CNY | 10 | default | 166 |
| Germany | EUR | 100 | default | 112 |
| Netherlands | EUR | 100 | default | 55 |
| Czech Republic | CZK | 1 | default | 23 |
| Saudi Arabia | SAR | 10 | default | 15 |
| South Korea | KRW | 1 | default | 14 |
| Thailand | THB | 1 | default | 8 |
| United Kingdom | GBP | 100 | default | 7 |
| Egypt | EGP | 1 | default | 2 |
| United Arab Emirates | AED | 10 | default | 1 |

### Aspire Systems
*Policy: 1 pt = 1 unit local currency · 1,685 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,668 |
| Mexico | MXN | 1 | default | 12 |
| Mexico (pegged to MXN) | USD | 17.34 (≈ varies with FX) | FX | 5 |

### Perceptive
*Policy: 1 pt = 1 unit local currency · 1,662 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 679 |
| United States | USD | 1 | observed | 466 |
| United Kingdom | GBP | 1 | observed | 368 |
| China | CNY | 1 | observed | 119 |
| Germany | EUR | 1 | observed | 30 |

### UNext Learning Private Limited
*Policy: 1 pt = 1 unit local currency · 1,514 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,514 |

### GE Vernova
*Policy: 1 pt = 1 unit local currency · 1,465 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,465 |

### Black Box
*Policy: Custom per-country rates · 1,356 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,004 |
| United States | USD | 100 | default | 261 |
| Brazil | BRL | 10 | default | 24 |
| United Kingdom | GBP | 100 | default | 13 |
| Sweden | SEK | 10 | default | 11 |
| Ireland | EUR | 100 | default | 10 |
| United Arab Emirates | AED | 10 | default | 10 |
| New Zealand | NZD | 100 | default | 9 |
| Netherlands | EUR | 100 | default | 4 |
| Philippines | PHP | 1 | default | 4 |
| Belgium | EUR | 100 | default | 2 |
| New Zealand (pegged to NZD) | AUD | 110.76 (≈ varies with FX) | FX | 2 |
| Norway | NOK | 10 | default | 1 |
| Finland | EUR | 100 | default | 1 |

### Tata Realty
*Policy: 1 pt = 1 unit local currency · 1,302 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,302 |

### HTC Global Services Private Limited
*Policy: 1 pt = 1 unit local currency · 1,292 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,126 |
| United States | USD | 1 | observed | 162 |
| Australia | AUD | 1 | observed | 4 |

### Tata Play
*Policy: 1 pt = 1 unit local currency · 1,263 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,263 |

### CriticalRiver
*Policy: Custom per-country rates · 1,258 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,127 |
| Philippines | PHP | 1 | default | 44 |
| United States | USD | 100 | default | 37 |
| Costa Rica (pegged to CRC) | USD | 507.1 (≈ varies with FX) | FX | 37 |
| Costa Rica | CRC | 1 | default | 5 |
| United Arab Emirates | AED | 10 | default | 4 |
| Brazil | BRL | 10 | default | 3 |
| Brazil (pegged to BRL) | USD | 57.55 (≈ varies with FX) | FX | 1 |

### Ms Genzeon Technology Solutions Pvt Ltd
*Policy: Custom per-country rates · 1,242 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,195 |
| Philippines | PHP | 1 | default | 27 |
| United States | USD | 100 | default | 20 |

### Gentari
*Policy: 1 pt = 1 unit local currency · 1,184 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,184 |

### Sun Pharma
*Policy: 1 pt = 1 unit local currency · 1,138 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 1 | observed | 993 |
| Canada | CAD | 1 | observed | 145 |

### Yash Technologies Private Limited
*Policy: 1 pt = 1 unit local currency · 1,092 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,092 |

### Addverb
*Policy: 1 pt = 1 unit local currency · 1,063 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,053 |
| United States | USD | 1 | observed | 10 |

### Ingram Micro
*Policy: 1 pt = 1 unit local currency · 1,037 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1,037 |

### Celebal Technologies
*Policy: 1 pt = 1 unit local currency · 1,023 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 935 |
| United States | USD | 1 | observed | 23 |
| Japan | JPY | 1 | default | 20 |
| United Arab Emirates | AED | 1 | observed | 19 |
| Canada | CAD | 1 | observed | 18 |
| Australia | AUD | 1 | observed | 4 |
| United Kingdom | GBP | 1 | observed | 3 |
| Germany | EUR | 1 | observed | 1 |

### Dijital People Private Limited
*Policy: 1 pt = 1 unit local currency · 997 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| Sri Lanka | LKR | 1 | default | 997 |

### T EN Global Business Services Private Limited
*Policy: 1 pt = 1 unit local currency · 974 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 974 |

### Medikabazaar
*Policy: 1 pt = 1 unit local currency · 909 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 909 |

### Sidel
*Policy: 1 pt = 1 unit local currency · 896 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 205 |
| Italy | EUR | 1 | observed | 161 |
| France | EUR | 1 | observed | 159 |
| China | CNY | 1 | observed | 73 |
| Kenya | KES | 1 | default | 63 |
| United States | USD | 1 | observed | 54 |
| Mexico | MXN | 1 | default | 42 |
| Thailand | THB | 1 | default | 40 |
| Brazil | BRL | 1 | observed | 21 |
| United Arab Emirates | AED | 1 | observed | 18 |
| Canada | CAD | 1 | observed | 17 |
| Poland | PLN | 1 | observed | 14 |
| Mexico (pegged to MXN) | USD | 20.24 (≈ varies with FX) | FX | 9 |
| Portugal | EUR | 1 | observed | 5 |
| Philippines | PHP | 1 | default | 5 |
| Brazil (pegged to BRL) | USD | 5.34 (≈ varies with FX) | FX | 4 |
| United Kingdom | GBP | 1 | observed | 4 |
| Thailand (pegged to THB) | USD | 32.4 (≈ varies with FX) | FX | 2 |

### Adbuffs Media Private Limited
*Policy: 1 pt = 1 unit local currency · 833 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 833 |

### ITC Limited Tobacco Division
*Policy: 1 pt = 1 unit local currency · 823 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 823 |

### Mohr Management
*Policy: 1 pt = 1 unit local currency · 779 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 779 |

### DNV Group
*Policy: 1 pt = 1 unit local currency · 773 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| Singapore | SGD | 1 | observed | 409 |
| Australia | AUD | 1 | observed | 357 |
| New Zealand | NZD | 1 | observed | 4 |
| Singapore (pegged to SGD) | USD | 1.28 (≈ varies with FX) | FX | 2 |
| Indonesia | IDR | 1 | default | 1 |

### TATA Power
*Policy: 1 pt = 1 unit local currency · 757 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 757 |

### DB Schenker
*Policy: 1 pt = 1 unit local currency · 751 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 751 |

### DNV
*Policy: 1 pt = 1 unit local currency · 739 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 739 |

### Cognizant
*Policy: 1 pt = 1 unit local currency · 733 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 733 |

### ACG
*Policy: 1 pt = 1 unit local currency · 724 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 724 |

### SPAN TECHNOLOGY SERVICES PRIVATE LIMITED
*Policy: 1 pt = 1 unit local currency · 707 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 707 |

### SRF
*Policy: 1 pt = 1 unit local currency · 667 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 667 |

### Tata Chemicals
*Policy: 1 pt = 1 unit local currency · 638 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 638 |

### ABB Global Industries and Services Private Limited
*Policy: 1 pt = 1 unit local currency · 636 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 636 |

### Adecco
*Policy: 1 pt = 1 unit local currency · 605 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 605 |

### Sun Pharma Advanced Research Company Ltd
*Policy: 1 pt = 1 unit local currency · 582 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 582 |

### Kapitus Strategy Services
*Policy: 1 pt = 1 unit local currency · 568 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 568 |

### Phdata Solutions Private Limited
*Policy: 1 pt = 1 unit local currency · 530 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 530 |

### Pantaloons
*Policy: 1 pt = 1 unit local currency · 511 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 511 |

### T Systems Information and Communication Technology
*Policy: 1 pt = 1 unit local currency · 499 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 499 |

### WPP Media
*Policy: 1 pt = 1 unit local currency · 483 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 483 |

### Ingenico
*Policy: 1 pt = 1 unit local currency · 477 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 228 |
| Indonesia | IDR | 1 | default | 110 |
| Vietnam | VND | 1 | default | 89 |
| Singapore | SGD | 1 | observed | 17 |
| Philippines | PHP | 1 | default | 12 |
| Thailand | THB | 1 | default | 7 |
| Malaysia | MYR | 1 | observed | 6 |
| Japan | JPY | 1 | default | 5 |
| Philippines (pegged to PHP) | USD | 59.12 (≈ varies with FX) | FX | 2 |
| Vietnam (pegged to VND) | USD | 26316 (≈ varies with FX) | FX | 1 |

### BOSCH RBAI
*Policy: 1 pt = 1 unit local currency · 470 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 470 |

### VantageCircle
*Policy: Custom per-country rates · 445 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 359 |
| United States | USD | 1 | observed | 75 |
| New Zealand (pegged to NZD) | USD | 1.7 (≈ varies with FX) | FX | 7 |
| Australia | AUD | 100 | default | 3 |
| United Arab Emirates | AED | 10 | default | 1 |

### Restore Datashred
*Policy: 1 pt = 1 unit local currency · 426 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United Kingdom | GBP | 1 | observed | 426 |

### ULTRATECH
*Policy: 1 pt = 1 unit local currency · 404 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 404 |

### Zuno General Insurance Limited
*Policy: 1 pt = 1 unit local currency · 404 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 404 |

### Firstsource
*Policy: Custom per-country rates · 369 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 263 |
| United States | USD | 100 | default | 55 |
| United Kingdom | GBP | 100 | default | 49 |
| Philippines (pegged to PHP) | USD | 58.46 (≈ varies with FX) | FX | 2 |

### Chronus LLC
*Policy: Custom per-country rates · 355 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 180 |
| United States | USD | 100 | default | 172 |
| United Kingdom | GBP | 100 | default | 3 |

### Exeevo
*Policy: Custom per-country rates · 351 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 322 |
| Canada | CAD | 100 | default | 15 |
| China | CNY | 10 | default | 9 |
| United Kingdom | GBP | 100 | default | 4 |
| United States | USD | 100 | default | 1 |

### Idexcel
*Policy: 1 pt = 1 unit local currency · 290 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 290 |

### MS Agarwal Foundries Pvt Ltd
*Policy: 1 pt = 1 unit local currency · 277 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 277 |

### TATA ADVANCED SYSTEMS
*Policy: 1 pt = 1 unit local currency · 252 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 252 |

### Weaver and Tidwell India LLP
*Policy: 1 pt = 1 unit local currency · 246 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 246 |

### Autoliv India Pvt Ltd
*Policy: 1 pt = 1 unit local currency · 217 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 217 |

### Oregon State Lottery
*Policy: 100 pts = 1 unit · 199 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 199 |

### Dexian Technologies
*Policy: 1 pt = 1 unit local currency · 195 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 195 |

### Bosch RBIC
*Policy: 1 pt = 1 unit local currency · 179 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 179 |

### Systango
*Policy: 1 pt = 1 unit local currency · 168 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 168 |

### FIREFLY
*Policy: 100 pts = 1 unit · 156 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| Canada | CAD | 100 | default | 156 |

### Achala IT Solutions Private Limited
*Policy: 1 pt = 1 unit local currency · 153 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 153 |

### GE
*Policy: 1 pt = 1 unit local currency · 138 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 138 |

### TSC India
*Policy: 1 pt = 1 unit local currency · 137 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 137 |

### BATA
*Policy: 1 pt = 1 unit local currency · 135 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 135 |

### CSA Group
*Policy: 1 pt = 1 unit local currency · 128 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 1 | observed | 87 |
| Panama (pegged to PAB) | USD | 1 (≈ varies with FX) | FX | 41 |

### Wells Fargo
*Policy: 1 pt = 1 unit local currency · 124 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 124 |

### Bare International
*Policy: 1 pt = 1 unit local currency · 121 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 121 |

### Titan
*Policy: 1 pt = 1 unit local currency · 120 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 120 |

### Sartorius
*Policy: 1 pt = 1 unit local currency · 119 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 119 |

### Fidelity Investments
*Policy: 1 pt = 1 unit local currency · 113 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 113 |

### Restor3d
*Policy: 1 pt = 1 unit local currency · 113 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 107 |
| United States | USD | 1 | observed | 6 |

### Bata
*Policy: 1 pt = 1 unit local currency · 112 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 112 |

### Accenture
*Policy: 1 pt = 1 unit local currency · 108 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 108 |

### HCL
*Policy: 1 pt = 1 unit local currency · 108 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 108 |

### BDJ Law
*Policy: 100 pts = 1 unit · 107 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 107 |

### DEX Imaging
*Policy: 1 pt = 1 unit local currency · 105 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 1 | observed | 105 |

### Informatica
*Policy: 1 pt = 1 unit local currency · 103 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 103 |

### VantageCircle2
*Policy: 1 pt = 1 unit local currency · 103 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 103 |

### Teva Pharmaceutical Industries Ltd
*Policy: 1 pt = 1 unit local currency · 96 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 96 |

### EDMO
*Policy: 1 pt = 1 unit local currency · 92 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 92 |

### SK Primacor Europe
*Policy: 1 pt = 1 unit local currency · 92 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| Spain | EUR | 1 | observed | 92 |

### Anunta Tech
*Policy: 1 pt = 1 unit local currency · 89 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 89 |

### Niche Technology Inc
*Policy: 100 pts = 1 unit · 87 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| Canada | CAD | 100 | default | 72 |
| United Kingdom | GBP | 100 | default | 12 |
| United States | USD | 100 | default | 2 |
| Australia | AUD | 100 | default | 1 |

### Astra Canyon Group
*Policy: Custom per-country rates · 85 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 31 |
| Sri Lanka | LKR | 1 | default | 26 |
| Canada | CAD | 100 | default | 24 |
| India | INR | 1 | default | 4 |

### RewardsGateway
*Policy: 1 pt = 1 unit local currency · 82 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 82 |

### Vesuvius India Limited
*Policy: 1 pt = 1 unit local currency · 74 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 74 |

### Atlassian
*Policy: 1 pt = 1 unit local currency · 71 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 71 |

### Muthoot Group
*Policy: 1 pt = 1 unit local currency · 68 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 68 |

### Novel Jewels
*Policy: 1 pt = 1 unit local currency · 68 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 68 |

### Systra MVA Consulting India Pvt Ltd
*Policy: 1 pt = 1 unit local currency · 67 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 67 |

### Omron Automation Private Limited
*Policy: 1 pt = 1 unit local currency · 66 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 66 |

### JF Petroleum group
*Policy: 100 pts = 1 unit · 59 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 59 |

### Ceremorphic
*Policy: 1 pt = 1 unit local currency · 58 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 58 |

### Kane County Hospital
*Policy: 100 pts = 1 unit · 58 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 58 |

### Edwards Group
*Policy: 100 pts = 1 unit · 57 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 57 |

### White Rivers Media
*Policy: 1 pt = 1 unit local currency · 52 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 52 |

### Tech Mahindra
*Policy: 1 pt = 1 unit local currency · 51 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 51 |

### Zuventus Healthcare
*Policy: 1 pt = 1 unit local currency · 50 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 50 |

### Ferring Pharmaceuticals
*Policy: 1 pt = 1 unit local currency · 48 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 48 |

### Stax Payments
*Policy: 100 pts = 1 unit · 48 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 48 |

### Decera Clinical
*Policy: 10 pts = 1 unit · 46 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 10 | observed | 33 |
| Canada | CAD | 10 | observed | 11 |
| United Kingdom | GBP | 10 | observed | 2 |

### DHL Express Pte Ltd
*Policy: 1 pt = 1 unit local currency · 44 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 20 |
| Thailand | THB | 1 | default | 10 |
| Vietnam | VND | 1 | default | 7 |
| Singapore | SGD | 1 | observed | 5 |
| Indonesia | IDR | 1 | default | 1 |
| Sri Lanka | LKR | 1 | default | 1 |

### Godrej Consumer Products Ltd
*Policy: Custom per-country rates · 42 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| South Africa | ZAR | 10 | default | 17 |
| Nigeria | NGN | 1 | default | 15 |
| India | INR | 1 | default | 9 |
| Kenya | KES | 1 | default | 1 |

### Comcast
*Policy: 1 pt = 1 unit local currency · 40 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 40 |

### Harrow Green Limited
*Policy: 1 pt = 1 unit local currency · 39 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United Kingdom | GBP | 1 | observed | 39 |

### Mitsubishi Chemical America
*Policy: 1 pt = 1 unit local currency · 38 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 1 | observed | 38 |

### Springport Public Schools
*Policy: 100 pts = 1 unit · 38 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 38 |

### Akamai
*Policy: 1 pt = 1 unit local currency · 36 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 36 |

### AAJ Supply Chain Management Pvt Ltd
*Policy: 1 pt = 1 unit local currency · 35 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 35 |

### Sundaram Clayton Limited
*Policy: 1 pt = 1 unit local currency · 30 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 30 |

### DXC Technology
*Policy: 1 pt = 1 unit local currency · 29 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 29 |

### Moolya Software Testing Pvt Ltd
*Policy: 1 pt = 1 unit local currency · 29 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 29 |

### McAfee
*Policy: 1 pt = 1 unit local currency · 27 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 27 |

### Tiger Analytics India Consulting Private Limited
*Policy: 1 pt = 1 unit local currency · 26 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 26 |

### Novartis
*Policy: 1 pt = 1 unit local currency · 24 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 24 |

### Jiffy Lube
*Policy: 100 pts = 1 unit · 21 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 21 |

### IBM
*Policy: 1 pt = 1 unit local currency · 19 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 19 |

### AHCINC
*Policy: 100 pts = 1 unit · 18 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 18 |

### Cerner
*Policy: 1 pt = 1 unit local currency · 18 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 18 |

### VantageCircle EU
*Policy: 1 pt = 1 unit local currency · 18 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 13 |
| United States | USD | 1 | observed | 5 |

### Tesco
*Policy: 1 pt = 1 unit local currency · 16 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 16 |

### Agratas Energy Storage Solutions Private Limited
*Policy: 1 pt = 1 unit local currency · 14 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United Kingdom | GBP | 1 | observed | 10 |
| India | INR | 1 | default | 4 |

### Acuity Knowledge Partners
*Policy: 1 pt = 1 unit local currency · 13 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 13 |

### Zscaler Softech India Private Limited
*Policy: 1 pt = 1 unit local currency · 13 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 13 |

### Healthtrackrx
*Policy: 100 pts = 1 unit · 12 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 12 |

### Penske Automotive
*Policy: 100 pts = 1 unit · 12 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 12 |

### Alameda Municipal Power
*Policy: 100 pts = 1 unit · 11 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 11 |

### Hamilton Associates
*Policy: 100 pts = 1 unit · 11 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 11 |

### JC White
*Policy: 100 pts = 1 unit · 11 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 11 |

### VantageCircle US
*Policy: 100 pts = 1 unit · 11 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 11 |

### AM Green Energy Private Limited
*Policy: 1 pt = 1 unit local currency · 10 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 10 |

### Armacell
*Policy: 1 pt = 1 unit local currency · 10 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 10 |

### Red Tag
*Policy: 100 pts = 1 unit · 10 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 10 |

### Infanion
*Policy: 1 pt = 1 unit local currency · 9 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 9 |

### Mr Cooper
*Policy: 1 pt = 1 unit local currency · 8 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 8 |

### CEGIS
*Policy: 1 pt = 1 unit local currency · 7 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 7 |

### JP Morgan Chase
*Policy: 1 pt = 1 unit local currency · 7 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 7 |

### Cash Depot Ltd
*Policy: 100 pts = 1 unit · 6 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 6 |

### TATA COFFEE
*Policy: 1 pt = 1 unit local currency · 5 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 5 |

### Apollo Hospital Enterprises
*Policy: 1 pt = 1 unit local currency · 4 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 4 |

### Intuit
*Policy: 1 pt = 1 unit local currency · 4 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 4 |

### Wabtec
*Policy: 1 pt = 1 unit local currency · 4 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 4 |

### Bangalore International Airport Limited
*Policy: 1 pt = 1 unit local currency · 3 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 3 |

### Britive India Pvt Ltd
*Policy: 100 pts = 1 unit · 3 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 3 |

### Minda Industries
*Policy: 1 pt = 1 unit local currency · 3 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 3 |

### Mubudala
*Policy: 100 pts = 1 unit · 3 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 3 |

### Test Experience
*Policy: 1 pt = 1 unit local currency · 3 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 3 |

### Unisys
*Policy: 1 pt = 1 unit local currency · 3 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 3 |

### Cyble
*Policy: 1 pt = 1 unit local currency · 2 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2 |

### EXL
*Policy: 1 pt = 1 unit local currency · 2 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2 |

### Ericsson
*Policy: 1 pt = 1 unit local currency · 2 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2 |

### Globant
*Policy: 1 pt = 1 unit local currency · 2 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2 |

### Google
*Policy: 1 pt = 1 unit local currency · 2 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2 |

### KnS Partners
*Policy: 1 pt = 1 unit local currency · 2 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2 |

### Royal Bank of Scotland
*Policy: 1 pt = 1 unit local currency · 2 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2 |

### Toyota Connected India Private Limited
*Policy: 1 pt = 1 unit local currency · 2 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 2 |

### Bajaj Allianz Life Insurance
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### Becton Dickinson and Company
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### Demandbase India Private Limited
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### Emtec
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### Escalon
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### FC Architects
*Policy: 100 pts = 1 unit · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 1 |

### FIS Global Business Solutions India Private Ltd
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### Mahindra Comviva
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### Marlabs
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### Packaging Corporation of America
*Policy: 100 pts = 1 unit · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United States | USD | 100 | default | 1 |

### Posco Maharashtra Steel Pvt Ltd
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### Societe Generale
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### thedealspointcom
*Policy: 1 pt = 1 unit local currency · 1 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| India | INR | 1 | default | 1 |

### Petronash
*Policy: Custom per-country rates · 0 redemptions observed*

| Country | Currency | Rate (pts = 1 unit) | Source | Txns |
|---|---|---|---|---|
| United Arab Emirates | AED | 10 | rule | 0 |
| Saudi Arabia | SAR | 10 | rule | 0 |
| India | INR | 0.4545 | rule | 0 |

---

## 5. Caveats for the AI using this file

- A client-country pair absent from Section 4 has never had a redemption and has no known override → **assume the country default (Section 3)**, and say so.
- Treat rates with fewer than ~10 txns as low-confidence; prefer the client's stated policy line.
- `FX` rows: do NOT quote the listed ratio as fixed — it changes daily. Quote the home-currency peg and note the conversion floats with FX.
- Rates are points-side conversions only; they say nothing about margins, vendor costs, or FX fees.
- Data window ends 30 Jun 2026 (ledger) / Jul 2026 (configuration snapshot). Rates can be reconfigured by the client at any time.

*Generated from the Vantage Circle redemption ledger + application rate rules. Internal use.*