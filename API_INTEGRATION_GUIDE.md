# Forex API Integration Guide

## Current Implementation Status

### ✅ What's Working Now (Manual Updates)
- Manual rate updates via admin interface
- Historical tracking of all changes
- Reason/comment tracking
- Update timestamps stored
- Full audit trail in database

### 🔧 What's Ready for API Integration (Awaiting Credentials)
- API module structure in place
- Bulk update endpoint ready
- API provider selection UI
- Rate sync button configured
- Historical tracking for API syncs

---

## Step 1: Choose Your Forex API Provider

### Option 1: **ExchangeRate API** (Recommended for Testing)
- **Free Tier:** 1,500 requests/month (enough for testing)
- **No Credit Card Required**
- **170+ currencies supported**
- **URL:** https://www.exchangerate-api.com

### Option 2: **Forex API** (Recommended for Production)
- **Free Tier:** 100 requests/month
- **Real-time rates**
- **150+ currencies**
- **URL:** https://www.forexapi.io

### Option 3: **Fixer API** (European Focus)
- **Free Tier:** 100 requests/month
- **Historical data available**
- **170+ currencies**
- **URL:** https://fixer.io

### Option 4: **Open Exchange Rates**
- **Free Tier:** 1,000 requests/month
- **USD base only**
- **180+ currencies**
- **URL:** https://openexchangerates.org

---

## Step 2: Get API Key

### ExchangeRate API (Example)
1. Go to https://www.exchangerate-api.com/signup
2. Sign up (no credit card needed for free tier)
3. Verify email
4. Copy your API key from dashboard
5. Keep it safe!

---

## Step 3: Configure Environment Variables

Add to `.env.local`:

```env
# Forex API Configuration
FOREX_API_PROVIDER=exchangerate
EXCHANGERATE_API_KEY=your_api_key_here
EXCHANGERATE_API_URL=https://v6.exchangerate-api.com/v6

# (Optional: Add other providers)
FOREX_API_PROVIDER_FIXER=fixer
FIXER_API_KEY=your_fixer_key
FIXER_API_URL=https://api.fixer.io

FOREX_API_PROVIDER_OPENEXCHANGERATES=openexchangerates
OPENEXCHANGERATES_API_KEY=your_key
OPENEXCHANGERATES_API_URL=https://openexchangerates.org/api
```

---

## Step 4: Implement API Service

Create: `apps/api/src/shared/services/forex-api.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ForexApiService {
  private apiKey = process.env.EXCHANGERATE_API_KEY;
  private apiUrl = process.env.EXCHANGERATE_API_URL;
  private provider = process.env.FOREX_API_PROVIDER;

  async fetchRates(baseCurrency: string = 'USD') {
    try {
      const response = await axios.get(
        `${this.apiUrl}/${this.apiKey}/latest/${baseCurrency}`,
        { timeout: 10000 }
      );

      if (response.data.result === 'success') {
        return Object.entries(response.data.conversion_rates).map(
          ([code, rate]: [string, any]) => ({
            baseCurrencyCode: baseCurrency,
            quoteCurrencyCode: code,
            rate: parseFloat(rate),
          })
        );
      }

      throw new Error('API request failed');
    } catch (error) {
      console.error('Forex API Error:', error);
      throw error;
    }
  }

  // Get rates for multiple currencies
  async fetchMultipleCurrencies(currencies: string[]) {
    const allRates = [];

    for (const currency of currencies) {
      try {
        const rates = await this.fetchRates(currency);
        allRates.push(...rates);
      } catch (error) {
        console.error(`Failed to fetch rates for ${currency}:`, error);
        continue;
      }
    }

    return allRates;
  }

  // Get historical rates (if API supports it)
  async fetchHistoricalRates(
    baseCurrency: string,
    quoteCurrency: string,
    date: string
  ) {
    // Implementation depends on API provider
    // Most free tiers don't support historical data
    throw new Error('Historical data requires premium API tier');
  }
}
```

---

## Step 5: Update Currency Service

Add to `apps/api/src/modules/currency/currency.service.ts`:

```typescript
import { ForexApiService } from '../../shared/services/forex-api.service';

@Injectable()
export class CurrencyService {
  constructor(
    private prisma: PrismaService,
    private forexApi: ForexApiService,
  ) {}

  // NEW: Sync rates from Forex API
  async syncFromForexAPI() {
    try {
      const currencies = await this.prisma.currency.findMany({
        select: { code: true },
      });

      const currencyCodes = currencies.map(c => c.code);
      const rates = await this.forexApi.fetchMultipleCurrencies(currencyCodes);

      const results = await this.bulkUpdateFXRates(
        rates,
        'api',
        process.env.FOREX_API_PROVIDER
      );

      return {
        success: true,
        synced: results.length,
        timestamp: new Date(),
        provider: process.env.FOREX_API_PROVIDER,
      };
    } catch (error) {
      console.error('API sync error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  // Existing method - now used by API sync
  async bulkUpdateFXRates(
    rates: Array<{
      baseCurrencyCode: string;
      quoteCurrencyCode: string;
      rate: number | string;
    }>,
    source: 'api' = 'api',
    apiProvider?: string,
  ) {
    const results = [];

    for (const rateData of rates) {
      try {
        const [baseCurrency, quoteCurrency] = await Promise.all([
          this.prisma.currency.findUnique({
            where: { code: rateData.baseCurrencyCode },
          }),
          this.prisma.currency.findUnique({
            where: { code: rateData.quoteCurrencyCode },
          }),
        ]);

        if (!baseCurrency || !quoteCurrency) continue;

        await this.updateFXRate(
          baseCurrency.id,
          quoteCurrency.id,
          rateData.rate,
          source,
          apiProvider,
          undefined,
          'api_sync',
        );

        results.push({
          from: rateData.baseCurrencyCode,
          to: rateData.quoteCurrencyCode,
          rate: rateData.rate,
          success: true,
        });
      } catch (error) {
        results.push({
          from: rateData.baseCurrencyCode,
          to: rateData.quoteCurrencyCode,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}
```

---

## Step 6: Add Scheduled API Sync (Optional)

Add to `apps/api/src/modules/currency/currency.service.ts`:

```typescript
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CurrencyService {
  // Sync rates every 4 hours (6 times per day)
  @Cron(CronExpression.EVERY_4_HOURS)
  async scheduleForexSync() {
    console.log('Starting scheduled Forex API sync...');
    const result = await this.syncFromForexAPI();
    console.log('Forex sync result:', result);
  }

  // Or sync daily at 1 AM
  @Cron('0 1 * * *')
  async dailyForexSync() {
    console.log('Starting daily Forex API sync...');
    const result = await this.syncFromForexAPI();
    console.log('Daily sync result:', result);
  }
}
```

Import ScheduleModule in `app.module.ts`:

```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // ... other imports
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
```

---

## Step 7: Add Forex API Service to Module

Update `apps/api/src/modules/currency/currency.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { ForexApiService } from '../../shared/services/forex-api.service';

@Module({
  controllers: [CurrencyController],
  providers: [CurrencyService, ForexApiService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
```

---

## Step 8: Test API Sync Manually

### Via Admin UI
1. Go to Masters → Exchange Rates
2. Select API provider dropdown
3. Choose "ExchangeRate API" (or your provider)
4. Click "Sync Rates"
5. Watch for success message

### Via API Curl
```bash
# Sync rates from API
curl -X POST http://localhost:3001/api/currency/bulk-update \
  -H "Content-Type: application/json" \
  -d '{
    "rates": [
      {
        "baseCurrencyCode": "USD",
        "quoteCurrencyCode": "EUR",
        "rate": 0.92
      },
      {
        "baseCurrencyCode": "USD",
        "quoteCurrencyCode": "GBP",
        "rate": 0.78
      }
    ],
    "apiProvider": "exchangerate"
  }'
```

### Via Code
```typescript
// In any service
constructor(private currencyService: CurrencyService) {}

async testSync() {
  const result = await this.currencyService.syncFromForexAPI();
  console.log('Sync Result:', result);
}
```

---

## Step 9: Monitor API Usage

### ExchangeRate API Dashboard
- Visit: https://app.exchangerate-api.com/dashboard
- Monitor requests count
- See rate limits
- Download usage reports

### Log API Calls
Add logging to `forex-api.service.ts`:

```typescript
async fetchRates(baseCurrency: string = 'USD') {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(
      `${this.apiUrl}/${this.apiKey}/latest/${baseCurrency}`,
      { timeout: 10000 }
    );

    console.log(
      `✅ API Call Success: ${baseCurrency} 
       (${Date.now() - startTime}ms)`
    );

    return rates;
  } catch (error) {
    console.error(
      `❌ API Call Failed: ${baseCurrency} 
       (${Date.now() - startTime}ms) - ${error.message}`
    );
    throw error;
  }
}
```

---

## Step 10: Handle API Errors Gracefully

Add error handling in controller:

```typescript
@Post('sync-forex')
@HttpCode(200)
async syncForexRates() {
  try {
    const result = await this.currencyService.syncFromForexAPI();
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        message: 'API sync failed. Rates unchanged.',
      };
    }

    return {
      success: true,
      synced: result.synced,
      provider: result.provider,
      timestamp: result.timestamp,
      message: `Successfully synced ${result.synced} rates`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Unexpected error during sync',
    };
  }
}
```

---

## Implementation Timeline

### Phase 1: Manual Updates (✅ DONE NOW)
- Manual rate entry via admin UI
- Historical tracking
- Audit trail
- Reason tracking

### Phase 2: API Integration (Ready to Implement)
- Get API key (5 mins)
- Add environment variables (2 mins)
- Implement ForexApiService (15 mins)
- Test API sync (10 mins)

### Phase 3: Scheduled Sync (Ready to Implement)
- Add @Cron decorators (5 mins)
- Test scheduled execution (10 mins)
- Monitor performance (ongoing)

### Phase 4: Monitoring & Alerts (Optional)
- Dashboard for API usage
- Alert on sync failures
- Rate anomaly detection

---

## Cost Estimate

| Provider | Free Tier | Pricing | Best For |
|----------|-----------|---------|----------|
| ExchangeRate API | 1,500/mo | $15/mo | Testing, Small Deployments |
| Forex API | 100/mo | $25/mo | Production with real-time |
| Fixer | 100/mo | €10/mo | Europe-focused, Historical |
| Open Exchange | 1,000/mo | $10/mo | USD base, High volume |

**Recommendation for you:** Start with **ExchangeRate API** (free tier covers 1,500 requests/month = 50 syncs/day)

---

## Troubleshooting

### Issue: "Invalid API Key"
- Check `.env.local` for typos
- Verify key from provider dashboard
- Restart API server after updating .env

### Issue: "Rate limit exceeded"
- Reduce sync frequency
- Upgrade to paid tier
- Implement request caching

### Issue: "Connection timeout"
- Check internet connectivity
- Increase timeout in forex-api.service
- Check API provider status page

### Issue: "No rates returned"
- Verify currency codes are correct
- Check API provider coverage
- Test with different base currency

---

## Ready to Connect?

When you have your API key:

1. **Get your API key** from provider
2. **Update `.env.local`** with credentials
3. **Restart API server** (`npm run dev` in apps/api)
4. **Go to Admin → Masters → Exchange Rates**
5. **Select provider and click "Sync Rates"**
6. **Watch rates update in real-time! 🎉**

Let me know when you're ready - I can help integrate the API or troubleshoot any issues!
