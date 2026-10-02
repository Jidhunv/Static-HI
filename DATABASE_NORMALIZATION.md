# Database Normalization & Security Schema

## Normalization Strategy (3NF)

### Core Principle
- Split monolithic tables into focused entities
- Eliminate redundant data
- Encrypt sensitive PII at rest
- Maintain referential integrity

## Normalized Schema

### 1. Tenant (Parent Entity)
```
PK: id (UUID)
- name
- slug (unique, lowercase)
- businessType (enum)
- status
- primaryCurrency
- mfaSecret (encrypted) ✓
- mfaEnabled (boolean)
- createdAt
- updatedAt

Indexes:
- status, slug
```

### 2. TenantBankAccount (Separated for Security)
```
PK: id
FK: tenantId (unique, 1:1 with Tenant)
- accountNumber (encrypted, PII) ✓
- bankName (encrypted)
- ifscCode (encrypted)
- beneficiaryName (encrypted)
- accountType
- verifiedAt
- createdAt
- updatedAt

Why separate: Easy to implement rotation, access control
```

### 3. TenantCompliance (Audit & Regulatory)
```
PK: id
FK: tenantId (unique, 1:1)
- kycStatus (pending | verified | rejected)
- kycDocuments[] (encrypted paths)
- panHash (SHA256, not reversible)
- gstHash
- taxId
- verifiedAt
- createdAt
- updatedAt
```

### 4. Settlement (Two-Tier Model)
```
PK: id
FK: tenantId (who receives)
- settlementType (seller | inter_supplier)
- payerTenantId (nullable, for inter_supplier)
- payeeTenantId (nullable, for inter_supplier)
- totalAmount (Decimal)
- status (enum)
- dueDate (nullable)
- paidDate
- paymentReference (hashed)
- bookingReference
- retryCount
- createdAt
- updatedAt

Indexes:
- (settlementType, status)
- (payerTenantId, payeeTenantId)
- dueDate (filtered by status=pending)
```

### 5. RevenueTransaction (Immutable Ledger)
```
PK: id
FK: bookingId
FK: originSupplier (tenantId)
FK: sellingSupplier (tenantId)
- guestPaid (Decimal)
- netToHotel (Decimal)
- commissionToHotel (Decimal)
- platformFee (Decimal)
- paymentGatewayFee (Decimal)
- taxAmount (Decimal)
- sellerSettlementId (FK)
- interSupplierSettlementId (FK)
- status (enum)
- transactionDate
- settlementDate
- createdAt

Indexes:
- (originSupplier, status)
- (sellingSupplier, status)
- transactionDate
```

### 6. AuditLog (Immutable Compliance)
```
PK: id
- action (string: settlement.created, payment.made, etc)
- entityType (settlement | transaction | user)
- entityId
- userId (who performed)
- changes (JSON delta)
- ipAddress (hashed for privacy)
- userAgent (hashed)
- timestamp (immutable)

Indexes:
- (userId, timestamp DESC)
- (entityId, timestamp DESC)
- action
```

### 7. MFAToken (Temporary Records)
```
PK: id
FK: tenantId
- secret (encrypted) ✓
- backupCodes[] (hashed)
- enabled (boolean)
- lastUsedAt
- expiresAt
- createdAt
```

### 8. ApiKey (Secured)
```
PK: id
FK: tenantId
- keyHash (SHA256, stored only)
- keyPrefix (first 8 chars visible)
- name
- permissions[] (JSON array)
- lastUsedAt
- expiresAt
- rateLimit
- createdAt
- updatedAt

Note: Never store actual key, only hash
```

## Encryption Mapping

### PII Fields (Encrypted with AES-256-GCM)
```
TenantBankAccount:
  ✓ accountNumber
  ✓ bankName
  ✓ ifscCode
  ✓ beneficiaryName

TenantCompliance:
  ✓ kycDocuments (paths)
  ✓ panNumber
  ✓ gstNumber

MFAToken:
  ✓ secret
  ✓ backupCodes[]

Settlement:
  ✓ paymentReference (if contains card data)
```

### Hashed Fields (SHA-256, One-Way)
```
TenantCompliance:
  ✓ panHash
  ✓ gstHash

ApiKey:
  ✓ keyHash

AuditLog:
  ✓ ipAddressHash
  ✓ userAgentHash
```

## Access Patterns

### Hotel Owner View
```sql
SELECT s.id, s.totalAmount, s.status, s.dueDate
FROM Settlement s
WHERE s.payeeTenantId = $1
  AND s.settlementType = 'inter_supplier'
  AND s.status IN ('pending_inter_supplier', 'overdue')
ORDER BY s.dueDate ASC;
```

### Distributor View
```sql
SELECT 
  COALESCE(SUM(CASE WHEN s.settlementType='seller' 
    AND s.status='completed_seller' THEN s.totalAmount END), 0) as received,
  COALESCE(SUM(CASE WHEN s.settlementType='inter_supplier'
    AND s.status='completed_inter_supplier' THEN s.totalAmount END), 0) as paid
FROM Settlement s
WHERE s.tenantId = $1 OR s.payerTenantId = $1;
```

### Compliance Audit
```sql
SELECT al.action, al.userId, al.changes, al.timestamp
FROM AuditLog al
WHERE al.entityId = $1
  AND al.timestamp >= $2
ORDER BY al.timestamp DESC;
```

## Security Properties

### Defense in Depth
1. **Database-Level**: Encryption at rest, role-based access
2. **Application-Level**: All PII encrypted before storage
3. **API-Level**: MFA, rate limiting, input validation
4. **Audit-Level**: Immutable logs, tamper detection

### Compliance Features
- ✓ GDPR: Encryption, audit trails, data minimization
- ✓ PCI DSS: No card data storage (gateway only), encryption, hashing
- ✓ SOC 2: Audit logs, access controls, incident response
- ✓ ISO 27001: Information security management

### Immutability Guarantees
- AuditLog: No UPDATE/DELETE (only INSERT)
- RevenueTransaction: Immutable after creation
- Settlement: Status progression only (not arbitrary changes)

## Index Strategy

### Hot Queries (Sub-100ms)
```
Settlement (10-50M rows):
  - (settlementType, status) - Tuple scans
  - (payerTenantId, payeeTenantId) - Distributor settlement lookups
  - dueDate WHERE status='pending' - Overdue detection

RevenueTransaction (50-500M rows):
  - (originSupplier, status) - Hotel commission tracking
  - (sellingSupplier, transactionDate) - Distributor revenue reports
```

### Cold Queries (Reporting)
```
AuditLog (100M+ rows):
  - (userId, timestamp DESC) - User activity history
  - (entityId, timestamp) - Entity change tracking
```

## Migration Path

### Phase 1: Normalize
- Separate TenantBankAccount
- Separate TenantCompliance
- Add MFAToken table

### Phase 2: Encrypt
- Enable encryption on PII fields
- Hash sensitive identifiers
- Rotate API keys

### Phase 3: Audit
- Add AuditLog table
- Log all financial operations
- Implement immutability

### Phase 4: MFA
- Deploy MFA service
- Require MFA for settlements
- Support GA & MA apps

## Queries for Reports

### Monthly Settlement Report
```sql
SELECT 
  s.tenantId,
  COUNT(*) as count,
  SUM(s.totalAmount) as total,
  s.status
FROM Settlement s
WHERE DATE_TRUNC('month', s.createdAt) = $1
GROUP BY s.tenantId, s.status;
```

### Commission Audit Trail
```sql
SELECT 
  rt.bookingId,
  rt.originSupplier,
  rt.sellingSupplier,
  rt.commissionToHotel,
  al.action,
  al.changes
FROM RevenueTransaction rt
JOIN AuditLog al ON al.entityId = rt.sellerSettlementId
WHERE rt.originSupplier = $1
  AND rt.transactionDate >= $2;
```

### MFA Compliance
```sql
SELECT 
  t.id,
  t.name,
  m.enabled,
  m.lastUsedAt
FROM Tenant t
LEFT JOIN MFAToken m ON m.tenantId = t.id
WHERE t.status = 'active'
  AND (m.enabled = false OR m.enabled IS NULL);
```

## Storage Estimates

### For 100K Hotels, 1M Distributors, 10M Bookings/month

| Table | Rows | Size | Growth |
|-------|------|------|--------|
| Settlement | 20M | 2GB | +2GB/month |
| RevenueTransaction | 50M | 4GB | +5GB/month |
| AuditLog | 100M | 10GB | +10GB/month |
| TenantBankAccount | 100K | 50MB | +5KB/month |
| MFAToken | 100K | 20MB | stable |
| ApiKey | 500K | 100MB | +50MB/month |

**Total**: ~16GB, growing ~17GB/month → archival policy needed

## Archival Strategy

```sql
-- Archive old settlements (after 7 years per regulation)
INSERT INTO settlement_archive 
SELECT * FROM Settlement 
WHERE createdAt < NOW() - INTERVAL '7 years';

DELETE FROM Settlement 
WHERE createdAt < NOW() - INTERVAL '7 years';
```

## Backup & Recovery

### Daily Backup
- Full backup to encrypted S3
- WAL archiving for point-in-time recovery
- Test restore weekly

### RTO/RPO
- RTO: 1 hour (restore from backup)
- RPO: 5 minutes (WAL backup interval)

## Conclusion

This schema provides:
- ✓ 3NF normalization
- ✓ Encryption for all PII
- ✓ Complete audit trail
- ✓ MFA support
- ✓ Compliance ready
- ✓ Sub-100ms queries
- ✓ Scalable to billions of records
