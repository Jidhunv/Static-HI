# Hotel Inventory & Distribution Platform

A multi-tenant B2B2C hotel distribution platform built with Next.js, NestJS, PostgreSQL, and TypeScript.

## Project Structure

```
.
├── apps/
│   ├── api/              # NestJS backend API
│   └── web/              # Next.js frontend
├── packages/
│   ├── db/               # Prisma schema & migrations
│   ├── types/            # Shared TypeScript types
│   └── ui/               # Shared UI components (future)
└── package.json          # Workspace root
```

## Phase 0: Foundation (Current)

✅ **Completed:**
- Monorepo scaffold with pnpm workspaces
- Prisma schema for all entities (§8 of brief)
- PostgreSQL Row-Level Security (RLS) policies for tenant isolation
- NestJS API with:
  - JWT authentication & tenant context extraction
  - RLS middleware integration
  - Masters CRUD (Countries, Amenities, etc.)
  - Tenant management endpoints
  - Property/Room/RatePlan services (foundation for Phase 1)
- Next.js frontend with:
  - Login page
  - Auth state management (Zustand)
  - API client with token injection & 401 handling
- Seed data: 2 sample tenants, 1 property, 30 days of calendar rates

**To Run Locally:**

### 1. Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL 14+ locally or via Docker

### 2. Setup Database

```bash
# Start PostgreSQL (if using Docker)
docker run -d \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=hotel_inventory_dev \
  -p 5432:5432 \
  postgres:15

# Install dependencies
pnpm install

# Create .env files from examples
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Update DATABASE_URL in packages/db/.env if needed:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/hotel_inventory_dev"

# Run migrations
pnpm db:push

# Seed sample data
pnpm db:seed
```

### 3. Start Development Servers

```bash
# Terminal 1: API
cd apps/api
pnpm dev
# API runs on http://localhost:3001

# Terminal 2: Web
cd apps/web
pnpm dev
# Web runs on http://localhost:3000
```

### 4. Test Login

Visit `http://localhost:3000/login` and use:
- **Tenant ID:** `luxury-hotels-co`
- **Email:** `admin@luxuryhotels.com`
- **Password:** `password123`

## Key Architecture Decisions

### Tenant Isolation (Defense in Depth)
1. **Application layer:** Every service method requires explicit `tenantId` from JWT claim
2. **Database layer:** PostgreSQL RLS policies enforce tenant scoping at row level
3. **Middleware:** TenantMiddleware extracts tenant from JWT; RLSMiddleware sets session variable

### Data Model Highlights
- **Shared database, shared schema:** All tenants in one DB, isolated by `tenant_id` column
- **Global Masters:** Countries, Amenities, Board Codes, etc. are platform-owned, not tenant-scoped
- **Global Hotel Master:** Pre-loaded reference dataset for fast property onboarding
- **Audit Logging:** All changes to sensitive entities (markup rules, bank details, distributions) logged

### Rate Resolution Pipeline (Not Yet Wired)
Located in §7.9 of brief. Once built as a pure function in Phase 3, will be:
```
netRate → +sourceTenantB2BMargin (if B2B) → +resellerMarkup → +taxes/fees → sellRate
```
Each layer persists a `rate_breakdown` record for tenant audit trails.

## Development Notes

- **TypeScript:** Strict mode enabled throughout
- **Validation:** class-validator on all DTOs at API boundary
- **RLS Policies:** Applied to all tenant-scoped tables; test in Phase 1 with cross-tenant query attempts
- **Seed Data:** Runs once; modify `packages/db/prisma/seed.ts` and re-run `pnpm db:seed` to reset

## Next Steps (Phase 1)

- [ ] Complete Property Management UI (multi-tab form matching §7.3)
- [ ] Room, Rate Plan, and Cancellation Policy forms
- [ ] Bank detail encryption & verification flow
- [ ] Upload documents (photos, legal docs) to S3
- [ ] Unit & integration tests for property service
- [ ] Test RLS isolation with crafted queries

## Environment Variables

See `.env.example` files in each package for required/optional vars. Key ones:

**API:**
- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – change in production
- `CORS_ORIGIN` – frontend URL for CORS

**Web:**
- `NEXT_PUBLIC_API_URL` – API base URL

## Resources

- **Brief:** See the initial prompt for full spec (§1–13)
- **Prisma Docs:** https://www.prisma.io/docs
- **NestJS Docs:** https://docs.nestjs.com
- **Next.js Docs:** https://nextjs.org/docs
