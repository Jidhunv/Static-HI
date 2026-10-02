# Two-Tier Settlement Model for Multi-Supplier Distribution

## Overview

The two-tier settlement model separates payment flows into two distinct settlement chains:

1. **Tier 1 (Seller Settlement)**: Platform → Distributor (who made the sale)
2. **Tier 2 (Inter-Supplier Settlement)**: Distributor → Hotel Owner (who owns inventory)

This model reflects realistic B2B operations where distributors are financially responsible for settling with inventory owners, not the platform.

---

## Model Comparison

### Old Model (Parallel Settlements)
```
Guest Pays $875
    ↓
Platform
    ├─ Hotel A gets $735 (direct from platform)
    ├─ Distributor B gets $96.30 (direct from platform)
    └─ Platform keeps $43.40
```

**Problem:** Platform must reconcile with multiple suppliers, complex ledger tracking.

---

### New Model (Two-Tier Settlements) ✅
```
Guest Pays $875
    ↓
Platform Collects & Deducts Fees
    ├─ Platform Fee (2%): $17.50
    ├─ Gateway Fee (3%): $26.25
    └─ Net Amount for Settlement: $831.25
    ↓
TIER 1: Distributor B Settlement
    ├─ Receives: $831.25 (from platform)
    ├─ Status: "seller_settlement"
    └─ Payment From: Platform
    ↓
TIER 2: Hotel A Commission Settlement
    ├─ Distributor B Owes: $112.50 (15% commission)
    ├─ Status: "inter_supplier_settlement"
    ├─ Due Date: 15 days after booking
    └─ Payment From: Distributor B
```

**Benefits:**
- ✅ Platform → Distributor (clean separation of concerns)
- ✅ Distributor → Hotel Owner (distributor manages relationships)
- ✅ Clear audit trail for each settlement
- ✅ Distributor controls commission payments timing
- ✅ Hotel can track which distributor owes commission

---

## Settlement Flow Diagram

```
                         BOOKING CONFIRMED
                                │
                                ▼
                    ┌─────────────────────┐
                    │  Guest Paid: $875   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ PLATFORM PROCESSES  │
                    │ Platform Fee (2%):  │
                    │ -$17.50             │
                    │ Gateway Fee (3%):   │
                    │ -$26.25             │
                    │ ─────────────────   │
                    │ Net: $831.25        │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
        ┌───────────────┐          ┌─────────────────┐
        │  TIER 1:      │          │  TIER 2:        │
        │ SELLER SETTLE │          │ INTER-SUPPLIER  │
        │ MENT          │          │ SETTLEMENT      │
        └───────┬───────┘          └────────┬────────┘
                │                           │
                │                 ┌─────────▼────────┐
                │                 │ STATUS:          │
                │                 │ pending_inter_   │
                │                 │ supplier         │
                │                 │ (Distributor B   │
                │                 │  owes Hotel A)   │
                │                 └─────────────────┘
                │                           │
        ┌───────▼──────────┐        ┌──────▼────────┐
        │ STATUS:          │        │ DUE DATE:     │
        │ pending_seller   │        │ +15 days      │
        │ (Platform to     │        │               │
        │  Distributor B)  │        │ AMOUNT:       │
        └───────┬──────────┘        │ $112.50       │
                │                   │ (15% of $750) │
        ┌───────▼──────────┐        └──────┬────────┘
        │ AMOUNT:          │               │
        │ $831.25          │       ┌───────▼──────────┐
        │ (net after fees) │       │ Distributor B    │
        │                  │       │ Records Payment  │
        │ Payment From:    │       │ Obligation       │
        │ Platform         │       └──────────────────┘
        │                  │
        └──────────────────┘
```

---

## Key Concepts

### Settlement Status Flow

**Seller Settlement (Tier 1):**
```
pending_seller → completed_seller → (archived)
```

**Inter-Supplier Settlement (Tier 2):**
```
pending_inter_supplier → (overdue if past due date) → completed_inter_supplier → (archived)
```

### Payment Obligations

```
Hotel A's Perspective:
  "Which distributors owe me commission?"
  → Query: payeeTenantId = hotel_id, settlementType = inter_supplier
  → Filter by status: pending_inter_supplier, overdue

Distributor B's Perspective:
  "How much do I owe hotel owners?"
  → Query: payerTenantId = distributor_id, settlementType = inter_supplier
  → Filter by status: pending_inter_supplier, overdue, completed_inter_supplier
```

---

## API Endpoints

### Tier 1: Seller Settlements (Platform → Distributor)

#### Get Seller Settlements
```bash
GET /api/v1/b2b/settlement-chain/seller/settlements

Response:
[
  {
    "id": "sett_123",
    "supplierId": "distributor_b",  # Who receives
    "totalAmount": 831.25,           # Net after fees
    "status": "pending_seller",      # Waiting for platform payout
    "settlementType": "seller",
    "settlementDate": "2026-10-02T10:00:00Z",
    "paidDate": null
  }
]
```

#### Process Seller Settlement
```bash
PUT /api/v1/b2b/settlement-chain/seller/:settlementId/process

Request:
{
  "bankDetails": {
    "accountNumber": "****1234",
    "bankName": "Bank Name",
    "swift": "SWFTCODE"
  }
}

Response:
{
  "id": "sett_123",
  "status": "completed_seller",
  "paymentReference": "PAY-SELLER-distributor_b-1696262400",
  "paidDate": "2026-10-02T11:00:00Z"
}
```

---

### Tier 2: Inter-Supplier Settlements (Distributor → Hotel Owner)

#### Get Commissions Owed (Hotel Owner View)
```bash
GET /api/v1/b2b/settlement-chain/payee/settlements

Response:
[
  {
    "id": "sett_456",
    "payerTenantId": "distributor_b",    # Who owes
    "payeeTenantId": "hotel_a",          # Hotel
    "totalAmount": 112.50,                # Commission
    "status": "pending_inter_supplier",   # Not yet paid
    "settlementType": "inter_supplier",
    "dueDate": "2026-10-17T00:00:00Z",
    "paidDate": null
  }
]
```

#### Get Payment Obligations (Distributor View)
```bash
GET /api/v1/b2b/settlement-chain/payer/settlements

Response:
[
  {
    "id": "sett_456",
    "payerTenantId": "distributor_b",    # We owe this
    "payeeTenantId": "hotel_a",          # To this hotel
    "totalAmount": 112.50,
    "status": "pending_inter_supplier",
    "dueDate": "2026-10-17T00:00:00Z"
  }
]
```

#### Record Payment (Distributor Pays Hotel)
```bash
PUT /api/v1/b2b/settlement-chain/inter-supplier/:settlementId/pay

Request:
{
  "paymentReference": "ACH-20261002-001"
}

Response:
{
  "id": "sett_456",
  "status": "completed_inter_supplier",
  "paymentReference": "ACH-20261002-001",
  "paidDate": "2026-10-02T14:30:00Z"
}
```

---

### Settlement Chain Summary
```bash
GET /api/v1/b2b/settlement-chain/booking/:bookingId

Response:
{
  "booking_id": "BOOK-001",
  "guest_paid": 875.00,
  "tier_1_seller_settlement": {
    "settlement_id": "sett_123",
    "status": "completed_seller",
    "amount": 831.25,
    "platform_fee": 17.50,
    "gateway_fee": 26.25,
    "paid_date": "2026-10-02T11:00:00Z"
  },
  "tier_2_inter_supplier_settlement": {
    "settlement_id": "sett_456",
    "status": "pending_inter_supplier",
    "commission_amount": 112.50,
    "due_date": "2026-10-17T00:00:00Z",
    "paid_date": null
  }
}
```

---

### Dashboards

#### Distributor Dashboard
```bash
GET /api/v1/b2b/settlement-chain/distributor/dashboard

Response:
{
  "seller_settlements": {
    "total_received": 25000.00,        # From platform
    "total_pending": 5000.00,
    "completed_count": 50,
    "pending_count": 10
  },
  "inter_supplier_obligations": {
    "total_owed": 3750.00,             # To hotel owners
    "outstanding_payments": 15,
    "overdue_count": 2
  },
  "net_position": 21250.00             # What distributor keeps
}
```

#### Hotel Dashboard
```bash
GET /api/v1/b2b/settlement-chain/hotel/dashboard

Response:
{
  "commissions_owed": {
    "total_amount": 3750.00,           # From all distributors
    "outstanding_count": 15,
    "overdue_count": 2
  },
  "commissions_received": {
    "total_amount": 8500.00,           # Already paid
    "paid_count": 40
  },
  "by_distributor": [
    {
      "payerTenantId": "distributor_a",
      "_sum": { "totalAmount": 1500.00 },
      "_count": 20
    },
    {
      "payerTenantId": "distributor_b",
      "_sum": { "totalAmount": 2250.00 },
      "_count": 25
    }
  ]
}
```

---

## Implementation Details

### Data Model Updates

**Settlement Table Changes:**
```sql
ALTER TABLE settlements ADD COLUMN settlementType VARCHAR(50);
-- Values: 'seller' | 'inter_supplier'

ALTER TABLE settlements ADD COLUMN payerTenantId VARCHAR(255);
-- For inter_supplier: who pays (distributor)

ALTER TABLE settlements ADD COLUMN payeeTenantId VARCHAR(255);
-- For inter_supplier: who receives (hotel owner)

ALTER TABLE settlements ADD COLUMN dueDate TIMESTAMP;
-- For inter_supplier: payment due date

ALTER TABLE settlements ADD COLUMN bookingReference VARCHAR(255);
-- Reference to booking that triggered settlement
```

### RevenueTransaction Links

```sql
ALTER TABLE revenue_transactions ADD COLUMN sellerSettlementId VARCHAR(255);
-- Link to Tier 1 settlement

ALTER TABLE revenue_transactions ADD COLUMN interSupplierSettlementId VARCHAR(255);
-- Link to Tier 2 settlement
```

---

## Example Workflow

### Step 1: Booking Created
```bash
POST /api/v1/b2c/bookings
{
  "propertyId": "prop_123",
  "roomId": "room_456",
  "guestPaid": 875.00,
  "nights": 5,
  "netRate": 150,
  "distributorTenantId": "distributor_b",
  "hotelTenantId": "hotel_a"
}

# System creates revenue transaction with settlement references
```

### Step 2: Platform Processes Payment
```bash
POST /api/v1/b2b/settlement-chain/execute
{
  "bookingId": "BOOK-001",
  "guestPaid": 875.00,
  "sellerTenantId": "distributor_b",
  "inventoryOwnerTenantId": "hotel_a",
  "netRate": 150,
  "nights": 5,
  "commissionPct": 15
}

# Creates Tier 1 and Tier 2 settlements
# Tier 1: distributor_b gets $831.25 (pending_seller)
# Tier 2: hotel_a owed $112.50 from distributor_b (pending_inter_supplier, due in 15 days)
```

### Step 3: Platform Pays Distributor
```bash
PUT /api/v1/b2b/settlement-chain/seller/SETT_123/process
{
  "bankDetails": { ... }
}

# Tier 1 moves to completed_seller
# $831.25 transferred to distributor_b
```

### Step 4: Distributor Pays Hotel (anytime before due date)
```bash
PUT /api/v1/b2b/settlement-chain/inter-supplier/SETT_456/pay
{
  "paymentReference": "ACH-20261002-001"
}

# Tier 2 moves to completed_inter_supplier
# $112.50 transferred from distributor_b to hotel_a
```

### Step 5: Overdue Tracking
```bash
# Scheduled job runs daily
POST /api/v1/b2b/settlement-chain/mark-overdue

# Any inter_supplier settlement past due date:
# pending_inter_supplier → overdue
```

---

## Business Logic

### Commissions Always Flow Through Distributor

1. **Hotel sets commission percentage** when publishing inventory
   - "I'll pay you 15% commission if you sell my room"

2. **Distributor adds markup** when displaying room
   - "I'll charge $20 more than hotel's $150 rate"

3. **Guest books and pays distributor**
   - Pays $170/night to distributor

4. **Platform pays distributor first**
   - Distributor receives full booking minus platform fees
   - Tier 1: $831.25 (for 5-night booking)

5. **Distributor owes hotel commission**
   - 15% of 5 nights × $150 = $112.50
   - Tier 2 settlement due in 15 days

6. **Distributor decides when to settle**
   - Can batch settlements
   - Can settle late (incurs overdue status)
   - But must settle before payment deadline

---

## Reporting

### Monthly Report for Distributor
```bash
GET /api/v1/b2b/settlement-chain/distributor/report/2026-10

Response:
{
  "period": "2026-10",
  "seller_settlements": {
    "count": 50,
    "total_received": 41562.50,
    "completed_count": 48
  },
  "inter_supplier_settlements": {
    "count": 50,
    "total_obligation": 6234.37,
    "paid_count": 45
  },
  "net_cash_position": 35328.13  # Keeps this much
}
```

---

## Reconciliation

### From Platform Side
- Sum of all seller_settlement.status = completed_seller
- Should equal total platform payouts

### From Distributor Side
- seller_settlement receivables
- Less inter_supplier_settlement payables
- Should equal net cash position

### From Hotel Side
- Sum of inter_supplier_settlement.payeeTenantId
- Should equal total commissions owed/received

---

## Overdue Management

### Escalation Flow
```
pending_inter_supplier (0-15 days)
            ↓
      overdue (15+ days)
            ↓
  contact_required (30+ days)
            ↓
  suspend_inventory (45+ days)
```

Hotel can suspend distributor's access to inventory if payments overdue.

---

## Summary

The two-tier settlement model:
- ✅ Clear payment chain: Guest → Platform → Distributor → Hotel
- ✅ Each settlement fully tracked with references
- ✅ Distributor manages hotel relationships
- ✅ Easy audit trail and reconciliation
- ✅ Supports overdue tracking and escalation
- ✅ Clear dashboards for each party
