import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { FXRateService } from './fx-rate.service';

@Controller('fx')
export class FXRateController {
  constructor(private service: FXRateService) {}

  /**
   * Initialize default currencies (Super Admin only)
   */
  @Post('init-currencies')
  async initCurrencies() {
    const count = await this.service.initializeCurrencies();
    return { message: `Initialized ${count} currencies` };
  }

  /**
   * Get all currencies
   */
  @Get('currencies')
  async getCurrencies() {
    return this.service.getAllCurrencies();
  }

  /**
   * Set FX rate manually (Super Admin)
   */
  @Put('rates/:baseCurrency/:quoteCurrency')
  async setRate(
    @Param('baseCurrency') baseCurrency: string,
    @Param('quoteCurrency') quoteCurrency: string,
    @Body() body: { rate: number }
  ) {
    return this.service.setRate(baseCurrency, quoteCurrency, body.rate);
  }

  /**
   * Get current FX rate
   */
  @Get('rates/:baseCurrency/:quoteCurrency')
  async getRate(
    @Param('baseCurrency') baseCurrency: string,
    @Param('quoteCurrency') quoteCurrency: string
  ) {
    const rate = await this.service.getRate(baseCurrency, quoteCurrency);
    return {
      baseCurrency,
      quoteCurrency,
      rate,
    };
  }

  /**
   * Get FX rate with freshness info
   */
  @Get('rates/:baseCurrency/:quoteCurrency/freshness')
  async getFreshness(
    @Param('baseCurrency') baseCurrency: string,
    @Param('quoteCurrency') quoteCurrency: string
  ) {
    return this.service.getFreshness(baseCurrency, quoteCurrency);
  }

  /**
   * Convert amount
   */
  @Post('convert')
  async convert(
    @Body()
    body: {
      amount: number;
      baseCurrency: string;
      quoteCurrency: string;
    }
  ) {
    const converted = await this.service.convert(
      body.amount,
      body.baseCurrency,
      body.quoteCurrency
    );

    return {
      amount: body.amount,
      baseCurrency: body.baseCurrency,
      quoteCurrency: body.quoteCurrency,
      rate: await this.service.getRate(body.baseCurrency, body.quoteCurrency),
      converted,
    };
  }

  /**
   * Get all rates for base currency
   */
  @Get('rates/:baseCurrency')
  async getRatesForBase(@Param('baseCurrency') baseCurrency: string) {
    return this.service.getRatesForBase(baseCurrency);
  }

  /**
   * Update rate from API (called by scheduled job)
   */
  @Put('rates-api/:baseCurrency/:quoteCurrency')
  async updateFromAPI(
    @Param('baseCurrency') baseCurrency: string,
    @Param('quoteCurrency') quoteCurrency: string,
    @Body() body: { rate: number; source?: string }
  ) {
    return this.service.updateFromAPI(
      baseCurrency,
      quoteCurrency,
      body.rate,
      body.source
    );
  }
}
