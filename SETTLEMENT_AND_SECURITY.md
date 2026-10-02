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

### How settlements are created

Automatically, by the booking flow:

1. A supplier publishes a room and rate plan (`InventoryVisibility`: `public`, or `reserved` for one
   tenant) with a net rate, a markup cap and a commission percentage.
2. The room then appears in other tenants' storefronts: search (`POST /b2c/search`), property details and
   room availability list it alongside the tenant's own inventory, showing only the published room and
   rate plan pairs. Terms reserved for a tenant take precedence over public ones.
3. The storefront can review and book it (`POST /b2c/bookings/review`, `POST /b2c/bookings` with its own
   `tenantSlug`). Search and booking share one pricing function: the published net rate plus the
   storefront's B2C markup, limited by the cap. Inventory is hidden from search, and booking refused, when
   the check-in date is outside the published booking window or the markup would not cover what the seller
   owes the owner.
4. The booking is stored under the inventory owner, with the storefront as `resellerTenantId`; the
   commission and inventory link are stored on its rate breakdown.
5. When the booking is paid (`POST /b2c/bookings/:id/payment`), the payment record, the confirmation, both
   settlements and the revenue transaction are written in one database transaction. A booking can be paid
   once; a second attempt returns 400.
6. If the booking is cancelled, unpaid settlements become `cancelled` and the revenue transaction
   `refunded`. If a settlement was already paid it is left as is and the revenue transaction becomes
   `disputed` for manual recovery.

A tenant selling its own property creates no settlements. A platform admin can also create settlements by
hand (`POST /settlements`) for bookings the flow did not cover.

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

`pending` → `paid`, or `cancelled` when the booking is cancelled first. Tier 2 becomes `overdue` if unpaid 15 days after creation (daily job at 01:00); an
overdue settlement can still be paid. Marking tier 2 paid also marks the booking's revenue transaction
`settled`, which is what monthly invoices are built from.

### Endpoints

Base: `http://localhost:3001/api/v1`. All require `Authorization: Bearer <login token>` (a user or admin
login token, not an API key). Routes marked MFA also require an `x-mfa-code` header.

| Method | Route | Who | MFA | Purpose |
|--------|-------|-----|-----|---------|
| POST | `/settlements` | Platform admin | yes | Create both settlements for a booking by hand |
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

## Access control

Every route requires a signed-in user unless it is marked `@Public()`. A global guard verifies the
bearer token, then loads the user or platform admin from the database; the tenant and role always come
from that record, never from token claims, request parameters or the host name.

| Routes | Who may call them |
|---|---|
| `/auth/login`, `/auth/admin-login`, `/auth/onboard`, `/masters/*` | Anyone |
| `/b2c/bookings/*`, `/b2c/rooms/*` (guest storefront) | Anyone |
| `/b2c/search`, `/b2c/hotels/*`, `/b2b/multi-supplier/*` | Holder of a tenant API key |
| `/admin/*`, `/api-keys/*`, changing FX or currency rates, initialising master data | Platform admin |
| `/approvals/*` | Platform admin; a tenant user only for its own tenant's B2B agents |
| `/audit-logs/*` | Platform admin (all tenants); a tenant user sees its own tenant only |
| `/properties/*`, `/tenant/*`, `/b2b/*` | Tenant user, scoped to its own tenant |
| `/inventory/*` ledger and allocation, `/rate-cards/*` blackouts | Owner of the property, or platform admin |
| Reading rates, availability and eligibility | Any signed-in user |

Requests are limited per IP address and route to 100 a minute and 1,000 an hour. Login and sign-up
routes are limited to 5 a minute and 30 an hour.

Other protections:

- A guest reaches a booking only with its ID or reference **and** the email it was booked under. Listing
  bookings by email alone is refused. Guest routes are limited to 10 requests a minute.
- Guest request bodies are validated; unknown fields are rejected.
- A storefront API key works only for its own tenant's storefront, and is not accepted in the URL.
- Users of a tenant that is pending, rejected or suspended cannot sign in or use existing tokens.
- Unexpected errors return a generic message; the detail is only logged.
- API documentation (`/api/docs`) is not served when `NODE_ENV=production`.
- The demo seed refuses to run in production.

Not covered: tenant user roles (`admin` and `staff` have the same access), and tenant self-service
for API keys (only a platform admin can create them).

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

Also required in `apps/api/.env`: `JWT_SECRET` (the API will not start without a private value of 32+
characters). `STRIPE_SECRET_KEY` enables payment verification; without it payments are refused unless
`ALLOW_UNVERIFIED_PAYMENTS=true`, which is for local development and ignored in production.

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
- Unit tests (`pnpm --filter @hotel/api test`, 38 tests): TOTP against the RFC 6238 test vectors, encryption
  round trip and tamper detection, settlement split arithmetic, stay pricing, the login guard, the
  signing-secret check and payment verification against a simulated Stripe.
- An access-control script against the running API (62 checks, not kept in the repo): 20 private routes
  refuse anonymous callers, with or without a forged host name; forged and mismatched tokens are refused;
  tenant users are refused on admin routes and on other tenants' properties and inventory; login is
  limited to 5 attempts a minute.
- A manual smoke script against the running API (27 checks, not kept in the repo): authentication, MFA
  enrolment, rejected wrong, replayed and reused codes, input validation, duplicate prevention, both payout
  steps, tenant isolation, audit entries.
- A second smoke script for the booking flow (22 checks, not kept in the repo): pricing of published
  inventory, booking ownership, settlement amounts on payment, double payment, cancellation before and
  after payout, own-inventory bookings, unprofitable terms, booking window, paused inventory.
- A third smoke script for the storefront (20 checks, not kept in the repo): published inventory appears in
  search, details and availability with only the published room and rate plan; search price equals booking
  price; no net rate or owner identity in search results; reserved terms override public ones; unprofitable,
  out-of-window and paused inventory is hidden; the owner's own search is unchanged.

Not verified: the multi-supplier endpoints in [MULTI_SUPPLIER_API.md](MULTI_SUPPLIER_API.md) at runtime,
behaviour under concurrent load, and anything involving a real payment provider. No performance measurements
exist.

## Known gaps

Needed before taking real payments:

1. **Payment verification is untested against Stripe.** With `STRIPE_SECRET_KEY` set, the API asks Stripe
   whether the payment intent succeeded for the booking's exact amount and currency and carries
   `metadata.bookingId`; without the key, payments are refused. This is covered by unit tests with a
   simulated Stripe, not by a real Stripe account. Still missing: the storefront does not create payment
   intents, and there is no webhook, so a guest who pays and closes the browser is not confirmed.
2. **The booking site itself is untested with published inventory.** The API returns it in the same shape
   as own inventory, but the frontend has not been run against it, and it falls back to mock data when
   calls fail. Its storefront slug is hardcoded to `default-tenant`, so its API key must belong to that tenant.
3. **Cancellation is partial.** Open settlements are voided, but cancellation penalties are not shared
   between seller and owner, paid settlements are not reversed, and chargebacks are not handled.
4. **Bookings do not reduce availability.** Creating or cancelling a B2C booking does not change the
   calendar's room count, and the published `allowedCountries` and reserved allocation are not enforced.
5. **Payee confirmation and reconciliation.** The owner cannot confirm or dispute a payment the seller says
   it made, and nothing reconciles against bank or gateway records.
6. **Decimal money and multi-currency.** Amounts are floats rounded to cents; fees are hardcoded
   percentages; there is no currency conversion.
7. **Guests are identified by booking ID or reference plus email**, not by a link sent to their inbox
   (the platform sends no email). The public API key in the storefront is visible to anyone.
8. **No database-level tenant isolation.** Row-level security is not enabled and the API connects as a
   database superuser; isolation depends on the application checks above.
9. **Tokens last 24 hours.** Deactivating a user or tenant takes effect immediately, but there is no
   sign-out-everywhere, no account lockout beyond the per-address login limit, and tenant `admin` and
   `staff` roles have the same access.
10. **Key management.** The encryption key is an environment variable with no rotation.
11. **MFA at login**, and MFA on other sensitive actions (API key creation, bank detail changes).
12. **Multi-supplier endpoints** take unvalidated request bodies and have no tests.
13. **Test coverage** is limited to the 38 unit tests above.
14. **The admin web app needs Next.js 15.** Its 23 open advisories (2 critical) are only fixed in a new
   major version. It also does not build: a component it imports is missing from the repository.

Useful later: partner webhooks and notifications, fraud and velocity checks, batched payouts, report
exports, dispute threads, commission rule templates.
