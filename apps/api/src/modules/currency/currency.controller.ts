import { Controller, Get, Post, Body, Param, HttpCode, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private currencyService: CurrencyService) {}

  @Get()
  async getCurrencies() {
    return this.currencyService.getCurrencies();
  }

  @Get(':id')
  async getCurrency(@Param('id') id: string) {
    return this.currencyService.getCurrencyById(id);
  }

  @Get(':id/rates')
  async getCurrencyRates(@Param('id') id: string) {
    return this.currencyService.getCurrencyById(id);
  }

  @Get('rate/history/:baseCurrencyId/:quoteCurrencyId')
  async getFXRateHistory(
    @Param('baseCurrencyId') baseCurrencyId: string,
    @Param('quoteCurrencyId') quoteCurrencyId: string,
    @Query('limit') limit = 30,
  ) {
    return this.currencyService.getFXRateHistory(baseCurrencyId, quoteCurrencyId, parseInt(limit.toString()));
  }

  @Get('chart/:baseCurrencyId/:quoteCurrencyId')
  async getRateChart(
    @Param('baseCurrencyId') baseCurrencyId: string,
    @Param('quoteCurrencyId') quoteCurrencyId: string,
    @Query('days') days = 30,
  ) {
    return this.currencyService.getRateChart(
      baseCurrencyId,
      quoteCurrencyId,
      parseInt(days.toString()),
    );
  }

  @Get('latest/all')
  async getLatestRates() {
    return this.currencyService.getLatestRates();
  }

  @Post('update')
  @HttpCode(200)
  async updateFXRate(
    @Body()
    body: {
      baseCurrencyId: string;
      quoteCurrencyId: string;
      rate: number | string;
      source?: 'manual' | 'api';
      apiProvider?: string;
      updatedBy?: string;
      updateReason?: string;
    },
  ) {
    return this.currencyService.updateFXRate(
      body.baseCurrencyId,
      body.quoteCurrencyId,
      body.rate,
      body.source || 'manual',
      body.apiProvider,
      body.updatedBy,
      body.updateReason,
    );
  }

  @Post('bulk-update')
  @HttpCode(200)
  async bulkUpdateFXRates(
    @Body()
    body: {
      rates: Array<{
        baseCurrencyCode: string;
        quoteCurrencyCode: string;
        rate: number | string;
      }>;
      apiProvider?: string;
    },
  ) {
    return this.currencyService.bulkUpdateFXRates(body.rates, 'api', body.apiProvider);
  }
}
