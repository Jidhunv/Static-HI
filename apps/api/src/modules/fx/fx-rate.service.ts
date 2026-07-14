import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * FX Rate Service
 * Manages currency conversion rates (manual + API-driven)
 * Rates are stored per base/quote pair
 */
@Injectable()
export class FXRateService {
  constructor(private prisma: PrismaService) {}

  /**
   * Initialize currencies (Super Admin only)
   */
  async initializeCurrencies() {
    const defaults = [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2 },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimal_places: 2 },
      { code: 'GBP', name: 'British Pound', symbol: '£', decimal_places: 2 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimal_places: 0 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimal_places: 2 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimal_places: 2 },
    ];

    for (const curr of defaults) {
      await this.prisma.currency.upsert({
        where: { code: curr.code },
        update: {},
        create: {
          code: curr.code,
          name: curr.name,
          symbol: curr.symbol,
          exchangeRate: curr.code === 'USD' ? 1.0 : 1.0, // Will be populated by FX rates
        },
      });
    }

    return defaults.length;
  }

  /**
   * Set FX rate manually (Super Admin)
   */
  async setRate(
    baseCurrencyCode: string,
    quoteCurrencyCode: string,
    rate: number
  ) {
    if (baseCurrencyCode === quoteCurrencyCode) {
      throw new BadRequestException(
        'Base and quote currencies must be different'
      );
    }

    if (rate <= 0) {
      throw new BadRequestException('Rate must be positive');
    }

    const [baseCurr, quoteCurr] = await Promise.all([
      this.getCurrency(baseCurrencyCode),
      this.getCurrency(quoteCurrencyCode),
    ]);

    return this.prisma.fXRate.upsert({
      where: {
        baseCurrencyId_quoteCurrencyId: {
          baseCurrencyId: baseCurr.id,
          quoteCurrencyId: quoteCurr.id,
        },
      },
      update: {
        rate: rate,
        source: 'manual',
        updatedAt: new Date(),
      },
      create: {
        baseCurrencyId: baseCurr.id,
        quoteCurrencyId: quoteCurr.id,
        rate: rate,
        source: 'manual',
      },
    });
  }

  /**
   * Update rates from API (scheduled job)
   */
  async updateFromAPI(
    baseCurrencyCode: string,
    quoteCurrencyCode: string,
    rate: number,
    source = 'api'
  ) {
    if (baseCurrencyCode === quoteCurrencyCode) {
      throw new BadRequestException(
        'Base and quote currencies must be different'
      );
    }

    const [baseCurr, quoteCurr] = await Promise.all([
      this.getCurrency(baseCurrencyCode),
      this.getCurrency(quoteCurrencyCode),
    ]);

    return this.prisma.fXRate.upsert({
      where: {
        baseCurrencyId_quoteCurrencyId: {
          baseCurrencyId: baseCurr.id,
          quoteCurrencyId: quoteCurr.id,
        },
      },
      update: {
        rate: rate,
        source: source,
        updatedAt: new Date(),
      },
      create: {
        baseCurrencyId: baseCurr.id,
        quoteCurrencyId: quoteCurr.id,
        rate: rate,
        source: source,
      },
    });
  }

  /**
   * Get current FX rate
   */
  async getRate(baseCurrencyCode: string, quoteCurrencyCode: string) {
    if (baseCurrencyCode === quoteCurrencyCode) {
      return 1.0;
    }

    const [baseCurr, quoteCurr] = await Promise.all([
      this.getCurrency(baseCurrencyCode),
      this.getCurrency(quoteCurrencyCode),
    ]);

    const fxRate = await this.prisma.fXRate.findUnique({
      where: {
        baseCurrencyId_quoteCurrencyId: {
          baseCurrencyId: baseCurr.id,
          quoteCurrencyId: quoteCurr.id,
        },
      },
    });

    if (!fxRate) {
      throw new NotFoundException(
        `No FX rate found for ${baseCurrencyCode}/${quoteCurrencyCode}`
      );
    }

    return parseFloat(fxRate.rate.toString());
  }

  /**
   * Convert amount from base to quote currency
   */
  async convert(
    amount: number,
    baseCurrencyCode: string,
    quoteCurrencyCode: string
  ): Promise<number> {
    const rate = await this.getRate(baseCurrencyCode, quoteCurrencyCode);
    return amount * rate;
  }

  /**
   * Get all rates for base currency
   */
  async getRatesForBase(baseCurrencyCode: string) {
    const baseCurr = await this.getCurrency(baseCurrencyCode);

    const rates = await this.prisma.fXRate.findMany({
      where: {
        baseCurrencyId: baseCurr.id,
      },
      include: {
        quoteCurrency: true,
      },
    });

    return rates.map((r) => ({
      baseCurrency: baseCurrencyCode,
      quoteCurrency: r.quoteCurrency.code,
      rate: parseFloat(r.rate.toString()),
      source: r.source,
      updatedAt: r.updatedAt,
    }));
  }

  /**
   * Get FX rate freshness (last update time)
   */
  async getFreshness(baseCurrencyCode: string, quoteCurrencyCode: string) {
    const rate = await this.getRate(baseCurrencyCode, quoteCurrencyCode);

    const fxRate = await this.prisma.fXRate.findUnique({
      where: {
        baseCurrencyId_quoteCurrencyId: {
          baseCurrencyId: (await this.getCurrency(baseCurrencyCode)).id,
          quoteCurrencyId: (await this.getCurrency(quoteCurrencyCode)).id,
        },
      },
    });

    if (!fxRate) {
      throw new NotFoundException(
        `No FX rate found for ${baseCurrencyCode}/${quoteCurrencyCode}`
      );
    }

    const now = new Date();
    const hoursSinceUpdate = (
      (now.getTime() - fxRate.updatedAt.getTime()) /
      (1000 * 60 * 60)
    ).toFixed(1);

    return {
      rate: rate,
      source: fxRate.source,
      lastUpdated: fxRate.updatedAt,
      hoursSinceUpdate: parseFloat(hoursSinceUpdate),
      isFresh: parseFloat(hoursSinceUpdate) < 1,
    };
  }

  /**
   * Get all currencies (for UI dropdowns)
   */
  async getAllCurrencies() {
    return this.prisma.currency.findMany({
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Helper: Get currency by code, throw if not found
   */
  private async getCurrency(currencyCode: string) {
    const curr = await this.prisma.currency.findUnique({
      where: { code: currencyCode },
    });

    if (!curr) {
      throw new NotFoundException(`Currency ${currencyCode} not found`);
    }

    return curr;
  }
}

// Helper for Decimal type (Prisma Decimal)
class Decimal {
  private value: number;

  constructor(value: number | string) {
    this.value = typeof value === 'string' ? parseFloat(value) : value;
  }

  toString(): string {
    return this.value.toString();
  }

  toFixed(decimals: number): string {
    return this.value.toFixed(decimals);
  }
}
