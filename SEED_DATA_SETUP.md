# Seed Data Setup Guide

## What's Included in the Seed

The seed script populates your database with:

### ✅ Platform Admin
```
Email: admin@platform.com
Password: admin123
```

### ✅ Sample Tenants (2)
```
1. Luxury Hotels Co.
   - Email: admin@luxuryhotels.com
   - Password: password123
   - Type: hotel_chain

2. Global DMCs
   - Email: admin@globaldmcs.com
   - Password: password123
   - Type: dmc
```

### ✅ Currencies (4)
- USD (US Dollar) - Base currency
- INR (Indian Rupee)
- GBP (British Pound)
- SGD (Singapore Dollar)

### ✅ Exchange Rates (5 pairs)
- USD ↔ INR (1 USD = 83.15 INR)
- USD ↔ GBP (1 USD = 0.7892 GBP)
- USD ↔ SGD (1 USD = 1.35 SGD)
- GBP ↔ INR (1 GBP = 105.25 INR)
- SGD ↔ INR (1 SGD = 61.59 INR)

### ✅ Historical Data
- **30 days** of rate history per currency pair
- **Mix of manual and API** updates
- **Realistic rate variations** (±1%)
- **Multiple entries per day** to simulate trading
- **Complete audit trail** with timestamps and reasons

### ✅ Sample Property Data
- The Plaza Hotel (New York)
- 2 room types (Deluxe, Suite)
- 30 days of calendar rates
- Sample rate plans

---

## How to Run the Seed

### Option 1: Using npm (Recommended)

```bash
cd packages/db
npm run seed
```

### Option 2: Using Prisma directly

```bash
cd packages/db
npx prisma db seed
```

### Option 3: With migration (if needed)

```bash
cd packages/db
npx prisma migrate dev
# Follow the prompts to create and run migration
# Then seed will run automatically
```

---

## What You'll See

When the seed runs successfully, you'll see output like:

```
🌱 Seeding database...
✓ Platform admin created
✓ Countries seeded
✓ States seeded
✓ Currencies seeded
✓ Amenities seeded
✓ Bed types seeded
✓ Board codes seeded
✓ Taxes seeded
✓ Cancellation policy templates seeded
✓ Chains seeded
✓ Legal information types seeded
✓ Global hotels seeded
💱 Creating FX rates...
✓ Created 5 FX rates
📊 Creating 30 days of historical rate data...
✓ Created 125+ historical rate entries
✓ Tenant 1 (Luxury Hotels Co.) created
✓ Tenant 2 (Global DMCs) created
✓ Property 1 (The Plaza Hotel) created with rooms
✓ Rate plans created
✓ Calendar rates seeded for 30 days
✓ Distribution grant created (Luxury Hotels → Global DMCs)

═══════════════════════════════════════════════════════════
✨ DATABASE SEEDING COMPLETED SUCCESSFULLY!

📊 Data Summary:
   Platform Admin: 1
   Countries: 4
   Currencies: 4 (USD, INR, GBP, SGD)
   FX Rates: 5
   FX Rate History Entries: 125+
   Amenities: 6
   Tenants: 2
   Properties: 1
   Rooms: 2
   Rate Plans: 2
   Calendar Rates: 60

💱 Exchange Rates Setup:
   ✅ USD ↔ INR (83.15)
   ✅ USD ↔ GBP (0.7892)
   ✅ USD ↔ SGD (1.35)
   ✅ GBP ↔ INR (105.25)
   ✅ SGD ↔ INR (61.59)
   📈 Historical data: Last 30 days with realistic variations

🎯 Next Steps:
   1. Start the application: npm run dev
   2. Login to admin panel with platform admin credentials
   3. Go to: Admin → Masters → Exchange Rates
   4. Select a currency pair (e.g., USD → INR)
   5. View 30 days of historical data
   6. Test manual rate updates

═══════════════════════════════════════════════════════════
```

---

## Testing the Seeded Data

### 1. Login to Admin Panel

```
URL: http://localhost:3000/login/admin
Email: admin@platform.com
Password: admin123
```

### 2. Navigate to Exchange Rates

```
Admin Dashboard → Masters → Exchange Rates
```

### 3. You Should See:

**Exchange Rates List:**
- [ ] USD → INR (83.15)
- [ ] USD → GBP (0.7892)
- [ ] USD → SGD (1.35)
- [ ] GBP → INR (105.25)
- [ ] SGD → INR (61.59)

### 4. Click on Any Rate to View Details:

- Current rate displayed in gradient card
- 30 days of historical data showing
- Mix of manual and API sources
- Timestamps for each update
- Rate values with realistic variations

### 5. Test Manual Update:

1. Select a rate (e.g., USD → INR)
2. Enter a new rate: `83.50`
3. Select reason: "Correction"
4. Click "Update Rate"
5. Should see success message
6. History should show new entry at top

---

## Database State After Seeding

### FXRate Table
```sql
SELECT * FROM "FXRate";
-- Shows 5 current exchange rates
```

### FXRateHistory Table
```sql
SELECT COUNT(*) FROM "FXRateHistory";
-- Shows 125+ historical entries

SELECT * FROM "FXRateHistory"
WHERE "fxRateId" = '...'
ORDER BY "createdAt" DESC
LIMIT 10;
-- Shows last 10 updates for a rate pair
```

### Currencies Table
```sql
SELECT * FROM "Currency"
WHERE code IN ('USD', 'INR', 'GBP', 'SGD');
-- Shows the 4 seeded currencies
```

---

## Resetting the Database

If you need to start over:

### Option 1: Reset Everything
```bash
cd packages/db
npx prisma migrate reset
# This will:
# - Drop all tables
# - Recreate schema
# - Run seed
```

### Option 2: Just Clear Rates and History
```bash
cd packages/db
npx prisma db execute --stdin < clear_rates.sql
# Then run seed again
```

**Note:** `migrate reset` is destructive and will delete all data. Use only in development!

---

## Customizing the Seed Data

To modify the seeded data, edit:

```
packages/db/prisma/seed.ts
```

### Add More Currency Pairs

Find the `baseRates` array:

```typescript
const baseRates = [
  { base: usd, quote: inr, rate: 83.15 },
  { base: usd, quote: gbp, rate: 0.7892 },
  // Add more here
];
```

### Add More Currencies

Find the currency creation section:

```typescript
const currencies = await Promise.all([
  prisma.currency.upsert({
    where: { code: 'EUR' },
    update: {},
    create: {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      exchangeRate: 0.92,
    },
  }),
  // Add more here
]);
```

### Change Historical Data Period

Find the loop creating history:

```typescript
const daysOfData = 30; // Change this to 60, 90, etc.
```

### Save changes and re-run seed:

```bash
npm run seed
```

---

## Troubleshooting

### Issue: "Unique constraint failed"
**Solution:** Run `npx prisma migrate reset` to clear and reseed

### Issue: "Database connection failed"
**Solution:**
1. Check PostgreSQL is running
2. Verify `.env.local` has correct DATABASE_URL
3. Run `npx prisma migrate dev` first

### Issue: "No historical data showing in UI"
**Solution:**
1. Verify FXRateHistory records exist:
   ```bash
   SELECT COUNT(*) FROM "FXRateHistory";
   ```
2. Check fxRateId is correct and matches FXRate records
3. Clear browser cache and refresh

### Issue: "Seed runs but data is empty in UI"
**Solution:**
1. Verify API is running on port 3001
2. Check /api/currency endpoint returns data
3. Verify no JS console errors in browser

---

## What Happens Each Time You Seed?

The seed uses **upsert** logic:

- ✅ If data exists → Updates it
- ✅ If data doesn't exist → Creates it
- ✅ Prevents duplicate errors
- ✅ Safe to run multiple times

So you can re-run `npm run seed` without issues!

---

## Next: Connect Real Forex API

Once you have the seed data working, follow the **API_INTEGRATION_GUIDE.md** to:

1. Get an API key
2. Configure .env
3. Connect real Forex API
4. Auto-sync rates from the UI

---

## Quick Checklist

- [ ] Run `npm run seed` successfully
- [ ] See "Seeding complete" message
- [ ] Login to admin panel
- [ ] Navigate to Exchange Rates
- [ ] See 5 currency pairs listed
- [ ] Click on USD → INR
- [ ] See current rate (83.15)
- [ ] See 30 days of history
- [ ] Test manual rate update
- [ ] See history update in real-time

✅ All done! Your system is ready to test!

---

## File Locations

- **Seed Script:** `packages/db/prisma/seed.ts`
- **Schema:** `packages/db/prisma/schema.prisma`
- **Migrations:** `packages/db/prisma/migrations/`
- **Environment:** `.env.local`

---

Need help? Check:
- `CURRENCY_EXCHANGE_RATES.md` - Full system documentation
- `API_INTEGRATION_GUIDE.md` - How to add real API
- Database logs for errors
