# Multi-Supplier Distribution API

## Overview
Lets a supplier (inventory owner) publish rate plans for other suppliers (distributors) to resell, manage
partnerships and commission rules, and produce monthly invoices.

**Status:** these endpoints compile and the server maps them, but they have not been exercised end to end and
have no automated tests. Published inventory can be booked by other tenants through the B2C booking API, and
paying such a booking creates the settlements; storefront search does not list it yet. The JSON bodies below illustrate the response shape; the values are examples.

Settlements (who pays whom, and when) are a separate, tested API: see
[SETTLEMENT_AND_SECURITY.md](SETTLEMENT_AND_SECURITY.md).

## Base URL
```
http://localhost:3001/api/v1/b2b/multi-supplier
```

## Authentication
Every endpoint requires a tenant API key:
```
Authorization: Bearer <API_KEY>
```
The tenant is taken from the API key. Partnership and invoice endpoints that take an ID only act on records
the calling tenant is a party to; anything else returns 404.

---

## 1. INVENTORY PUBLISHING ENDPOINTS

### 1.1 Publish Inventory as Public
**Endpoint:** `POST /inventory/publish`

Publish a rate plan as public for other suppliers to subscribe to.

**Request Body:**
```json
{
  "propertyId": "prop_123",
  "roomId": "room_456",
  "ratePlanId": "rp_789",
  "netRate": 100.00,
  "commissionShare": 15,
  "maxMarkup": 25,
  "allowedCountries": ["AE", "IN", "GB"],
  "minBookingWindow": 0,
  "maxBookingWindow": 365
}
```

**Response:** (201 Created)
```json
{
  "id": "vis_123",
  "supplierTenantId": "supplier_1",
  "propertyId": "prop_123",
  "roomId": "room_456",
  "ratePlanId": "rp_789",
  "netRate": 100.00,
  "commissionShare": 15,
  "maxMarkup": 25,
  "visibilityLevel": "public",
  "status": "active",
  "allowedCountries": ["AE", "IN", "GB"],
  "minBookingWindow": 0,
  "maxBookingWindow": 365,
  "createdAt": "2026-10-02T10:00:00Z"
}
```

---

### 1.2 Make Inventory Private
**Endpoint:** `PUT /inventory/:propertyId/:roomId/:ratePlanId/private`

Hide inventory from public visibility.

**Response:**
```json
{
  "message": "Inventory made private"
}
```

---

### 1.3 Pause Inventory
**Endpoint:** `PUT /inventory/:propertyId/:roomId/:ratePlanId/pause`

Temporarily pause public inventory (can be resumed later).

**Response:**
```json
{
  "message": "Inventory paused"
}
```

---

### 1.4 Get Published Inventory
**Endpoint:** `GET /inventory/published`

Retrieve all public inventory published by the current supplier.

**Response:**
```json
[
  {
    "id": "vis_123",
    "propertyId": "prop_123",
    "property": {
      "id": "prop_123",
      "name": "Dubai Grand Hotel",
      "city": "Dubai"
    },
    "room": {
      "type": "Deluxe Suite",
      "code": "DEL001"
    },
    "ratePlan": {
      "name": "Best Available Rate",
      "code": "BAR",
      "boardType": "RO"
    },
    "netRate": 100.00,
    "commissionShare": 15,
    "maxMarkup": 25,
    "visibilityLevel": "public",
    "status": "active"
  }
]
```

---

### 1.5 Update Commission for Inventory
**Endpoint:** `PUT /inventory/:propertyId/:roomId/:ratePlanId/commission`

Change the commission percentage for published inventory.

**Request Body:**
```json
{
  "newCommissionPct": 18
}
```

**Response:**
```json
{
  "message": "Commission updated"
}
```

---

## 2. INVENTORY FILTERING & DISCOVERY ENDPOINTS

### 2.1 Filter Public Inventory
**Endpoint:** `POST /inventory/search`

Search for public inventory matching specific criteria.

**Request Body:**
```json
{
  "guestCountry": "IN",
  "minCommissionPct": 10,
  "maxCommissionPct": 25,
  "minStarRating": 4,
  "instantBookingOnly": true,
  "freeCancellationOnly": false,
  "minDaysNotice": 0,
  "maxDaysAdvance": 90,
  "minProfitMargin": 10,
  "partnerTier": "gold",
  "limit": 50
}
```

**Response:**
```json
{
  "total": 25,
  "inventories": [
    {
      "id": "vis_123",
      "property": {
        "id": "prop_123",
        "name": "Taj Hotel",
        "starCategory": 5,
        "city": "Mumbai",
        "country": "IN"
      },
      "room": {
        "type": "Luxury Suite",
        "maxOccupancy": 2
      },
      "ratePlan": {
        "name": "Best Available Rate",
        "boardType": "BB"
      },
      "netRate": 120.00,
      "commissionShare": 15,
      "maxMarkup": 25,
      "status": "active"
    }
  ]
}
```

---

### 2.2 Text Search Inventory
**Endpoint:** `GET /inventory/search?q=hotel_name&limit=100`

Search public inventory by property, room, or rate plan name.

**Query Parameters:**
- `q` (string): Search term
- `limit` (number): Max results (default: 100)

**Response:**
```json
[
  {
    "id": "vis_123",
    "property": { ... },
    "room": { ... },
    "ratePlan": { ... },
    "netRate": 100.00,
    "commissionShare": 15
  }
]
```

---

### 2.3 Get Trending Inventory
**Endpoint:** `GET /inventory/trending?limit=50`

Get popular inventory based on booking volume.

**Query Parameters:**
- `limit` (number): Max results (default: 50)

**Response:** Same as filter response

---

### 2.4 Get Inventory Summary
**Endpoint:** `GET /inventory/summary`

Get aggregated inventory statistics for dashboard.

**Response:**
```json
[
  {
    "visibilityLevel": "public",
    "status": "active",
    "_count": {
      "id": 45
    }
  },
  {
    "visibilityLevel": "private",
    "status": "inactive",
    "_count": {
      "id": 12
    }
  }
]
```

---

### 2.5 Calculate Effective Price
**Endpoint:** `POST /inventory/calculate-price`

Calculate guest price, markups, and profit margins.

**Request Body:**
```json
{
  "netRate": 100.00,
  "markupPct": 20,
  "commissionPct": 15
}
```

**Response:**
```json
{
  "netRate": 100.00,
  "markupAmount": 20.00,
  "guestPrice": 120.00,
  "commissionToHotel": 15.00,
  "distributorProfit": 5.00,
  "profitMarginPct": 5.0
}
```

---

## 3. PARTNERSHIP MANAGEMENT ENDPOINTS

### 3.1 Create Partnership
**Endpoint:** `POST /partnerships`

Create a partnership agreement with another supplier.

**Request Body:**
```json
{
  "targetSupplierTenantId": "supplier_2",
  "partnershipType": "public",
  "defaultCommissionPct": 15,
  "minMarkupPct": 5,
  "maxMarkupPct": 30,
  "allowedCountries": ["AE", "IN", "GB"]
}
```

**Response:** (201 Created)
```json
{
  "id": "part_123",
  "sourceSupplierStr": "supplier_1",
  "targetSupplierStr": "supplier_2",
  "partnershipType": "public",
  "status": "active",
  "defaultCommissionPct": 15,
  "minMarkupPct": 5,
  "maxMarkupPct": 30,
  "allowedCountries": ["AE", "IN", "GB"],
  "createdAt": "2026-10-02T10:00:00Z"
}
```

---

### 3.2 Get Partnerships
**Endpoint:** `GET /partnerships?direction=all`

Retrieve partnership agreements.

**Query Parameters:**
- `direction`: "outgoing" (publishing to), "incoming" (subscribing from), "all" (default)

**Response:**
```json
[
  {
    "id": "part_123",
    "sourceSupplierStr": "supplier_1",
    "targetSupplierStr": "supplier_2",
    "partnershipType": "public",
    "status": "active",
    "defaultCommissionPct": 15,
    "commissionRules": [
      {
        "id": "rule_123",
        "baseCommissionPct": 18,
        "country": "IN",
        "channel": "b2c"
      }
    ]
  }
]
```

---

### 3.3 Update Partnership Status
**Endpoint:** `PUT /partnerships/:partnershipId`

Change partnership status (active, paused, terminated).

**Request Body:**
```json
{
  "status": "paused"
}
```

**Response:**
```json
{
  "id": "part_123",
  "status": "paused",
  "updatedAt": "2026-10-02T11:30:00Z"
}
```

---

### 3.4 Get Partnership Metrics
**Endpoint:** `GET /partnerships/:partnershipId/metrics?startDate=2026-10-01&endDate=2026-10-31`

Get performance metrics for a partnership.

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:**
```json
{
  "totalBookings": 150,
  "totalGuestPaid": 15000.00,
  "totalCommissionPaid": 2250.00,
  "averageCommissionPct": 15.0,
  "totalDistributorMarkup": 3000.00,
  "averageMarkupPct": 20.0
}
```

---

### 3.5 Add Commission Rule
**Endpoint:** `POST /partnerships/:partnershipId/commission-rules`

Add a conditional commission rule. Only the inventory owner (source supplier) of the partnership may do this.
When several rules match a booking, the highest `priority` wins, then the newest; with no match the
partnership default applies.

**Request Body:**
```json
{
  "commissionPct": 18,
  "country": "IN",
  "channel": "b2c",
  "partnerTier": "gold",
  "season": "high",
  "lengthOfStayMin": 7,
  "lengthOfStayMax": 30
}
```

**Response:** (201 Created)
```json
{
  "id": "rule_123",
  "partnershipId": "part_123",
  "supplierId": "supplier_1",
  "baseCommissionPct": 18,
  "country": "IN",
  "channel": "b2c",
  "partnerTier": "gold",
  "season": "high",
  "minLengthOfStay": 7,
  "maxLengthOfStay": 30,
  "priority": 0,
  "active": true,
  "createdAt": "2026-10-02T10:00:00Z"
}
```

---

### 3.6 Validate Partnership for Booking
**Endpoint:** `POST /partnerships/:partnershipId/validate`

Check if partnership can handle a specific booking.

**Request Body:**
```json
{
  "netRate": 100.00,
  "markupPct": 20,
  "country": "IN",
  "channel": "b2c"
}
```

**Response:**
```json
{
  "isValid": true
}
```

or

```json
{
  "isValid": false,
  "reason": "Markup must be between 5% and 30%"
}
```

---

## 4. COMMISSION & REVENUE ENDPOINTS

### 4.1 Get Commission Summary
**Endpoint:** `GET /commissions/summary?startDate=2026-10-01&endDate=2026-10-31`

Get commission statistics for a supplier (as hotel owner).

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:**
```json
{
  "totalBookings": 120,
  "totalCommission": 1800.00,
  "totalNetRevenue": 12000.00,
  "averageCommission": 15.0,
  "pendingSettlement": 900.00,
  "settled": 900.00
}
```

---

### 4.2 Get Distributor Commission Summary
**Endpoint:** `GET /commissions/distributor-summary?startDate=2026-10-01&endDate=2026-10-31`

Get commission statistics for a distributor.

**Response:**
```json
{
  "totalBookings": 85,
  "totalMarkup": 1700.00,
  "totalCommissionPaid": 1275.00,
  "totalProfit": 425.00,
  "platformFeesPaid": 255.00,
  "netProfit": 170.00
}
```

---

### 4.3 Calculate Revenue Split
**Endpoint:** `POST /commissions/calculate`

Calculator only: returns a breakdown for the numbers supplied and stores nothing. Actual settlement amounts
are computed by the settlement API from the booking record.

**Request Body:**
```json
{
  "guestPaid": 875.00,
  "netRate": 100.00,
  "nights": 7,
  "commissionPct": 15,
  "markupPct": 20,
  "platformFeePct": 2,
  "gatewayFeePct": 3,
  "taxPct": 10
}
```

**Response:**
```json
{
  "guestPaid": 875.00,
  "netToHotel": 700.00,
  "markupAmount": 140.00,
  "commissionToHotel": 105.00,
  "distributorProfit": 35.00,
  "platformFee": 17.50,
  "paymentGatewayFee": 26.25,
  "taxAmount": 70.00,
  "distribution": {
    "hotelReceives": 686.00,
    "distributorReceives": 35.00,
    "platformReceives": 43.75,
    "taxesHeld": 70.00
  }
}
```

---

## 5. BILLING (INVOICE) ENDPOINTS

Invoices summarise a supplier's settled revenue transactions for a month. They do not move money.

### 5.1 Generate Monthly Invoice
**Endpoint:** `POST /billing/invoice/2026-10`

Generate the calling supplier's invoice for a month (`YYYY-MM`). Returns `null` if there are no settled
transactions in that month, and 409 if the invoice already exists.

**Response:** (201 Created)
```json
{
  "id": "inv_123",
  "supplierId": "supplier_1",
  "invoicePeriod": "2026-10",
  "invoiceNumber": "INV-supplier_1-2026-10",
  "invoiceDate": "2026-10-02T10:00:00Z",
  "dueDate": "2026-10-17T00:00:00Z",
  "totalBookings": 120,
  "grossAmount": 12000.00,
  "platformFee": 240.00,
  "paymentGatewayFee": 360.00,
  "netAmount": 11400.00,
  "status": "draft",
  "lineItems": [ ... ]
}
```

---

### 5.2 Get Supplier Invoices
**Endpoint:** `GET /billing/invoices?limit=20`

Retrieve all invoices for supplier.

**Query Parameters:**
- `limit`: Max results (default: 20)

**Response:**
```json
[
  {
    "id": "inv_123",
    "invoiceNumber": "INV-supplier_1-2026-10",
    "invoicePeriod": "2026-10",
    "totalBookings": 120,
    "grossAmount": 12000.00,
    "netAmount": 11400.00,
    "status": "draft",
    "invoiceDate": "2026-10-02T10:00:00Z"
  }
]
```

---

### 5.3 Send Invoice
**Endpoint:** `PUT /billing/invoice/:invoiceId/send`

Move one of your own invoices from `draft` to `sent`. No email or notification is sent yet.

**Response:**
```json
{
  "id": "inv_123",
  "status": "sent",
  "sentDate": "2026-10-02T11:00:00Z"
}
```

---

### 5.4 Mark Invoice as Paid
**Endpoint:** `PUT /billing/invoice/:invoiceId/mark-paid`

Move one of your own invoices from `sent` or `overdue` to `paid`. This is self-reported: nothing verifies
the payment.

**Request Body:**
```json
{
  "paymentReference": "PAY-2026-10-001"
}
```

**Response:**
```json
{
  "id": "inv_123",
  "status": "paid",
  "paidDate": "2026-10-05T09:30:00Z",
  "paymentReference": "PAY-2026-10-001"
}
```

---

### 5.5 Get Billing Summary
**Endpoint:** `GET /billing/summary`

Get aggregated billing statistics.

**Response:**
```json
{
  "totalInvoices": 12,
  "draftInvoices": 1,
  "sentInvoices": 0,
  "paidInvoices": 11,
  "totalBilled": 132000.00,
  "totalFees": 3960.00
}
```

---

### 5.6 Calculate Fee Breakdown
**Endpoint:** `POST /billing/fee-breakdown`

Calculate platform and gateway fee breakdown.

**Request Body:**
```json
{
  "grossAmount": 12000.00,
  "platformFeePct": 2,
  "gatewayFeePct": 3
}
```

**Response:**
```json
{
  "grossAmount": 12000.00,
  "platformFee": 240.00,
  "gatewayFee": 360.00,
  "netAmount": 11400.00,
  "effectiveFeePct": 5.0
}
```

---

### 5.7 Get Upcoming Due Dates
**Endpoint:** `GET /billing/due-dates?limit=10`

Get your own sent invoices falling due in the next 30 days.

**Query Parameters:**
- `limit`: Max results (default: 10)

**Response:**
```json
[
  {
    "id": "inv_123",
    "invoiceNumber": "INV-supplier_1-2026-10",
    "dueDate": "2026-10-17T00:00:00Z",
    "netAmount": 11400.00,
    "status": "sent"
  }
]
```

---

## Error Responses

Errors use this shape (`message` may be a string or a list of validation messages):

```json
{
  "statusCode": 404,
  "timestamp": "2026-10-02T16:32:00.182Z",
  "path": "/api/v1/b2b/multi-supplier/partnerships/abc",
  "method": "PUT",
  "message": "Partnership not found",
  "errors": "Not Found"
}
```

- **400** invalid input
- **401** missing or invalid API key
- **404** record not found, or not yours
- **409** already exists (duplicate partnership or invoice)

---

## Workflow Examples

### Example 1: Publishing Inventory and Getting Sold

1. **Hotel A publishes inventory:**
   ```bash
   POST /inventory/publish
   { propertyId, roomId, ratePlanId, netRate: 100, commissionShare: 15, ... }
   ```

2. **Distributor B searches for inventory:**
   ```bash
   POST /inventory/search
   { guestCountry: "IN", minCommissionPct: 10, ... }
   ```

3. **Distributor B creates partnership with Hotel A:**
   ```bash
   POST /partnerships
   { targetSupplierTenantId: "hotel_a", defaultCommissionPct: 15, ... }
   ```

4. **A booking is sold by Distributor B** (5 nights, owner net $150/night, guest pays $875, 5% commission):
   - Platform keeps fees: $17.50 (2%) + $26.25 (3%)
   - Distributor B receives $831.25 from the platform
   - Distributor B owes Hotel A $787.50 ($750 net + $37.50 commission), due in 15 days
   - Distributor B keeps $43.75

   A platform admin records this with `POST /api/v1/settlements`; see
   [SETTLEMENT_AND_SECURITY.md](SETTLEMENT_AND_SECURITY.md).

5. **Monthly invoice** (after the inter-supplier settlement is marked paid):
   ```bash
   POST /billing/invoice/2026-10
   PUT /billing/invoice/:invoiceId/send
   PUT /billing/invoice/:invoiceId/mark-paid
   ```

---

## Rate Limiting
Not enforced. A throttler is configured in the app module but its guard is not applied, and the per-key
`rateLimit` value on API keys is not checked on these routes.

---

## Version History
- **2026-10-02**: Initial endpoints; settlement routes moved to the settlement API, ownership checks added.
