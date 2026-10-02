import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CurrencyService {
  constructor(private prisma: PrismaService) {}

  async getCurrencies() {
    return this.prisma.currency.findMany({
      include: {
        fxRatesAsBase: {
          include: {
            quoteCurrency: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getCurrencyById(id: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { id },
      include: {
        fxRatesAsBase: {
          include: { quoteCurrency: true },
        },
        fxRatesAsQuote: {
          include: { baseCurrency: true },
        },
      },
    });

    if (!currency) {
      throw new NotFoundException('Currency not found');
    }

    return currency;
  }

  async getFXRateHistory(baseCurrencyId: string, quoteCurrencyId: string, limit = 30) {
    // Return sample history data for now - will be replaced with real data once migration is complete
    const now = new Date();
    const history = [];

    for (let i = 0; i < Math.min(limit, 10); i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      history.push({
        createdAt: date,
        rate: (1.5 - i * 0.01).toString(),
        source: i % 2 === 0 ? 'manual' : 'api',
      });
    }

    return history;
  }

  async updateFXRate(
    baseCurrencyId: string,
    quoteCurrencyId: string,
    rate: number | string,
    source: 'manual' | 'api' = 'manual',
    apiProvider?: string,
    updatedBy?: string,
    updateReason?: string,
  ) {
    // Find or create FXRate
    let fxRate = await this.prisma.fXRate.findUnique({
      where: {
        baseCurrencyId_quoteCurrencyId: {
          baseCurrencyId,
          quoteCurrencyId,
        },
      },
    });

    const decimalRate = new Decimal(rate.toString());

    if (!fxRate) {
      fxRate = await this.prisma.fXRate.create({
        data: {
          baseCurrencyId,
          quoteCurrencyId,
          rate: decimalRate,
          source,
        },
      });
    } else {
      // Update the current rate
      fxRate = await this.prisma.fXRate.update({
        where: { id: fxRate.id },
        data: {
          rate: decimalRate,
          source,
        },
      });
    }

    // Create history entry (temporary - stored as JSON in metadata when DB is migrated)
    // Will be implemented once database migration is complete
    // await this.prisma.fXRateHistory.create({...})

    return fxRate;
  }

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
      // Find currencies by code
      const [baseCurrency, quoteCurrency] = await Promise.all([
        this.prisma.currency.findUnique({
          where: { code: rateData.baseCurrencyCode },
        }),
        this.prisma.currency.findUnique({
          where: { code: rateData.quoteCurrencyCode },
        }),
      ]);

      if (!baseCurrency || !quoteCurrency) {
        continue; // Skip if currencies don't exist
      }

      const updated = await this.updateFXRate(
        baseCurrency.id,
        quoteCurrency.id,
        rateData.rate,
        source,
        apiProvider,
        undefined,
        'api_sync',
      );

      results.push({
        baseCurrency: rateData.baseCurrencyCode,
        quoteCurrency: rateData.quoteCurrencyCode,
        rate: rateData.rate,
        success: true,
      });
    }

    return results;
  }

  async getRateChart(
    baseCurrencyId: string,
    quoteCurrencyId: string,
    days = 30,
  ) {
    // Return sample chart data - will be replaced with real data once migration is complete
    const now = new Date();
    const data = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const variation = (Math.random() - 0.5) * 0.1;
      data.push({
        date,
        rate: parseFloat((1.5 + variation).toFixed(6)),
        source: 'api',
      });
    }

    return data.reverse();
  }

  async getLatestRates() {
    const currencies = await this.prisma.currency.findMany();

    const rates = [];
    for (const baseCurr of currencies) {
      for (const quoteCurr of currencies) {
        if (baseCurr.id !== quoteCurr.id) {
          const fxRate = await this.prisma.fXRate.findUnique({
            where: {
              baseCurrencyId_quoteCurrencyId: {
                baseCurrencyId: baseCurr.id,
                quoteCurrencyId: quoteCurr.id,
              },
            },
          });

          if (fxRate) {
            rates.push({
              from: baseCurr.code,
              to: quoteCurr.code,
              rate: parseFloat(fxRate.rate.toString()),
              source: fxRate.source,
              updatedAt: fxRate.updatedAt,
            });
          }
        }
      }
    }

    return rates;
  }
}
