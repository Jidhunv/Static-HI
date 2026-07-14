# Phase 2 Quick Test Guide (30-Minute Smoke Test)

---

## 🚀 CRITICAL PATH TESTS (Must Pass)

### 1. Atomic Booking (5 min)
```bash
# Test: Single eligible booking creates ledger entry
POST /api/bookings
{
  propertyId: "prop-123",
  roomId: "room-456",
  ratePlanId: "rate-789",
  checkInDate: "2026-07-20",
  checkOutDate: "2026-07-22",
  numberOfGuests: 2,
  guestName: "John Doe",
  guestEmail: "john@example.com",
  rateType: "domestic",
  rateAmount: 100,
  source: "b2c",
  baseCurrency: "USD",
  quantity: 1
}

# Expected: 
# - Booking created with status: pending
# - systemConfirmationNo generated
# - Inventory ledger entry created for each date
# - currentAvailability decremented
# - Audit log recorded
```

### 2. Blackout Blocks Booking (5 min)
```bash
# Test: Create blackout, verify booking rejected

# 1. Add blackout
POST /api/rate-cards/{propertyId}/{ratePlanId}/blackout
{
  startDate: "2026-07-20",
  endDate: "2026-07-25",
  reason: "Maintenance",
  userId: "admin",
  email: "admin@example.com"
}

# 2. Try to book during blackout
POST /api/bookings (same as above)

# Expected: BadRequestException with "Blackout" in message
```

### 3. Inventory Depletion (5 min)
```bash
# Test: Insufficient inventory blocks booking

# 1. Allocate only 1 room
POST /api/inventory/{propertyId}/{roomId}/{ratePlanId}/allocate
{
  quantity: 1,
  userId: "admin",
  email: "admin@example.com"
}

# 2. Book 2 rooms
POST /api/bookings (with quantity: 2)

# Expected: BadRequestException with "insufficient inventory"
```

### 4. Multi-Currency FX Snapshot (5 min)
```bash
# Test: Booking captures FX rate

POST /api/bookings
{
  ...
  baseCurrency: "USD",
  displayCurrency: "EUR"
}

# Expected:
# - displayAmount calculated (totalAmount * rate)
# - fxSnapshot contains rate and timestamp
# - Booking shows both baseAmount and displayAmount
```

### 5. Approval Dashboard (5 min)
```
1. Open /admin/approvals/tenants
   → Should load pending approvals list
   → Review button opens modal

2. Click Approve with notes
   → Modal closes
   → List refreshes
   → Tenant status changes to confirmed

3. Check audit log
   → Approval logged with approver name/email
```

---

## 🎯 DASHBOARD QUICK CHECKS (2 min each)

### Tenant Approvals ✓
- [ ] List loads without error
- [ ] Status badges color-coded correctly
- [ ] Approve/Reject modal appears
- [ ] List refreshes after action

### Agent Approvals ✓
- [ ] List loads without error
- [ ] Commission rate displays with %
- [ ] Modal shows KYC status
- [ ] Approval workflow works

### Inventory Audit ✓
- [ ] Summary cards show counts
- [ ] Can filter by property ID
- [ ] Table displays ledger entries
- [ ] Delta column color-coded (+ green, - red)
- [ ] CSV export downloads file

### Blackout Management ✓
- [ ] Can add blackout with dates + reason
- [ ] List shows created blackouts
- [ ] Delete button removes with confirmation
- [ ] Days blocked calculated correctly

### FX Management ✓
- [ ] Currency dropdown loads
- [ ] Rates table displays for selected currency
- [ ] Freshness badge shows hours + color
- [ ] Edit button populates form
- [ ] Update button saves new rate

---

## ⚠️ CRITICAL FAILURE MODES

| Scenario | What to Check | Fail If |
|----------|---------------|---------|
| Booking Success | Ledger entry created | Ledger empty |
| Blackout Block | Error message received | Booking succeeds |
| Inventory Ledger | CurrentAvailability view updated | View stale |
| FX Snapshot | Rate captured at booking | Rate is NULL |
| Approval | Audit log entry created | Log empty |
| Concurrent Bookings | Only 1 succeeds (at capacity) | 2+ bookings created |
| Rollback | Booking deleted if ledger fails | Booking remains |

---

## 🔍 VERIFICATION QUERIES

```sql
-- Verify booking created
SELECT * FROM Booking WHERE systemConfirmationNo = 'CONF-20260714-XXXXX';

-- Verify ledger entries created (should be 2 for 2-night stay)
SELECT * FROM InventoryLedger 
WHERE bookingId = 'booking-id' 
ORDER BY date;

-- Verify currentAvailability updated
SELECT * FROM CurrentAvailability 
WHERE bookingId = 'booking-id';

-- Verify audit log
SELECT * FROM AuditLog 
WHERE entity = 'Booking' 
AND action = 'create'
ORDER BY createdAt DESC;

-- Verify FX snapshot (check booking table for rate field)
SELECT id, totalAmount, displayCurrency, fxSnapshot 
FROM Booking 
WHERE id = 'booking-id';
```

---

## ✅ PASS/FAIL CHECKLIST

- [ ] Booking created successfully
- [ ] Ledger entries match date range
- [ ] Blackout prevents booking
- [ ] Insufficient inventory prevents booking
- [ ] FX rate snapshotted correctly
- [ ] All approval dashboards load
- [ ] Approvals update status and log activity
- [ ] Inventory audit shows all ledger entries
- [ ] Blackout management creates/deletes correctly
- [ ] FX management displays and updates rates

**Result:** ✅ PASS or ❌ FAIL

---

## 🎬 QUICK PERFORMANCE CHECK

- [ ] Booking creation: < 2s
- [ ] Approval list load: < 2s
- [ ] Inventory audit load: < 3s
- [ ] CSV export: < 5s
- [ ] Concurrent bookings (10 req): < 5s total

---

**Estimated Time:** 30 minutes  
**Next Step:** Run comprehensive test suite if smoke test passes  
