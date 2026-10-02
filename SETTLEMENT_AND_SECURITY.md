# Settlement and Security

What the two-tier settlement and MFA code does today, what has been verified, and what is still missing.
This replaces the earlier audit, migration, normalization, transformation and production-guide documents,
whose ratings and measurements were never backed by tests.

## Not production ready

The system records who owes whom. It does not move money, and it has not had a security review or
penetration test. See [Known gaps](#known-gaps) before exposing it publicly.

## Two-tier settlement

When a distributor (seller) sells another supplier's inventory, two settlements are created for the booking:

| Tier | Type | Payer | Receiver | Marked paid by |
|------|------|-------|----------|----------------|
| 1 | `seller` | Platform | Selling supplier | Platform admin |
| 2 | `inter_supplier` | Selling supplier | Inventory owner | Selling supplier's user |

### Amounts

The guest total is read from the booking record, never from the request.

- Platform fee = 2% of the guest total, gateway fee = 3% (constants in `settlement.math.ts`)
- Seller receives = guest total − fees
- Seller owes owner = owner's net amount + commission % of that net amount

Example: guest pays $875, owner net $750, commission 5%.

| Item | Amount |
|------|--------|
| Platform fee | $17.50 |
| Gateway fee | $26.25 |
| Seller receives (tier 1) | $831.25 |
| Seller owes owner (tier 2) | $787.50 |

Creation is rejected if the seller would owe more than it receives.

**Open question:** "net plus commission" follows the existing `CommissionService`. The first version of the
settlement code paid the owner only the commission. Confirm which rule the business wants.

### Statuses

`pending` → `paid`. Tier 2 becomes `overdue` if unpaid 15 days after creation (daily job at 01:00); an
overdue settlement can still be paid. Marking tier 2 paid also marks the booking's revenue transaction
`settled`, which is what monthly invoices are built from.

### Endpoints

Base: `http://localhost:3001/api/v1`. All require `Authorization: Bearer <login token>` (a user or admin
login token, not an API key). Routes marked MFA also require an `x-mfa-code` header.

| Method | Route | Who | MFA | Purpose |
|--------|-------|-----|-----|---------|
| POST | `/settlements` | Platform admin | yes | Create both settlements for a booking |
| PUT | `/settlements/:id/seller-paid` | Platform admin | yes | Record that the platform paid the seller |
| PUT | `/settlements/:id/inter-supplier-paid` | Seller's user | yes | Record that the seller paid the owner |
| GET | `/settlements/receivable` | Tenant user | no | Open amounts other suppliers owe you |
| GET | `/settlements/payable` | Tenant user | no | Open amounts you owe inventory owners |
| GET | `/settlements/summary` | Tenant user | no | Totals: received, paid out, receivable, payable |

Create body:

```json
{
  "bookingId": "…",
  "sellerTenantId": "…",
  "ownerTenantId": "…",
  "ownerNetAmount": 750,
  "commissionPct": 5,
  "inventoryVisibilityId": "optional"
}
```

Mark-paid body: `{ "paymentReference": "ACH-2026-10-001" }`.

Safeguards:

- One settlement of each type per booking (database unique constraint); a second create returns 409.
- A settlement can be marked paid once; the status check and update are a single statement.
- A tenant user can only pay settlements where their tenant is the payer.
- Create and both mark-paid actions write to the existing `AuditLog` table.

## Multi-factor authentication

TOTP (RFC 6238: SHA-1, 6 digits, 30 seconds), which Google Authenticator and Microsoft Authenticator both
support. Implemented with Node's `crypto`; no extra packages. Available to tenant users and platform admins.

| Method | Route | Body | Result |
|--------|-------|------|--------|
| POST | `/auth/mfa/setup` | – | `secret` and `otpauthUrl` (render the URL as a QR code in the frontend) |
| POST | `/auth/mfa/enable` | `{ "code": "123456" }` | Turns MFA on; returns 10 backup codes, shown once |
| POST | `/auth/mfa/disable` | `{ "code": "…" }` | Turns MFA off |

Behaviour:

- The MFA guard fails closed: if MFA is not enabled for the caller, or the code is missing or wrong, the
  request gets 403.
- Each TOTP code is accepted once. A user can therefore do one MFA-protected action per 30 seconds; backup
  codes work in between.
- Backup codes are single use and stored as SHA-256 hashes.
- The TOTP secret is stored encrypted with AES-256-GCM.
- MFA is only enforced on the three settlement write routes. Login itself does not ask for a code.

## Configuration

`ENCRYPTION_KEY` must be set in `apps/api/.env` to 64 hex characters. Without it, MFA setup fails with a
clear error (there is no fallback key). Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Losing or changing the key makes existing MFA secrets unreadable; affected users would need MFA reset in
the database.

## Database

The project has no migration history; the schema is applied with:

```bash
pnpm --filter @hotel/db db:push
```

Added by this work:

- `SupplierSettlement` (the settlements above). The older `Settlement` model for B2B agents is unchanged.
- `SupplierPartnership`, `InventoryVisibility`, `SupplierCommissionRule`, `RevenueTransaction`,
  `SupplierInvoice`.
- `mfaEnabled`, `mfaSecret`, `mfaBackupCodes`, `mfaLastStep` on `TenantUser` and `PlatformAdmin`.

Encrypted at rest by the application: MFA secrets only. `Tenant.bankAccountEncrypted`, `panEncrypted` and
`gstEncrypted` exist as columns, but no code in this work writes or reads them. Money is stored as `Float`.

## What has been verified

On a local machine, 2026-10-02:

- `prisma validate` passes; `nest build` and the type-check are clean; the API boots.
- Unit tests (`pnpm --filter @hotel/api test`, 10 tests): TOTP against the RFC 6238 test vectors, encryption
  round trip and tamper detection, settlement split arithmetic.
- A manual smoke script against the running API (27 checks, not kept in the repo): authentication, MFA
  enrolment, rejected wrong, replayed and reused codes, input validation, duplicate prevention, both payout
  steps, tenant isolation, audit entries.

Not verified: the multi-supplier endpoints in [MULTI_SUPPLIER_API.md](MULTI_SUPPLIER_API.md) at runtime,
behaviour under concurrent load, and anything involving a real payment provider. No performance measurements
exist.

## Known gaps

Needed before taking real payments:

1. **Payment gateway integration.** Nothing moves money; "paid" is a self-reported status with a reference
   string.
2. **Booking flow is not connected.** Bookings do not create revenue transactions or settlements; an admin
   must call `POST /settlements` by hand, supplying the owner net amount and commission.
3. **Refunds, cancellations and chargebacks** do not reverse or adjust settlements.
4. **Payee confirmation and reconciliation.** The owner cannot confirm or dispute a payment the seller says
   it made, and nothing reconciles against bank or gateway records.
5. **Decimal money and multi-currency.** Amounts are floats rounded to cents; fees are hardcoded
   percentages; there is no currency conversion.
6. **JWT secret fallback.** The app falls back to a hardcoded development secret if `JWT_SECRET` is unset.
7. **Rate limiting is not applied.** The throttler is configured but its guard is not registered.
8. **Tenant login tokens carry no tenant ID**, so middleware that reads it from the token gets nothing. The
   settlement routes look the user up in the database instead.
9. **Key management.** The encryption key is an environment variable with no rotation.
10. **MFA at login**, and MFA on other sensitive actions (API key creation, bank detail changes).
11. **Multi-supplier endpoints** take unvalidated request bodies and have no tests.
12. **Test coverage** is limited to the 10 unit tests above.

Useful later: partner webhooks and notifications, fraud and velocity checks, batched payouts, report
exports, dispute threads, commission rule templates.
