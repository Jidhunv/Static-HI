-- ============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- Enforces tenant isolation at the database layer.
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyPhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyBankDetail" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Room" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoomPhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RatePlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarRate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CancellationPolicy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CancellationPolicyTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChargeRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Promotion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PromotionRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupplierDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupplierOffice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateMarkup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DistributionGrant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateBreakdown" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Global / platform-level tables are NOT scoped — no RLS policies needed

-- ============================================================================
-- TENANT-SCOPED TABLE POLICIES
-- Pattern: Users can only access rows where tenant_id matches their session
-- ============================================================================

-- Tenant: tenants can read their own record
CREATE POLICY "Tenant_read_own" ON "Tenant"
  FOR SELECT USING (id = current_setting('app.tenant_id', true)::text);

CREATE POLICY "Tenant_insert_denied" ON "Tenant"
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Tenant_update_own" ON "Tenant"
  FOR UPDATE USING (id = current_setting('app.tenant_id', true)::text);

-- TenantUser: can only read users in their own tenant
CREATE POLICY "TenantUser_read_own_tenant" ON "TenantUser"
  FOR SELECT USING (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "TenantUser_insert_own_tenant" ON "TenantUser"
  FOR INSERT WITH CHECK (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "TenantUser_update_own_tenant" ON "TenantUser"
  FOR UPDATE USING (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

-- TenantSettings: scoped to tenant_id
CREATE POLICY "TenantSettings_read_own_tenant" ON "TenantSettings"
  FOR SELECT USING (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "TenantSettings_upsert_own_tenant" ON "TenantSettings"
  FOR INSERT WITH CHECK (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "TenantSettings_update_own_tenant" ON "TenantSettings"
  FOR UPDATE USING (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

-- Property: all property operations scoped to tenant_id
CREATE POLICY "Property_read_own_tenant" ON "Property"
  FOR SELECT USING (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "Property_insert_own_tenant" ON "Property"
  FOR INSERT WITH CHECK (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "Property_update_own_tenant" ON "Property"
  FOR UPDATE USING (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

-- PropertyPhoto: cascades through Property tenant_id check
CREATE POLICY "PropertyPhoto_read_own_tenant" ON "PropertyPhoto"
  FOR SELECT USING (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "PropertyPhoto_insert_own_tenant" ON "PropertyPhoto"
  FOR INSERT WITH CHECK (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

-- PropertyDocument: same cascading pattern
CREATE POLICY "PropertyDocument_read_own_tenant" ON "PropertyDocument"
  FOR SELECT USING (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "PropertyDocument_insert_own_tenant" ON "PropertyDocument"
  FOR INSERT WITH CHECK (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

-- PropertyBankDetail: CRITICAL — bank details must NEVER leak to other tenants
CREATE POLICY "PropertyBankDetail_read_own_tenant" ON "PropertyBankDetail"
  FOR SELECT USING (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "PropertyBankDetail_insert_own_tenant" ON "PropertyBankDetail"
  FOR INSERT WITH CHECK (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "PropertyBankDetail_update_own_tenant" ON "PropertyBankDetail"
  FOR UPDATE USING (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

-- Room, RatePlan, CalendarRate, CancellationPolicy, ChargeRule: all cascade through Property
-- (abbreviated pattern below; apply same logic to each)

CREATE POLICY "Room_read_own_tenant" ON "Room"
  FOR SELECT USING (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "Room_insert_own_tenant" ON "Room"
  FOR INSERT WITH CHECK (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "RatePlan_read_own_tenant" ON "RatePlan"
  FOR SELECT USING (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "RatePlan_insert_own_tenant" ON "RatePlan"
  FOR INSERT WITH CHECK (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "CalendarRate_read_own_tenant" ON "CalendarRate"
  FOR SELECT USING (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "CalendarRate_insert_own_tenant" ON "CalendarRate"
  FOR INSERT WITH CHECK (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "CancellationPolicy_read_own_tenant" ON "CancellationPolicy"
  FOR SELECT USING (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "ChargeRule_read_own_tenant" ON "ChargeRule"
  FOR SELECT USING (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "Promotion_read_own_tenant" ON "Promotion"
  FOR SELECT USING (
    "propertyId" IN (
      SELECT id FROM "Property" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "Supplier_read_own_tenant" ON "Supplier"
  FOR SELECT USING (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "Supplier_insert_own_tenant" ON "Supplier"
  FOR INSERT WITH CHECK (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "SupplierDocument_read_own_tenant" ON "SupplierDocument"
  FOR SELECT USING (
    "supplierId" IN (
      SELECT id FROM "Supplier" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

CREATE POLICY "SupplierOffice_read_own_tenant" ON "SupplierOffice"
  FOR SELECT USING (
    "supplierId" IN (
      SELECT id FROM "Supplier" WHERE "tenantId" = current_setting('app.tenant_id', true)::text
    )
  );

-- RateMarkup: can only manage their own markups
CREATE POLICY "RateMarkup_read_own_tenant" ON "RateMarkup"
  FOR SELECT USING (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "RateMarkup_insert_own_tenant" ON "RateMarkup"
  FOR INSERT WITH CHECK (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

-- DistributionGrant: outgoing or incoming to this tenant
CREATE POLICY "DistributionGrant_read_own_tenant" ON "DistributionGrant"
  FOR SELECT USING (
    "sourceTenantId" = current_setting('app.tenant_id', true)::text
    OR "targetTenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "DistributionGrant_insert_own_tenant" ON "DistributionGrant"
  FOR INSERT WITH CHECK (
    "sourceTenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "DistributionGrant_update_source" ON "DistributionGrant"
  FOR UPDATE USING (
    "sourceTenantId" = current_setting('app.tenant_id', true)::text
  );

-- Booking: can read if source or reseller
CREATE POLICY "Booking_read_own_tenant" ON "Booking"
  FOR SELECT USING (
    "sourceTenantId" = current_setting('app.tenant_id', true)::text
    OR "resellerTenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "Booking_insert_own_tenant" ON "Booking"
  FOR INSERT WITH CHECK (
    "sourceTenantId" = current_setting('app.tenant_id', true)::text
    OR "resellerTenantId" = current_setting('app.tenant_id', true)::text
  );

-- BookingItem: cascades through Booking
CREATE POLICY "BookingItem_read_own_tenant" ON "BookingItem"
  FOR SELECT USING (
    "bookingId" IN (
      SELECT id FROM "Booking"
      WHERE "sourceTenantId" = current_setting('app.tenant_id', true)::text
      OR "resellerTenantId" = current_setting('app.tenant_id', true)::text
    )
  );

-- RateBreakdown: cascades through Booking
CREATE POLICY "RateBreakdown_read_own_tenant" ON "RateBreakdown"
  FOR SELECT USING (
    "bookingId" IN (
      SELECT id FROM "Booking"
      WHERE "sourceTenantId" = current_setting('app.tenant_id', true)::text
      OR "resellerTenantId" = current_setting('app.tenant_id', true)::text
    )
  );

-- Payment: cascades through Booking
CREATE POLICY "Payment_read_own_tenant" ON "Payment"
  FOR SELECT USING (
    "bookingId" IN (
      SELECT id FROM "Booking"
      WHERE "sourceTenantId" = current_setting('app.tenant_id', true)::text
      OR "resellerTenantId" = current_setting('app.tenant_id', true)::text
    )
  );

-- AuditLog: only access logs for your own tenant
CREATE POLICY "AuditLog_read_own_tenant" ON "AuditLog"
  FOR SELECT USING (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );

CREATE POLICY "AuditLog_insert_own_tenant" ON "AuditLog"
  FOR INSERT WITH CHECK (
    "tenantId" = current_setting('app.tenant_id', true)::text
  );
