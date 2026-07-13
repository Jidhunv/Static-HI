# API Testing & Integration Guide

## Quick Start

**Base URL:** `http://localhost:3001/api/v1`

**Test Credentials:**
- Tenant ID: `luxury-hotels-co`
- Email: `admin@luxuryhotels.com`
- Password: `password123`

---

## Step 1: Authentication

Get your JWT token:

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "luxury-hotels-co",
    "email": "admin@luxuryhotels.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "admin@luxuryhotels.com",
    "tenantId": "luxury-hotels-co",
    "tenantName": "Luxury Hotels Co.",
    "role": "admin"
  }
}
```

Save the `access_token` for subsequent requests.

---

## Step 2: Get Tenant Info

```bash
curl -X GET http://localhost:3001/api/v1/tenant/info \
  -H "Authorization: Bearer <access_token>"
```

---

## Step 3: Explore Masters (Public - No Auth)

### Get Countries
```bash
curl -X GET http://localhost:3001/api/v1/masters/countries
```

### Get Amenities
```bash
curl -X GET http://localhost:3001/api/v1/masters/amenities
```

---

## Step 4: View Your Properties

```bash
curl -X GET http://localhost:3001/api/v1/properties \
  -H "Authorization: Bearer <access_token>"
```

Sample property pre-seeded: **The Plaza Hotel** (code: `MAR-NYC-001`)

---

## B2B Marketplace Testing Flow

### Scenario: Reseller discovers and books source tenant's inventory

#### Step 1: Login as Reseller (Global DMCs)

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "global-dmcs",
    "email": "admin@globaldmcs.com",
    "password": "password123"
  }'
```

#### Step 2: Search B2B Marketplace

```bash
curl -X POST http://localhost:3001/api/v1/b2b/search \
  -H "Authorization: Bearer <reseller_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelName": "Plaza",
    "city": "New York",
    "countryCode": "US",
    "checkInDate": "2025-08-15",
    "checkOutDate": "2025-08-18",
    "adults": 2,
    "children": 0
  }'
```

**Response includes:**
- Properties visible in marketplace
- For each room: netRate (hidden in UI), b2bMargin, marketplaceRate
- No source tenant's net rates exposed to reseller

#### Step 3: Request Distribution Access

If property has `distributionMode: "permissioned"`, request approval:

```bash
curl -X POST http://localhost:3001/api/v1/b2b/distribution-grants/request \
  -H "Authorization: Bearer <reseller_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceTenantId": "luxury-hotels-co"
  }'
```

#### Step 4: Approve Distribution (As Source Tenant)

Switch to source tenant token:

```bash
curl -X POST http://localhost:3001/api/v1/b2b/distribution-grants/<grantId>/approve \
  -H "Authorization: Bearer <source_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customB2BMargin": null
  }'
```

#### Step 5: Create B2B Booking (Reseller)

```bash
curl -X POST http://localhost:3001/api/v1/b2b/bookings \
  -H "Authorization: Bearer <reseller_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "prop_plaza_001",
    "sourceTenantId": "luxury-hotels-co",
    "roomTypeCode": "DELUXE-001",
    "ratePlanCode": "BB-DELUXE",
    "checkInDate": "2025-08-15",
    "checkOutDate": "2025-08-18",
    "adults": 2,
    "children": 0,
    "guestEmail": "customer@travel-agency.com",
    "guestName": "John Smith",
    "guestPhone": "+1-555-1234"
  }'
```

**Response:**
```json
{
  "id": "booking_b2b_001",
  "bookingCode": "MAR-B2B-ABC12345",
  "bookingType": "b2b",
  "sourceTenantId": "luxury-hotels-co",
  "resellerTenantId": "global-dmcs",
  "numberOfNights": 3,
  "rateBreakdown": {
    "netRate": 200,
    "b2bMarginApplied": 30,
    "marketplaceRate": 230,
    "finalRate": 690,
    "taxTotal": 69
  },
  "status": "confirmed"
}
```

---

## B2C Storefront Testing Flow

### Scenario: Guest books on public storefront

#### Step 1: Search Public Inventory (No Auth Required)

```bash
curl -X POST http://localhost:3001/api/v1/b2c/search \
  -H "Content-Type: application/json" \
  -d '{
    "tenantSlug": "luxury-hotels-co",
    "hotelName": "Plaza",
    "city": "New York",
    "checkInDate": "2025-08-15",
    "checkOutDate": "2025-08-18",
    "adults": 2
  }'
```

**Response:**
```json
{
  "tenant": {
    "name": "Luxury Hotels Co.",
    "primaryColor": "#7c3aed",
    "logoUrl": "https://..."
  },
  "results": [
    {
      "propertyName": "The Plaza Hotel",
      "city": "New York",
      "rooms": [
        {
          "roomType": "Deluxe",
          "ratePlans": [
            {
              "ratePlanName": "Bed & Breakfast",
              "b2cSellRate": 275,
              "numberOfNights": 3,
              "availability": 50
            }
          ]
        }
      ]
    }
  ]
}
```

**Important:** Only `b2cSellRate` is shown to guests (netRate + B2C markup). Never expose netRate.

#### Step 2: Get Room Details

```bash
curl -X GET "http://localhost:3001/api/v1/b2c/hotels/prop_plaza_001/rooms/DELUXE-001?tenantSlug=luxury-hotels-co&checkInDate=2025-08-15&checkOutDate=2025-08-18"
```

#### Step 3: Create Guest Booking

```bash
curl -X POST http://localhost:3001/api/v1/b2c/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tenantSlug": "luxury-hotels-co",
    "propertyId": "prop_plaza_001",
    "roomTypeCode": "DELUXE-001",
    "ratePlanCode": "BB-DELUXE",
    "checkInDate": "2025-08-15",
    "checkOutDate": "2025-08-18",
    "adults": 2,
    "guestEmail": "guest@example.com",
    "guestName": "Jane Doe",
    "guestPhone": "+1-999-8888"
  }'
```

**Response:**
```json
{
  "id": "booking_b2c_001",
  "bookingCode": "MAR-B2C-XYZ98765",
  "b2cSellRate": 275,
  "subtotal": 825,
  "taxTotal": 83,
  "totalAmount": 908,
  "status": "pending_payment",
  "paymentUrl": "https://checkout.stripe.com/pay/..."
}
```

#### Step 4: Complete Payment

```bash
curl -X POST http://localhost:3001/api/v1/b2c/bookings/booking_b2c_001/payment?email=guest@example.com \
  -H "Content-Type: application/json" \
  -d '{
    "stripePaymentIntentId": "pi_1234567890"
  }'
```

#### Step 5: Get Booking Confirmation

```bash
curl -X GET "http://localhost:3001/api/v1/b2c/bookings/MAR-B2C-XYZ98765?email=guest@example.com"
```

---

## Rate Calculation Audit Trail

Every booking creates a `rateBreakdown` record. Example:

```json
{
  "sourceTenantId": "luxury-hotels-co",
  "resellerTenantId": "global-dmcs",
  "netRate": 200,
  "b2bMarginApplied": 30,
  "resellerMarkup": 46,
  "taxTotal": 83,
  "finalRate": 909,
  "markupHistory": [
    {
      "applied_by": "luxury-hotels-co",
      "type": "b2b",
      "value": 15,
      "timestamp": "2025-07-13T12:00:00Z"
    },
    {
      "applied_by": "global-dmcs",
      "type": "b2c",
      "value": 20,
      "timestamp": "2025-07-13T13:15:00Z"
    }
  ]
}
```

Reseller can audit: "Why did this booking cost $909?"  
Answer: $200 net + 15% source margin + 20% reseller markup + tax = $909

---

## Distribution Grant Lifecycle

### Source Tenant Perspective

**Get outgoing grants (properties I'm distributing):**
```bash
curl -X GET http://localhost:3001/api/v1/b2b/distribution-grants/outgoing \
  -H "Authorization: Bearer <source_token>"
```

**Approve pending grant:**
```bash
curl -X POST http://localhost:3001/api/v1/b2b/distribution-grants/<grantId>/approve \
  -H "Authorization: Bearer <source_token>" \
  -H "Content-Type: application/json" \
  -d '{ "customB2BMargin": 18 }'
```

**Reject grant:**
```bash
curl -X POST http://localhost:3001/api/v1/b2b/distribution-grants/<grantId>/reject \
  -H "Authorization: Bearer <source_token>"
```

### Reseller Perspective

**Get incoming grants (whose inventory I can resell):**
```bash
curl -X GET http://localhost:3001/api/v1/b2b/distribution-grants/incoming \
  -H "Authorization: Bearer <reseller_token>"
```

---

## Common Error Cases

### 400: Tenant isolation violation
```json
{
  "statusCode": 403,
  "message": "Tenant isolation violation: Cannot access resource from another tenant"
}
```
**Reason:** Tenant tried to access another tenant's private data

### 400: No permission to book
```json
{
  "statusCode": 400,
  "message": "No permission to book from this property"
}
```
**Reason:** Property is permissioned, but reseller doesn't have approved grant

### 400: Insufficient availability
```json
{
  "statusCode": 400,
  "message": "Insufficient availability"
}
```
**Reason:** Room is booked or stop-sell flag is active

### 404: Booking not found (cross-tenant attempt)
```json
{
  "statusCode": 404,
  "message": "Booking not found"
}
```
**Reason:** Tenant tried to access booking they don't own

---

## Rate Limit Headers

All responses include:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1626262200
```

---

## Testing Tools

### Postman Collection

Import this into Postman:

```json
{
  "info": {
    "name": "Hotel Inventory API",
    "description": "B2B2C Testing"
  },
  "item": [
    {
      "name": "Auth - Login (Source)",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/v1/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"tenantId\":\"luxury-hotels-co\",\"email\":\"admin@luxuryhotels.com\",\"password\":\"password123\"}"
        }
      }
    },
    {
      "name": "Auth - Login (Reseller)",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/v1/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"tenantId\":\"global-dmcs\",\"email\":\"admin@globaldmcs.com\",\"password\":\"password123\"}"
        }
      }
    }
  ]
}
```

### cURL Aliases (bash)

Add to `.bashrc` or `.zshrc`:

```bash
# Login
alias hotel-login-source='curl -X POST http://localhost:3001/api/v1/auth/login -H "Content-Type: application/json" -d "{\"tenantId\":\"luxury-hotels-co\",\"email\":\"admin@luxuryhotels.com\",\"password\":\"password123\"}" | jq -r ".access_token"'

alias hotel-login-reseller='curl -X POST http://localhost:3001/api/v1/auth/login -H "Content-Type: application/json" -d "{\"tenantId\":\"global-dmcs\",\"email\":\"admin@globaldmcs.com\",\"password\":\"password123\"}" | jq -r ".access_token"'

# Use: TOKEN=$(hotel-login-source) && curl ... -H "Authorization: Bearer $TOKEN"
```

---

## Key Concepts to Test

1. **Rate Resolution:** Verify that markup layers stack correctly
2. **Tenant Isolation:** Reseller cannot see source tenant's netRate; guest never sees either
3. **Distribution Control:** Permissioned properties require approval; open properties don't
4. **Audit Trail:** Every booking records markup history for compliance
5. **B2C Privacy:** Guest booking endpoint requires no auth; guest email gates access to their booking

---

## Next: Production Integration

When moving to production:

1. **Stripe Connect:** Wire up real payment processing
2. **Email Notifications:** Send confirmation/cancellation emails
3. **Webhooks:** Post booking events to external systems
4. **Rate Limiting:** Increase from 1000 to cloud-provider defaults
5. **Logging:** All API calls logged for audit
6. **SSL/TLS:** All endpoints HTTPS only
7. **API Keys:** Deprecate bearer tokens; migrate to API keys for server-to-server
