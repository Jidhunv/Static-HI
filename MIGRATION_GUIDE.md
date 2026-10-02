# Database Migration Guide - Two-Tier Settlement Model

## Overview

This migration adds support for the **two-tier settlement model** where:
- **Tier 1**: Platform pays Distributors (seller settlement)
- **Tier 2**: Distributors pay Hotel Owners (inter-supplier settlement)

## Migration Files

- **Migration SQL**: `packages/db/prisma/migrations/001_add_two_tier_settlement_model.sql`
- **Schema Updates**: `packages/db/prisma/schema.prisma`

## Changes Summary

### 1. Settlement Table - New Fields

#### Tier 1 & 2 Identification
```sql
settlementType VARCHAR -- 'seller' | 'inter_supplier'
```

#### Tier 2 Settlement (Distributor → Hotel)
```sql
payerTenantId      VARCHAR  -- Who pays (distributor)
payeeTenantId      VARCHAR  -- Who receives (hotel owner)
dueDate            TIMESTAMP -- Payment deadline
```

#### Settlement Tracking
```sql
bookingReference   VARCHAR  -- Links to booking ID
retryCount         INTEGER  -- Failed payment retries
paidDate           TIMESTAMP -- When actually paid
terminatedAt       TIMESTAMP -- Partnership termination
```

### 2. RevenueTransaction Table - New Fields

```sql
sellerSettlementId        VARCHAR  -- Link to Tier 1 settlement
interSupplierSettlementId VARCHAR  -- Link to Tier 2 settlement
```

### 3. SupplierPartnership Table - New Fields

```sql
terminatedAt TIMESTAMP -- When partnership was terminated
```

### 4. New Indexes

Created for performance optimization:

```sql
-- Settlement indexes
Settlement_settlementType_idx
Settlement_payerTenantId_idx
Settlement_payeeTenantId_idx
Settlement_dueDate_idx
Settlement_bookingReference_idx
Settlement_payerPayee_idx (composite)
Settlement_dueDate_status_idx (filtered for inter_supplier)

-- RevenueTransaction indexes
RevenueTransaction_sellerSettlementId_idx
RevenueTransaction_interSupplierSettlementId_idx
```

## How to Apply the Migration

### Option 1: Using Prisma CLI

```bash
cd packages/db

# Generate new migration from schema changes
npx prisma migrate dev --name add_two_tier_settlement_model

# This will:
# 1. Detect schema changes
# 2. Create a migration
# 3. Apply it to local database
# 4. Generate Prisma Client
```

### Option 2: Manual SQL Application

```bash
# Connect to your PostgreSQL database
psql -U your_user -d your_database

# Apply the migration SQL
\i packages/db/prisma/migrations/001_add_two_tier_settlement_model.sql

# Verify changes
\d "Settlement"
\d "RevenueTransaction"
```

### Option 3: Using Migration Tool

```bash
# From project root
npm run prisma:migrate

# Or with specific migration name
npm run prisma:migrate -- add_two_tier_settlement_model
```

## Database Schema Changes

### Settlement Table - Before
```
id (PK)
tenantId (FK)
settlementPeriod
settlementDate
totalCredit
totalDeductions
netAmount
status
paymentReference
transactionCount
createdAt
updatedAt
```

### Settlement Table - After
```
id (PK)
tenantId (FK)
supplierId (alias)
settlementType         [NEW] - Identifies tier 1 or 2
payerTenantId         [NEW] - Distributor (tier 2)
payeeTenantId         [NEW] - Hotel owner (tier 2)
settlementPeriod
settlementDate
totalCredit
totalDeductions
netAmount
totalAmount           [NEW] - Flexibility field
status
paymentReference
paidDate              [NEW] - Actual payment date
retryCount            [NEW] - Retry tracking
bookingReference      [NEW] - Links to booking
dueDate               [NEW] - Payment deadline (tier 2)
transactionCount
invoiceId
createdAt
updatedAt
```

### RevenueTransaction Table - New Fields
```
sellerSettlementId        [NEW]
interSupplierSettlementId [NEW]
```

## Backward Compatibility

### Default Values
- `settlementType` defaults to `'seller'` for existing settlements
- `retryCount` defaults to `0`
- `payerTenantId` & `payeeTenantId` are nullable (only for tier 2)

### Existing Data
The migration is **non-breaking**:
- Existing settlement records continue to work
- New fields are optional/nullable
- Queries filtering by `status` still work (no change to existing statuses)

### Status Values

**Before:**
- pending
- processed
- paid
- failed

**After (with new tier support):**
- `pending_seller` - Tier 1 awaiting platform payout
- `completed_seller` - Tier 1 paid by platform
- `pending_inter_supplier` - Tier 2 awaiting distributor payment
- `completed_inter_supplier` - Tier 2 paid by distributor
- `overdue` - Tier 2 past due date
- `failed` - Payment failed

## Verification Steps

After applying migration:

### 1. Check Table Structure
```sql
-- View Settlement table
\d "Settlement"

-- Expected new columns:
-- settlementType, payerTenantId, payeeTenantId, dueDate, 
-- bookingReference, paidDate, retryCount

-- View RevenueTransaction table
\d "RevenueTransaction"

-- Expected new columns:
-- sellerSettlementId, interSupplierSettlementId
```

### 2. Verify Indexes
```sql
-- List all indexes on Settlement
SELECT * FROM pg_indexes 
WHERE tablename = 'Settlement' 
AND indexname LIKE '%Settlement%';

-- Expected indexes:
-- Settlement_settlementType_idx
-- Settlement_payerTenantId_idx
-- Settlement_payeeTenantId_idx
-- Settlement_dueDate_idx
-- etc.
```

### 3. Test Queries
```sql
-- Find seller settlements
SELECT * FROM "Settlement" 
WHERE "settlementType" = 'seller' 
AND "status" = 'pending_seller' 
LIMIT 10;

-- Find inter-supplier settlements owed to hotel
SELECT * FROM "Settlement" 
WHERE "payeeTenantId" = 'hotel_123' 
AND "settlementType" = 'inter_supplier' 
AND "status" IN ('pending_inter_supplier', 'overdue');

-- Find overdue payments
SELECT * FROM "Settlement" 
WHERE "dueDate" < NOW() 
AND "status" = 'pending_inter_supplier';
```

### 4. Validate Data Integrity
```sql
-- Check for orphaned references
SELECT COUNT(*) as orphaned 
FROM "RevenueTransaction" rt
WHERE rt."sellerSettlementId" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "Settlement" s 
  WHERE s.id = rt."sellerSettlementId"
);

-- Should return 0 rows
```

## Rollback Procedure

If you need to rollback the migration:

### Using Prisma
```bash
cd packages/db

# Rollback last migration
npx prisma migrate resolve --rolled-back 001_add_two_tier_settlement_model

# Manually create rollback
npx prisma migrate diff --from-migrations --to-schema-datasource --script
```

### Manual Rollback SQL
```sql
-- Drop new indexes
DROP INDEX IF EXISTS "Settlement_settlementType_idx";
DROP INDEX IF EXISTS "Settlement_payerTenantId_idx";
DROP INDEX IF EXISTS "Settlement_payeeTenantId_idx";
DROP INDEX IF EXISTS "Settlement_dueDate_idx";
DROP INDEX IF EXISTS "Settlement_bookingReference_idx";
DROP INDEX IF EXISTS "Settlement_payerPayee_idx";
DROP INDEX IF EXISTS "Settlement_dueDate_status_idx";
DROP INDEX IF EXISTS "RevenueTransaction_sellerSettlementId_idx";
DROP INDEX IF EXISTS "RevenueTransaction_interSupplierSettlementId_idx";

-- Remove new columns from Settlement
ALTER TABLE "Settlement" 
  DROP COLUMN IF EXISTS "settlementType",
  DROP COLUMN IF EXISTS "payerTenantId",
  DROP COLUMN IF EXISTS "payeeTenantId",
  DROP COLUMN IF EXISTS "dueDate",
  DROP COLUMN IF EXISTS "bookingReference",
  DROP COLUMN IF EXISTS "retryCount",
  DROP COLUMN IF EXISTS "paidDate",
  DROP COLUMN IF EXISTS "totalAmount",
  DROP COLUMN IF EXISTS "invoiceId";

-- Remove new columns from RevenueTransaction
ALTER TABLE "RevenueTransaction" 
  DROP COLUMN IF EXISTS "sellerSettlementId",
  DROP COLUMN IF EXISTS "interSupplierSettlementId";

-- Remove new column from SupplierPartnership
ALTER TABLE "SupplierPartnership" 
  DROP COLUMN IF EXISTS "terminatedAt";
```

## Performance Considerations

### Index Performance
- All new indexes support WHERE clauses and JOIN operations
- Composite index `Settlement_payerPayee_idx` optimizes distributor/hotel queries
- Filtered index `Settlement_dueDate_status_idx` speeds up overdue detection

### Query Optimization Tips
```sql
-- Good: Uses indexed columns
SELECT * FROM "Settlement" 
WHERE "settlementType" = 'inter_supplier' 
AND "status" = 'pending_inter_supplier' 
AND "dueDate" < NOW()
ORDER BY "dueDate" ASC;

-- Better: More specific filter
SELECT * FROM "Settlement" 
WHERE "payeeTenantId" = $1 
AND "settlementType" = 'inter_supplier' 
AND "status" IN ('pending_inter_supplier', 'overdue')
ORDER BY "dueDate" ASC;
```

## Testing the Migration

### Unit Tests
```typescript
describe('Settlement Chain Service', () => {
  it('should create seller settlement', async () => {
    const settlement = await settleService.executeSettlementChain({
      bookingId: 'BOOK-001',
      guestPaid: 875,
      sellerTenantId: 'distributor_b',
      inventoryOwnerTenantId: 'hotel_a',
      netRate: 150,
      nights: 5,
      commissionPct: 15,
    });
    
    expect(settlement.seller_settlement.status).toBe('pending_seller');
    expect(settlement.inter_supplier_settlement.status).toBe('pending_inter_supplier');
  });
});
```

### Integration Tests
```typescript
// Test the complete settlement chain
const booking = await createTestBooking();
const chain = await executeSettlementChain(booking);

// Verify Tier 1
const tier1 = await getSettlement(chain.seller_settlement.settlementId);
expect(tier1.settlementType).toBe('seller');
expect(tier1.status).toBe('pending_seller');

// Verify Tier 2
const tier2 = await getSettlement(chain.inter_supplier_settlement.settlementId);
expect(tier2.settlementType).toBe('inter_supplier');
expect(tier2.payerTenantId).toBe(chain.seller_settlement.sellerTenantId);
expect(tier2.payeeTenantId).toBe(chain.inter_supplier_settlement.payeeTenantId);
```

## Post-Migration Tasks

1. **Update API Documentation**
   - Add new settlement endpoint examples
   - Document two-tier settlement flow

2. **Update Admin Dashboard**
   - Add settlement status filters
   - Show Tier 1 and Tier 2 separately
   - Highlight overdue payments

3. **Update Monitoring**
   - Monitor settlement_type distribution
   - Alert on overdue inter_supplier settlements
   - Track paidDate SLAs

4. **Data Migration** (if needed)
   ```sql
   -- Mark all existing settlements as 'seller' type
   UPDATE "Settlement" 
   SET "settlementType" = 'seller' 
   WHERE "settlementType" IS NULL;
   ```

5. **Backup**
   - Take database snapshot before migration
   - Keep backup for 30 days post-migration

## Support

For issues during migration:

1. Check migration logs: `cat .prisma/logs/migration.log`
2. Verify schema with `npx prisma db pull`
3. Check pending migrations: `npx prisma migrate status`
4. Create data backup before proceeding
5. Test in staging environment first

## Timeline

| Phase | Duration | Action |
|-------|----------|--------|
| Preparation | 1 day | Backup data, review migration |
| Staging Test | 1-2 days | Apply to staging, test queries |
| Production | 1 hour | Apply to production, verify |
| Monitoring | 7 days | Monitor performance, check for issues |
| Optimization | 2 weeks | Fine-tune indexes if needed |

---

**Migration Date**: [Enter date]  
**Applied By**: [Enter name]  
**Verified By**: [Enter name]  
**Rollback Plan**: [Link to rollback procedure]
