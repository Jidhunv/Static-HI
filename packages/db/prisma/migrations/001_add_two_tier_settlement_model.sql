-- Add columns to Settlement table for two-tier settlement model
ALTER TABLE "Settlement" ADD COLUMN "settlementType" TEXT DEFAULT 'seller';
-- Values: 'seller' (Platform → Distributor), 'inter_supplier' (Distributor → Hotel Owner)

ALTER TABLE "Settlement" ADD COLUMN "payerTenantId" TEXT;
-- For inter_supplier settlements: tenant ID of the payer (distributor)

ALTER TABLE "Settlement" ADD COLUMN "payeeTenantId" TEXT;
-- For inter_supplier settlements: tenant ID of the payee (hotel owner)

ALTER TABLE "Settlement" ADD COLUMN "dueDate" TIMESTAMP(3);
-- For inter_supplier settlements: payment due date (typically 15 days)

ALTER TABLE "Settlement" ADD COLUMN "bookingReference" TEXT;
-- Reference to booking ID that triggered the settlement

ALTER TABLE "Settlement" ADD COLUMN "retryCount" INTEGER DEFAULT 0;
-- Track retry attempts for failed settlements

ALTER TABLE "Settlement" ADD COLUMN "paidDate" TIMESTAMP(3);
-- When settlement was actually paid

-- Add indexes for two-tier settlement queries
CREATE INDEX "Settlement_settlementType_idx" ON "Settlement"("settlementType");
CREATE INDEX "Settlement_payerTenantId_idx" ON "Settlement"("payerTenantId");
CREATE INDEX "Settlement_payeeTenantId_idx" ON "Settlement"("payeeTenantId");
CREATE INDEX "Settlement_dueDate_idx" ON "Settlement"("dueDate");
CREATE INDEX "Settlement_bookingReference_idx" ON "Settlement"("bookingReference");

-- Add columns to RevenueTransaction for settlement tracking
ALTER TABLE "RevenueTransaction" ADD COLUMN "sellerSettlementId" TEXT;
-- Link to Tier 1 settlement (Platform → Distributor)

ALTER TABLE "RevenueTransaction" ADD COLUMN "interSupplierSettlementId" TEXT;
-- Link to Tier 2 settlement (Distributor → Hotel Owner)

-- Add indexes for settlement tracking
CREATE INDEX "RevenueTransaction_sellerSettlementId_idx" ON "RevenueTransaction"("sellerSettlementId");
CREATE INDEX "RevenueTransaction_interSupplierSettlementId_idx" ON "RevenueTransaction"("interSupplierSettlementId");

-- Add column to SupplierPartnership for termination tracking
ALTER TABLE "SupplierPartnership" ADD COLUMN "terminatedAt" TIMESTAMP(3);

-- Create composite index for inter-supplier settlement queries
CREATE INDEX "Settlement_payerPayee_idx" ON "Settlement"("payerTenantId", "payeeTenantId", "status");

-- Create index for overdue settlement detection
CREATE INDEX "Settlement_dueDate_status_idx" ON "Settlement"("dueDate", "status") WHERE "settlementType" = 'inter_supplier';

-- Add comment explaining settlement types
COMMENT ON COLUMN "Settlement"."settlementType" IS 'seller: Platform→Distributor, inter_supplier: Distributor→Hotel';
COMMENT ON COLUMN "Settlement"."payerTenantId" IS 'For inter_supplier: who pays the commission';
COMMENT ON COLUMN "Settlement"."payeeTenantId" IS 'For inter_supplier: who receives the commission';
COMMENT ON COLUMN "Settlement"."dueDate" IS 'For inter_supplier: payment due date (typically 15 days after booking)';
