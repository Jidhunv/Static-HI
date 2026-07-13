# Hotel Inventory Platform - API Documentation

## Overview

Multi-tenant B2B2C hotel distribution platform with:
- **B2B Marketplace:** Source tenants expose inventory; resellers discover, negotiate, and resell with their own markups
- **B2C Storefront:** Public white-labeled booking sites per tenant, with access to own inventory + resold B2B inventory
- **Rate Management:** Automatic markup layering with audit trail for compliance

**Base URL:** `http://localhost:3001/api/v1`

---

## Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "tenantId": "luxury-hotels-co",
  "email": "admin@luxuryhotels.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "admin@luxuryhotels.com",
    "firstName": "Alice",
    "lastName": "Admin",
    "tenantId": "luxury-hotels-co",
    "tenantName": "Luxury Hotels Co.",
    "role": "admin"
  }
}
```

**Token Structure (JWT Claims):**
```json
{
  "sub": "user_123",
  "email": "admin@luxuryhotels.com",
  "tenant_id": "luxury-hotels-co",
  "role": "admin",
  "permissions": ["all"]
}
```

---

## Core Tenant Management

### Get Tenant Info
```http
GET /tenant/info
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "luxury-hotels-co",
  "name": "Luxury Hotels Co.",
  "slug": "luxury-hotels-co",
  "businessType": "hotel_chain",
  "primaryCurrency": "USD",
  "primaryColor": "#7c3aed",
  "status": "active"
}
```

### Get Tenant Settings
```http
GET /tenant/settings
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "tenantId": "luxury-hotels-co",
  "allowedAmenities": ["WIFI", "AC", "POOL", "GYM"],
  "allowedCountries": ["US", "IN", "GB"],
  "bookingWindow": 365
}
```

---

## Masters (Platform Reference Data)

### Get All Countries
```http
GET /masters/countries
```

**Response (200):**
```json
[
  {
    "id": "country_us",
    "code": "US",
    "name": "United States",
    "states": [
      { "id": "state_ny", "name": "New York", "code": "NY" },
      { "id": "state_ca", "name": "California", "code": "CA" }
    ]
  },
  {
    "id": "country_in",
    "code": "IN",
    "name": "India",
    "states": [...]
  }
]
```

### Get Amenities
```http
GET /masters/amenities?category=wifi
```

**Response (200):**
```json
[
  {
    "id": "amenity_wifi",
    "code": "WIFI",
    "name": "Free Wi-Fi",
    "category": "connectivity"
  },
  {
    "id": "amenity_pool",
    "code": "POOL",
    "name": "Swimming Pool",
    "category": "entertainment"
  }
]
```

---

## Property Management (Private)

### Create Property
```http
POST /properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "The Plaza Hotel",
  "type": "Hotel",
  "countryId": "country_us",
  "stateId": "state_ny",
  "city": "New York",
  "address": "768 5th Avenue",
  "postalCode": "10019",
  "latitude": 40.763889,
  "longitude": -73.976389,
  "starCategory": 5,
  "chainName": "Marriott",
  "checkInTime": "15:00",
  "checkOutTime": "11:00",
  "allowEarlyCheckIn": true,
  "allowLateCheckOut": true,
  "allowChildren": "yes",
  "visibility": "private",
  "distributionMode": "open",
  "description": "Iconic luxury hotel at Central Park"
}
```

**Response (201):**
```json
{
  "id": "prop_plaza_001",
  "tenantId": "luxury-hotels-co",
  "name": "The Plaza Hotel",
  "code": "MAR-NYC-001",
  "visibility": "private",
  "status": "active",
  "createdAt": "2025-07-13T12:30:00Z"
}
```

### List Properties
```http
GET /properties?status=active&visibility=private
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "prop_plaza_001",
    "name": "The Plaza Hotel",
    "code": "MAR-NYC-001",
    "city": "New York",
    "visibility": "private",
    "status": "active",
    "rooms": [
      { "id": "room_001", "type": "Deluxe", "quantity": 50 }
    ]
  }
]
```

### Get Property Details
```http
GET /properties/:propertyId
Authorization: Bearer <token>
```

### Update Property
```http
PUT /properties/:propertyId
Authorization: Bearer <token>
Content-Type: application/json

{
  "visibility": "public_both",
  "distributionMode": "permissioned",
  "description": "Updated description"
}
```

---

## Rooms & Rate Plans

### Create Room
```http
POST /properties/:propertyId/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "Deluxe",
  "quantity": 50,
  "area": 45,
  "areaUnit": "sqm",
  "minAdults": 1,
  "maxAdults": 2,
  "maxOccupancy": 2,
  "smokingPolicy": "non-smoking",
  "amenityCodes": ["WIFI", "AC", "TV"]
}
```

**Response (201):**
```json
{
  "id": "room_deluxe_001",
  "propertyId": "prop_plaza_001",
  "type": "Deluxe",
  "code": "DELUXE-001",
  "quantity": 50,
  "maxAdults": 2,
  "amenityCodes": ["WIFI", "AC", "TV"]
}
```

### Create Rate Plan
```http
POST /properties/:propertyId/rate-plans
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room_deluxe_001",
  "name": "Bed & Breakfast - Deluxe",
  "boardType": "BB",
  "taxInclusive": true,
  "minLengthOfStay": 1
}
```

**Response (201):**
```json
{
  "id": "rp_bb_deluxe",
  "propertyId": "prop_plaza_001",
  "roomId": "room_deluxe_001",
  "code": "BB-DELUXE",
  "name": "Bed & Breakfast - Deluxe",
  "boardType": "BB"
}
```

### Get Rooms for Property
```http
GET /properties/:propertyId/rooms
Authorization: Bearer <token>
```

### Get Rate Plans for Property
```http
GET /properties/:propertyId/rate-plans
Authorization: Bearer <token>
```

---

## Calendar & Rates (Private)

### Set Calendar Rates
```http
POST /properties/:propertyId/calendar-rates/bulk-update
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room_deluxe_001",
  "ratePlanId": "rp_bb_deluxe",
  "updates": [
    {
      "date": "2025-08-01",
      "netRate": 200,
      "availability": 50,
      "stopSell": false
    },
    {
      "date": "2025-08-02",
      "netRate": 220,
      "availability": 45,
      "stopSell": false
    }
  ]
}
```

**Response (200):**
```json
{
  "updated": 2,
  "message": "Calendar rates updated successfully"
}
```

### Get Calendar Rates
```http
GET /properties/:propertyId/calendar-rates?from=2025-08-01&to=2025-08-31
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "cal_001",
    "date": "2025-08-01",
    "roomCode": "DELUXE-001",
    "ratePlanCode": "BB-DELUXE",
    "netRate": 200,
    "availability": 50,
    "stopSell": false
  }
]
```

---

## Markup & Distribution Rules

### Configure B2B Markup
```http
POST /tenant/markup-rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "channel": "b2b",
  "type": "percentage",
  "value": 15,
  "priority": 0
}
```

**Response (201):**
```json
{
  "id": "markup_b2b_001",
  "channel": "b2b",
  "type": "percentage",
  "value": 15,
  "priority": 0
}
```

### Configure B2C Markup
```http
POST /tenant/markup-rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "channel": "b2c",
  "type": "percentage",
  "value": 25,
  "priority": 0
}
```

### Get Markup Rules
```http
GET /tenant/markup-rules
Authorization: Bearer <token>
```

---

## B2B Marketplace

### Search B2B Inventory (Reseller View)
```http
POST /b2b/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "hotelName": "Plaza",
  "city": "New York",
  "countryCode": "US",
  "checkInDate": "2025-08-15",
  "checkOutDate": "2025-08-18",
  "adults": 2,
  "children": 0
}
```

**Response (200):**
```json
{
  "results": [
    {
      "propertyId": "prop_plaza_001",
      "sourceTenantId": "luxury-hotels-co",
      "sourceTenantName": "Luxury Hotels Co.",
      "propertyName": "The Plaza Hotel",
      "city": "New York",
      "starRating": 5,
      "rooms": [
        {
          "roomType": "Deluxe",
          "ratePlanName": "Bed & Breakfast",
          "boardType": "BB",
          "netRate": 200,
          "b2bMargin": 15,
          "marketplaceRate": 230,
          "availability": 50,
          "numberOfNights": 3
        }
      ]
    }
  ]
}
```

**Notes:**
- `netRate`: Hidden from reseller (for audit only if they book)
- `marketplaceRate`: What reseller pays to source tenant
- Reseller can apply their own markup on top of `marketplaceRate` for their B2C storefront

### Request Distribution Grant
```http
POST /b2b/distribution-grants/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "sourceTenantId": "luxury-hotels-co"
}
```

**Response (201):**
```json
{
  "id": "grant_001",
  "sourceTenantId": "luxury-hotels-co",
  "targetTenantId": "global-dmcs",
  "status": "pending",
  "createdAt": "2025-07-13T12:30:00Z"
}
```

### Approve Distribution Grant (Source Tenant)
```http
POST /b2b/distribution-grants/:grantId/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "customB2BMargin": null
}
```

**Response (200):**
```json
{
  "id": "grant_001",
  "status": "approved",
  "customB2BMargin": null,
  "approvedAt": "2025-07-13T12:45:00Z"
}
```

### List Outgoing Distribution Grants (Source View)
```http
GET /b2b/distribution-grants/outgoing
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "grant_001",
    "targetTenantId": "global-dmcs",
    "targetTenantName": "Global DMCs",
    "status": "approved",
    "customB2BMargin": null,
    "createdAt": "2025-07-13T12:30:00Z",
    "approvedAt": "2025-07-13T12:45:00Z"
  }
]
```

### List Incoming Distribution Grants (Reseller View)
```http
GET /b2b/distribution-grants/incoming
Authorization: Bearer <token>
```

---

## B2B Bookings (Reseller → Source)

### Create B2B Booking (Reseller behalf of downstream customer)
```http
POST /b2b/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": "prop_plaza_001",
  "sourceTenantId": "luxury-hotels-co",
  "roomTypeCode": "DELUXE-001",
  "ratePlanCode": "BB-DELUXE",
  "checkInDate": "2025-08-15",
  "checkOutDate": "2025-08-18",
  "adults": 2,
  "guestEmail": "customer@example.com",
  "guestName": "John Doe",
  "guestPhone": "+1-234-567-8900"
}
```

**Response (201):**
```json
{
  "id": "booking_b2b_001",
  "bookingCode": "PLZ-B2B-00012345",
  "bookingType": "b2b",
  "sourceTenantId": "luxury-hotels-co",
  "resellerTenantId": "global-dmcs",
  "propertyName": "The Plaza Hotel",
  "checkInDate": "2025-08-15",
  "checkOutDate": "2025-08-18",
  "numberOfNights": 3,
  "guestName": "John Doe",
  "status": "confirmed",
  "rateBreakdown": {
    "netRate": 200,
    "b2bMarginApplied": 30,
    "marketplaceRate": 230,
    "numberOfNights": 3,
    "subtotal": 690,
    "taxTotal": 55,
    "finalRate": 745
  },
  "createdAt": "2025-07-13T13:00:00Z"
}
```

### List B2B Bookings (Reseller View)
```http
GET /b2b/bookings
Authorization: Bearer <token>
```

### Get B2B Booking Details
```http
GET /b2b/bookings/:bookingId
Authorization: Bearer <token>
```

---

## B2C Public Storefront

### Search Hotels (Public - No Auth Required)
```http
POST /b2c/search
Content-Type: application/json

{
  "tenantSlug": "luxury-hotels-co",
  "hotelName": "Plaza",
  "city": "New York",
  "checkInDate": "2025-08-15",
  "checkOutDate": "2025-08-18",
  "adults": 2,
  "children": 0
}
```

**Response (200):**
```json
{
  "tenant": {
    "name": "Luxury Hotels Co.",
    "primaryColor": "#7c3aed",
    "logoUrl": "https://..."
  },
  "results": [
    {
      "propertyId": "prop_plaza_001",
      "propertyName": "The Plaza Hotel",
      "city": "New York",
      "starRating": 5,
      "description": "Iconic luxury hotel at Central Park",
      "photos": [
        { "url": "https://...", "label": "Lobby" }
      ],
      "rooms": [
        {
          "roomType": "Deluxe",
          "ratePlanName": "Bed & Breakfast",
          "boardType": "BB",
          "b2cSellRate": 275,
          "availability": 50,
          "numberOfNights": 3,
          "amenities": ["WIFI", "AC", "TV"]
        }
      ]
    }
  ]
}
```

**Notes:**
- `b2cSellRate` = `netRate` + source tenant's B2C markup
- If property sourced from B2B marketplace: `b2cSellRate` = `marketplaceRate` + reseller's B2C markup
- No markup details exposed to guest

### Get Hotel Details (Public)
```http
GET /b2c/hotels/:propertyId?tenantSlug=luxury-hotels-co
```

### Get Room Details & Availability (Public)
```http
GET /b2c/hotels/:propertyId/rooms/:roomCode?checkInDate=2025-08-15&checkOutDate=2025-08-18
```

---

## B2C Guest Bookings

### Create Guest Booking
```http
POST /b2c/bookings
Content-Type: application/json

{
  "tenantSlug": "luxury-hotels-co",
  "propertyId": "prop_plaza_001",
  "roomTypeCode": "DELUXE-001",
  "ratePlanCode": "BB-DELUXE",
  "checkInDate": "2025-08-15",
  "checkOutDate": "2025-08-18",
  "adults": 2,
  "children": 0,
  "guestEmail": "guest@example.com",
  "guestName": "Jane Smith",
  "guestPhone": "+1-999-888-7777"
}
```

**Response (201):**
```json
{
  "id": "booking_b2c_001",
  "bookingCode": "PLZ-B2C-00098765",
  "bookingType": "b2c",
  "propertyName": "The Plaza Hotel",
  "checkInDate": "2025-08-15",
  "checkOutDate": "2025-08-18",
  "guestName": "Jane Smith",
  "guestEmail": "guest@example.com",
  "numberOfNights": 3,
  "b2cSellRate": 275,
  "subtotal": 825,
  "taxTotal": 66,
  "totalAmount": 891,
  "status": "pending_payment",
  "paymentUrl": "https://checkout.stripe.com/pay/...",
  "createdAt": "2025-07-13T13:15:00Z"
}
```

### Complete B2C Payment (via Stripe)
```http
POST /b2c/bookings/:bookingId/payment
Content-Type: application/json

{
  "stripePaymentIntentId": "pi_1234567890"
}
```

**Response (200):**
```json
{
  "id": "booking_b2c_001",
  "bookingCode": "PLZ-B2C-00098765",
  "status": "confirmed",
  "confirmationEmail": "sent_to_guest@example.com",
  "confirmationCode": "PLAZA-SMITH-2025-08-15"
}
```

### Get B2C Booking (Guest - No Auth)
```http
GET /b2c/bookings/:bookingCode?email=guest@example.com
```

---

## Cancellations & Policies

### Cancel Booking
```http
POST /bookings/:bookingId/cancel
Authorization: Bearer <token>

{
  "reason": "Guest request"
}
```

**Response (200):**
```json
{
  "id": "booking_b2c_001",
  "bookingCode": "PLZ-B2C-00098765",
  "status": "cancelled",
  "cancellationRefund": 800,
  "refundPenalty": 91,
  "refundReason": "7 days before arrival = Full Refund Policy",
  "cancelledAt": "2025-07-15T10:00:00Z"
}
```

---

## Admin & Reporting

### Get Tenant Revenue Dashboard
```http
GET /admin/dashboard/revenue?from=2025-07-01&to=2025-07-31
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "period": "2025-07",
  "gmv": 125000,
  "commission": 6250,
  "roomNights": 450,
  "bookings": 125,
  "avgBookingValue": 1000,
  "cancellations": 3,
  "cancellationRate": 0.024
}
```

### Get Audit Log
```http
GET /admin/audit-log?action=markup_rule_changed&limit=50
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "audit_001",
    "timestamp": "2025-07-13T12:30:00Z",
    "userId": "user_123",
    "action": "markup_rule_changed",
    "entityType": "RateMarkup",
    "entityId": "markup_b2b_001",
    "beforeState": { "value": 12 },
    "afterState": { "value": 15 }
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Tenant isolation violation: Cannot access resource from another tenant"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Property not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Rate conflict: Calendar rate already exists for this date"
}
```

---

## Rate Calculation Example

**Scenario:** Reseller books from Source Tenant's B2B inventory, marks it up, sells to guest

```
1. Source Tenant sets NET RATE:              $200/night
2. Source Tenant's B2B Margin (15%):         +$30
   → MARKETPLACE RATE:                       $230/night

3. Reseller discovers @ $230 in marketplace

4. Reseller applies B2C Markup (20%):        +$46
   → RESELLER'S SELL RATE:                   $276/night

5. Guest books 3 nights:
   Subtotal:                                 $828
   Taxes (10%):                              +$83
   TOTAL TO GUEST:                           $911
```

**Rate Breakdown Audit Record (For Reseller):**
```json
{
  "netRate": 200,
  "b2bMarginApplied": 30,
  "resellerMarkup": 46,
  "taxTotal": 83,
  "finalRate": 276,
  "markupHistory": [
    {
      "applied_by": "luxury-hotels-co",
      "type": "b2b",
      "value": 30,
      "timestamp": "2025-07-13T12:00:00Z"
    },
    {
      "applied_by": "global-dmcs",
      "type": "b2c",
      "value": 46,
      "timestamp": "2025-07-13T13:15:00Z"
    }
  ]
}
```

---

## Webhooks (Future)

Planned webhook events:
- `booking.created` — New booking confirmed
- `booking.cancelled` — Booking cancelled
- `distribution_grant.approved` — B2B access granted
- `inventory_updated` — Calendar rates changed
- `payment.completed` — Guest payment processed

---

## Rate Limits

- **Public endpoints:** 100 req/min per IP
- **Authenticated endpoints:** 1000 req/min per tenant
- **Bulk operations:** 10 req/min per tenant

---

## Contact & Support

For API issues, contact: `api-support@hotelplatform.com`
