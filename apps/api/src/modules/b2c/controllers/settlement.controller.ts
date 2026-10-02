import { Controller, Post, Get, Put, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { SettlementService } from '../services/settlement.service';
import { MFAGuard } from '@shared/guards/mfa.guard';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';

@Controller('api/v1/settlements')
@UseGuards(MFAGuard)
export class SettlementController {
  constructor(private settlement: SettlementService) {}

  @Post('execute')
  async execute(@Body() body: any) {
    return this.settlement.executeTwo(body);
  }

  @Put('seller/:id/pay')
  @HttpCode(200)
  async paySeller(@Param('id') id: string, @Body('ref') ref: string) {
    return this.settlement.processSeller(id, ref);
  }

  @Put('inter/:id/pay')
  @HttpCode(200)
  async payInter(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('ref') ref: string,
  ) {
    return this.settlement.payInter(id, tenantId, ref);
  }

  @Get('owed')
  async owed(@CurrentTenant() tenantId: string) {
    return this.settlement.getOwed(tenantId);
  }

  @Get('dashboard')
  async dash(@CurrentTenant() tenantId: string) {
    return this.settlement.dashboard(tenantId);
  }
}
