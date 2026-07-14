# Phase 2 Comprehensive Testing Plan

**Date:** 2026-07-14  
**Scope:** Backend Integration + 5 Frontend Dashboards  
**Target:** 100% Feature Coverage + Edge Cases  

---

## ✅ TESTING CHECKLIST

### 1. BOOKING SERVICE INTEGRATION (Backend)

#### 1.1 Eligibility Check System
- [ ] **Blackout Precedence** - Booking fails immediately if date in blackout range
- [ ] **Inventory Depletion** - Booking fails if insufficient inventory
- [ ] **Length of Stay** - Booking fails if outside min/max night range
- [ ] **Promotion Validity** - Booking fails if promotion expired
- [ ] **Early-bird Cutoff** - Booking fails if past early-bird deadline
- [ ] **Multiple Violations** - All violations returned in error message

#### 1.2 Atomic Booking
- [ ] **Concurrent Bookings** - 5 simultaneous requests, only 1 succeeds with available inventory
- [ ] **Transaction Rollback** - Booking deleted if inventory ledger fails
- [ ] **Row Locking** - SELECT...FOR UPDATE prevents race conditions
- [ ] **Inventory Ledger Entry** - Ledger entry created for each date in range
- [ ] **CurrentAvailability Update** - View reflects booking immediately

#### 1.3 Currency Conversion & FX Snapshot
- [ ] **Rate Fetching** - Correct rate retrieved for currency pair
- [ ] **Amount Conversion** - totalAmount * rate = displayAmount
- [ ] **Snapshot Captured** - FX rate stored at booking time
- [ ] **Historical Pricing** - Historical booking never re-prices if FX changes
- [ ] **Same Currency** - No conversion if displayCurrency = baseCurrency

#### 1.4 Audit Logging
- [ ] **Success Log** - Booking creation logged with full details
- [ ] **Failure Log** - Booking failure logged with reason
- [ ] **Eligibility Failure Log** - Failed eligibility check logged before rollback
- [ ] **Actor Tracking** - User email/ID captured in all logs
- [ ] **Timestamp Accuracy** - Log timestamps chronological and accurate

#### 1.5 Edge Cases
- [ ] **Zero Inventory** - Booking fails with "insufficient inventory"
- [ ] **Negative Dates** - Booking fails if checkOut <= checkIn
- [ ] **Missing Property** - Booking fails with 404 if property not found
- [ ] **Multi-night Booking** - All dates in range checked for inventory
- [ ] **Confirmation Number Collision** - Retry generates new confirmation on collision

---

### 2. TENANT APPROVAL DASHBOARD (Frontend)

#### 2.1 List Display
- [ ] **Loads Pending** - GET /api/approvals/pending/Tenant returns list
- [ ] **Table Columns** - Tenant Name, Business Type, KYC Status, Status, Date, Actions
- [ ] **Color Coding** - Pending=Yellow, Confirmed=Green, Suspended=Red
- [ ] **Empty State** - "No pending approvals" shown when list empty
- [ ] **Loading State** - Spinner shown during data fetch

#### 2.2 Approval Workflow
- [ ] **Review Button** - Click opens modal for pending approvals only
- [ ] **Modal Display** - Shows tenant name, business type, email, KYC status
- [ ] **Approve Action** - PUT /approvals/Tenant/:id/approve sends notes
- [ ] **Reject Action** - PUT /approvals/Tenant/:id/reject requires reason
- [ ] **Cancel Button** - Closes modal without action
- [ ] **Refresh After Action** - List reloads after approve/reject

#### 2.3 Validation
- [ ] **Reject Without Reason** - Alert shown if no reason provided
- [ ] **Empty Notes Allowed** - Approve works with empty notes
- [ ] **Modal Closes After Action** - Modal disappears post-action
- [ ] **Status Updates** - Approved tenant status changes to "confirmed"

---

### 3. B2B AGENT APPROVAL DASHBOARD (Frontend)

#### 3.1 List Display
- [ ] **Loads Pending** - GET /api/approvals/pending/B2BAgent returns list
- [ ] **Table Columns** - Agent Name, Email, Commission Rate, KYC Status, Status, Date, Actions
- [ ] **Color Coding** - Pending=Yellow, Confirmed=Green, Suspended=Red
- [ ] **KYC Badge** - Verified=Green, Pending=Orange
- [ ] **Empty State** - "No pending approvals" shown when empty

#### 3.2 Approval Workflow
- [ ] **Review Button** - Click opens modal for pending agents
- [ ] **Modal Display** - Shows agent email, commission rate, KYC status
- [ ] **Approve Action** - Sends approval with optional notes
- [ ] **Reject Action** - Requires rejection reason
- [ ] **List Refresh** - Refreshes after action

#### 3.3 Agent-Specific Logic
- [ ] **Commission Rate Display** - Formatted as percentage
- [ ] **KYC Verification** - Boolean value shown as Verified/Pending

---

### 4. INVENTORY AUDIT DASHBOARD (Frontend)

#### 4.1 Summary Cards
- [ ] **Manual Allocations** - Count = entries with reason "manual_allocation"
- [ ] **Bookings** - Count = entries with reason "booking"
- [ ] **Cancellations** - Count = entries with reason "cancellation_release"
- [ ] **Amendments** - Count = entries with reason "amendment"
- [ ] **Blackouts** - Count = entries with reason "blackout_block"

#### 4.2 Filtering
- [ ] **Property ID Required** - No data loads without property ID
- [ ] **Date Range Optional** - Works with/without dates
- [ ] **Apply Filters** - Button triggers refresh with new filters
- [ ] **Filter Persistence** - Values persist while filtering

#### 4.3 Ledger Table
- [ ] **Columns Display** - Timestamp, Date, Room Type, Rate Plan, Delta, Reason, Actor, Booking ID
- [ ] **Color Coding Deltas** - Positive=Green (+1), Negative=Red (-2)
- [ ] **Reason Badges** - 5 colors (blue, green, orange, purple, red)
- [ ] **Actor Email** - User email who made change
- [ ] **Booking Links** - Booking ID links to booking detail (if present)

#### 4.4 Export
- [ ] **CSV Button** - Downloads ledger as CSV
- [ ] **CSV Format** - Columns match table, properly escaped
- [ ] **Filename** - inventory-ledger-YYYY-MM-DD.csv

#### 4.5 Edge Cases
- [ ] **Empty Results** - "No entries found" shown when no data
- [ ] **Large Result Sets** - Handles 1000+ entries gracefully
- [ ] **Date Parsing** - Dates display in locale format

---

### 5. BLACKOUT MANAGEMENT DASHBOARD (Frontend)

#### 5.1 Add Blackout Form
- [ ] **Form Hidden by Default** - Click "Add Blackout" to show
- [ ] **Date Pickers** - Start and End Date inputs
- [ ] **Reason Input** - Text field accepts any string
- [ ] **Create Button** - POST /rate-cards/:propertyId/:ratePlanId/blackout
- [ ] **Cancel Button** - Hides form without saving
- [ ] **Validation** - All fields required, alert if missing

#### 5.2 Blackout List
- [ ] **Displays Blackouts** - Shows all blackouts for rate plan
- [ ] **Card Layout** - Reason (heading), From/To dates, Days Blocked
- [ ] **Days Blocked Calculation** - (endDate - startDate) in days
- [ ] **Delete Button** - Removes blackout with confirmation
- [ ] **Delete Confirmation** - "Remove blackout: {reason}?" message
- [ ] **List Refresh** - Refreshes after add/delete

#### 5.3 Filters
- [ ] **Property ID** - Text input, required for actions
- [ ] **Rate Plan ID** - Text input, required for load
- [ ] **Auto-Load** - Loads blackouts when ratePlanId changes

#### 5.4 Info Box
- [ ] **Shows Blackout Behavior** - Explains precedence and blocking
- [ ] **Inventory Impact** - Explains ledger tracking

#### 5.5 Edge Cases
- [ ] **No Blackouts** - "No blackout periods configured" shown
- [ ] **Overlapping Blackouts** - Multiple overlaps displayed
- [ ] **Past Dates** - Can create blackout for past dates
- [ ] **Single-Day Blackout** - startDate = endDate is 1 day

---

### 6. FX RATE MANAGEMENT DASHBOARD (Frontend)

#### 6.1 Currency Selection
- [ ] **Dropdown Loaded** - GET /api/fx/currencies returns list
- [ ] **Default USD** - Defaults to USD
- [ ] **Dynamic Loading** - Rates refresh when currency changes
- [ ] **All Currencies Listed** - 7 default currencies shown

#### 6.2 Rates Table
- [ ] **From/To Columns** - Base and quote currencies
- [ ] **Rate Display** - "1 USD = X EUR" format
- [ ] **Source Badge** - "manual" (blue) or "api" (purple)
- [ ] **Freshness Indicator** - Hours ago, color-coded
- [ ] **Color Freshness** - Green <1h, Yellow <6h, Red >6h
- [ ] **Last Updated** - ISO timestamp
- [ ] **Edit Button** - Click populates form

#### 6.3 Update Rate Form
- [ ] **Form Hidden by Default** - Click edit or update button
- [ ] **Currency Selectors** - From and To currency dropdowns
- [ ] **Rate Input** - Number input, decimal places accepted
- [ ] **Rate Display** - "1 {from} = ____ {to}"
- [ ] **Update Button** - PUT /api/fx/rates/:base/:quote
- [ ] **Cancel Button** - Hides form
- [ ] **Validation** - Rate > 0, alert if invalid

#### 6.4 Refresh
- [ ] **Refresh Button** - Reloads all rates
- [ ] **Updates Freshness** - Hours-since-update recalculates

#### 6.5 Info Box
- [ ] **Explains Manual vs API** - How rates are updated
- [ ] **Snapshot Behavior** - Rates captured at booking time
- [ ] **Freshness Importance** - Why <1h is ideal

#### 6.6 Edge Cases
- [ ] **Negative Rates** - Validation rejects rate <= 0
- [ ] **No Rates Configured** - "No rates configured" shown
- [ ] **Same Currency Pair** - Error if from = to
- [ ] **Decimal Precision** - 6+ decimal places displayed

---

## 🧪 TEST SCENARIOS

### Scenario 1: Complete Booking Flow with Approval
1. Create Tenant A (pending approval)
2. Super Admin approves Tenant A → status confirmed
3. Tenant A tries to create booking
4. Booking passes all eligibility checks
5. Booking created atomically
6. Ledger entry created
7. FX snapshot captured (if multi-currency)
8. Audit log records all activity

**Expected Result:** Booking confirmed, ledger updated, audit trail complete

### Scenario 2: Booking Blocked by Blackout
1. Create blackout for 2026-07-20 to 2026-07-25
2. Try to book 2026-07-22 to 2026-07-24
3. Eligibility check fails (blackout detected)
4. Booking rejected with violation message
5. No ledger entry created
6. Audit log records failure

**Expected Result:** Booking rejected immediately, no system state changed

### Scenario 3: Concurrent Booking Under Load
1. Create rate plan with 5 available rooms
2. 10 concurrent bookings (1 room each) submitted simultaneously
3. Each uses SELECT...FOR UPDATE row lock
4. First 5 succeed, last 5 rejected (insufficient inventory)

**Expected Result:** Exactly 5 bookings created, 5 rejected, no overbooking

### Scenario 4: Multi-Currency Booking with Rate Change
1. Create booking: USD 1000 → EUR (rate 0.92)
2. Booking displays displayAmount = 920 EUR
3. FX rate changes to 0.95
4. Historical booking still shows 920 EUR (rate snapshot)
5. New booking uses 0.95 rate

**Expected Result:** Historical pricing preserved, new bookings use current rate

### Scenario 5: Agent Approval Workflow
1. Create B2B Agent (tenant context)
2. Tenant Admin sees pending approval
3. Tenant Admin reviews agent details
4. Tenant Admin approves with notes
5. Agent status → confirmed
6. Audit log records approval

**Expected Result:** Agent approved, audit trail created

---

## 📊 METRICS TO VERIFY

| Metric | Target | Method |
|--------|--------|--------|
| Booking Success Rate | 100% for eligible | Count successful/total |
| Overbooking Incidents | 0 | Verify availability never negative |
| Approval Time | < 5s | Measure UI response |
| Ledger Accuracy | 100% | Sum all deltas = current availability |
| FX Snapshot Coverage | 100% | Verify all bookings have snapshot |
| Audit Log Completeness | 100% | Every action logged |
| Dashboard Load Time | < 2s | Measure first paint |
| CSV Export Size | Reasonable | Check file size for 1000 entries |

---

## 🐛 KNOWN ISSUES TO VERIFY

- [ ] Confirmation number collision handling (rare but possible)
- [ ] Concurrent delete/update on same blackout period
- [ ] Very large date ranges (>1 year) in ledger query
- [ ] FX rate pair doesn't exist error handling
- [ ] Modal form validation edge cases

---

## ✨ PASS CRITERIA

✅ **All mandatory tests pass**  
✅ **No data corruption or state inconsistency**  
✅ **Audit trail captures all material changes**  
✅ **Error messages clear and actionable**  
✅ **Performance acceptable (<5s for any operation)**  
✅ **No security vulnerabilities**  

---

**Status:** Ready for Testing  
**Estimated Duration:** 4-6 hours  
**Tester:** QA Team / Product Owner  

