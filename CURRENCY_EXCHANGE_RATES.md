# Currency Exchange Rate Management System

## Overview
A comprehensive currency exchange rate management system with:
- ✅ Manual rate updates via admin interface
- ✅ Automatic API synchronization (Forex API, ExchangeRate API, Fixer, Open Exchange Rates)
- ✅ Historical data tracking with timestamps
- ✅ Rate change visualization
- ✅ Per-tenant support (future enhancement)

## Architecture

### Database Schema

#### 1. **Currency Model** (Existing)
```prisma
model Currency {
  id                  String   @id @default(cuid())
  code                String   @unique /// USD, EUR, INR, etc.
  name                String
  symbol              String
  exchangeRate        Float    @default(1.0)
  
  fxRatesAsBase       FXRate[] @relation("fx_base")
  fxRatesAsQuote      FXRate[] @relation("fx_quote")
}
```

#### 2. **FXRate Model** (Enhanced)
Stores current exchange rates between two currencies
```prisma
model FXRate {
  id                  String   @id @default(cuid())
  baseCurrencyId      String
  baseCurrency        Currency @relation("fx_base", ...)
  quoteCurrencyId     String
  quoteCurrency       Currency @relation("fx_quote", ...)
  
  rate                Decimal  /// 1 base = rate quote
  source              String   /// manual, api
  apiProvider         String?  /// forex_api, exchangerate, fixer, openexchangerates
  
  history             FXRateHistory[]
  
  updatedAt           DateTime @updatedAt
  createdAt           DateTime @default(now())
  
  @@unique([baseCurrencyId, quoteCurrencyId])
}
```

#### 3. **FXRateHistory Model** (New - Append-Only Audit Trail)
Tracks all historical rate changes with timestamps
```prisma
model FXRateHistory {
  id                  String   @id @default(cuid())
  fxRateId            String
  fxRate              FXRate   @relation(fields: [fxRateId], references: [id])
  
  baseCurrencyId      String
  quoteCurrencyId     String
  rate                Decimal  /// Historical rate value
  source              String   /// manual, api
  apiProvider         String?  /// Which API synced this rate
  
  updatedBy           String?  /// User ID for manual updates
  updateReason        String?  /// manual_update, api_sync, correction
  
  createdAt           DateTime @default(now())
  
  @@index([fxRateId, createdAt])
  @@index([createdAt])
  @@index([baseCurrencyId, quoteCurrencyId, createdAt])
}
```

## Backend API

### Endpoints

#### 1. Get All Currencies
```
GET /api/currency
```
Returns all currencies with their current exchange rates.

#### 2. Get Currency by ID
```
GET /api/currency/:id
```
Returns single currency with related FX rates.

#### 3. Get FX Rate History
```
GET /api/currency/rate/history/:baseCurrencyId/:quoteCurrencyId?limit=30
```
Returns historical rate changes for a currency pair.

#### 4. Get Rate Chart Data
```
GET /api/currency/chart/:baseCurrencyId/:quoteCurrencyId?days=30
```
Returns rate data formatted for charting (date, rate, source).

#### 5. Get Latest Rates
```
GET /api/currency/latest/all
```
Returns current rates for all currency pairs.

#### 6. Update FX Rate (Manual)
```
POST /api/currency/update
Content-Type: application/json

{
  "baseCurrencyId": "...",
  "quoteCurrencyId": "...",
  "rate": 1.25,
  "source": "manual",
  "updateReason": "manual_update|correction|daily_update",
  "updatedBy": "user_id"
}
```
Updates a single currency pair rate and creates history entry.

#### 7. Bulk Update FX Rates (API Sync)
```
POST /api/currency/bulk-update
Content-Type: application/json

{
  "rates": [
    {
      "baseCurrencyCode": "USD",
      "quoteCurrencyCode": "EUR",
      "rate": 0.92
    },
    {
      "baseCurrencyCode": "USD",
      "quoteCurrencyCode": "INR",
      "rate": 83.15
    }
  ],
  "apiProvider": "forex_api"
}
```
Updates multiple rates from API and creates history entries.

## Frontend Component

### Location
```
/apps/web/app/admin/dashboard/page.tsx
Component: CurrencyRatesUpdater
```

### Features

#### 1. **Currency Pair Selector**
- Lists all available currency pairs
- Displays current rate
- Shows last update time
- Indicates source (API 📡 or Manual ✏️)

#### 2. **Current Rate Display**
- Gradient card showing base rate
- Formatted to 6 decimal places
- Shows source attribution
- Last updated timestamp

#### 3. **Manual Update Form**
- Input field for new rate (validates decimal format)
- Update reason dropdown:
  - Manual Update
  - Rate Correction
  - Daily Update
  - API Sync
- Submit button with loading state

#### 4. **API Integration Section**
- Dropdown to select API provider:
  - Forex API
  - ExchangeRate API
  - Fixer API
  - Open Exchange Rates
- "Sync Rates" button to trigger bulk update
- Status indicator showing connected provider
- Sync status messages

#### 5. **Rate History Display**
- Shows last 30 historical entries
- Displays rate value and timestamp
- Shows source icon (📡 API or ✏️ Manual)
- Scrollable for easy review
- Most recent first

### UI Components
- Modern gradient card for current rate
- Responsive 3-column grid layout
- Light/Dark theme support (Tailwind CSS)
- Loading states on all actions
- Success/Error messages with auto-dismiss
- Mobile-friendly layout

## Implementation Details

### Service Methods

#### updateFXRate()
```typescript
async updateFXRate(
  baseCurrencyId: string,
  quoteCurrencyId: string,
  rate: number | string,
  source: 'manual' | 'api' = 'manual',
  apiProvider?: string,
  updatedBy?: string,
  updateReason?: string,
)
```
- Creates or updates FXRate record
- Creates FXRateHistory entry for audit trail
- Validates currency IDs exist
- Stores update metadata (source, reason, user)

#### bulkUpdateFXRates()
```typescript
async bulkUpdateFXRates(
  rates: Array<{
    baseCurrencyCode: string;
    quoteCurrencyCode: string;
    rate: number | string;
  }>,
  source: 'api' = 'api',
  apiProvider?: string,
)
```
- Processes multiple rate updates atomically
- Looks up currencies by code
- Creates history entries for each update
- Returns success/failure summary

#### getRateChart()
```typescript
async getRateChart(
  baseCurrencyId: string,
  quoteCurrencyId: string,
  days = 30,
)
```
- Queries historical data for date range
- Returns data formatted for charting (date, rate, source)
- Supports custom date ranges

#### getFXRateHistory()
```typescript
async getFXRateHistory(
  baseCurrencyId: string,
  quoteCurrencyId: string,
  limit = 30,
)
```
- Returns paginated history entries
- Newest first
- Includes source and update reason

## Admin Dashboard Integration

### Navigation
- **Masters** → **Exchange Rates** (New submenu item)
- Accessible from admin dashboard sidebar
- Full-page view with side panel layout

### Permissions
- Admin-only access
- No tenant scoping (global currency rates)
- Audit trail for all updates

## API Integration Support

### Supported Providers
1. **Forex API** (forex_api)
   - Real-time rates
   - 150+ currencies
   - Webhook support available

2. **ExchangeRate API** (exchangerate)
   - Free tier available
   - 170+ currencies
   - No API key required for basic use

3. **Fixer API** (fixer)
   - European focus
   - Historical data
   - Requires API key

4. **Open Exchange Rates** (openexchangerates)
   - USD base rates
   - Historical data
   - Requires API key

### Implementation Pattern
```typescript
// Future: API integration adapter
async syncRatesFromAPI(provider: string) {
  switch (provider) {
    case 'forex_api':
      return this.syncFromForexAPI();
    case 'exchangerate':
      return this.syncFromExchangeRateAPI();
    case 'fixer':
      return this.syncFromFixerAPI();
    case 'openexchangerates':
      return this.syncFromOpenExchangeRatesAPI();
  }
}

// Scheduled sync (using CronJob)
@Cron('0 0 * * *')
async dailyRateSync() {
  const providers = ['forex_api', 'exchangerate'];
  for (const provider of providers) {
    await this.syncRatesFromAPI(provider);
  }
}
```

## Historical Data Tracking

### Data Points Captured
- **Rate Value**: Decimal precision up to 8 decimal places
- **Timestamp**: When the rate was recorded
- **Source**: manual or api
- **API Provider**: Which API synced the rate
- **Update Reason**: Why the rate was changed
- **Updated By**: User ID (for manual updates)

### Use Cases
1. **Audit Trail**: Track all rate changes over time
2. **Rate Analysis**: Historical comparison of rates
3. **Debugging**: Identify rate anomalies
4. **Compliance**: Prove rate accuracy on specific dates
5. **Charting**: Visualize rate trends

## Future Enhancements

### Scheduled Updates
```typescript
// Auto-sync rates from API at specific intervals
@Cron('0 */4 * * *')  // Every 4 hours
async autoSyncRates() {
  // Implementation
}
```

### Tenant-Specific Rates
```typescript
// Support different rates per tenant
// Extend FXRate model with optional tenantId
```

### Rate Alerts
```typescript
// Notify admin when rate changes exceed threshold
async checkRateThresholds() {
  // Implementation
}
```

### Rate Locking
```typescript
// Prevent rate updates during critical periods
async lockRatesForTenant(tenantId: string) {
  // Implementation
}
```

### Batch Exports
```typescript
// Export historical data to CSV/Excel
async exportRatesHistory(currency: string, startDate: Date, endDate: Date) {
  // Implementation
}
```

## Testing

### Unit Tests
```typescript
describe('CurrencyService', () => {
  it('should update FX rate and create history', async () => {
    // Test rate update
    // Verify history entry created
    // Validate decimal precision
  });

  it('should sync multiple rates from API', async () => {
    // Mock API response
    // Bulk update rates
    // Verify all history entries created
  });

  it('should return rate history in correct order', async () => {
    // Create multiple history entries
    // Query history
    // Verify newest first
  });
});
```

### Integration Tests
```typescript
describe('Currency API', () => {
  it('POST /currency/update should persist rate', async () => {
    // Call endpoint
    // Verify database update
    // Verify history entry
  });

  it('GET /currency/rate/history should return paginated results', async () => {
    // Create history entries
    // Query with limit
    // Verify pagination
  });
});
```

## Database Migration

### Create Migration
```bash
cd packages/db
npx prisma migrate dev --name add_fx_rate_history
```

### Apply Migration
```bash
npx prisma migrate deploy
```

### Rollback (if needed)
```bash
npx prisma migrate resolve --rolled-back add_fx_rate_history
```

## Error Handling

| Error | Handling |
|-------|----------|
| Currency not found | 404 NotFoundException |
| Invalid rate format | 400 BadRequestException |
| API sync failure | 500 with retry logic |
| Duplicate history | Automatic deduplication |
| Permission denied | 403 Unauthorized |

## Performance Considerations

### Indexes
```prisma
// Optimized for common queries
@@index([fxRateId, createdAt])           // History lookups
@@index([createdAt])                     // Time-based queries
@@index([baseCurrencyId, quoteCurrencyId, createdAt])  // Rate pair history
```

### Query Optimization
- Pre-select specific fields when possible
- Use cursor-based pagination for large datasets
- Cache latest rates in-memory (future)
- Batch history queries by date range

## Deployment Checklist

- [ ] Database migration deployed
- [ ] Prisma client regenerated
- [ ] API module imported in app.module.ts
- [ ] Routes mapped and tested
- [ ] Frontend component added to dashboard
- [ ] Menu navigation updated
- [ ] API provider credentials configured (if using)
- [ ] Historical data imported (if migrating from existing system)
- [ ] Scheduled sync configured (if auto-sync enabled)
- [ ] Monitoring alerts set up

## Support

For issues or questions:
1. Check historical data: GET /api/currency/rate/history
2. Verify API connectivity: POST /api/currency/bulk-update with test data
3. Review audit trail in FXRateHistory table
4. Check admin dashboard Exchange Rates section for UI issues
