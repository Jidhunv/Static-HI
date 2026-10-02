import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { MFAGuard } from '../../../shared/guards/mfa.guard';
import { CurrentPrincipal, Principal } from '../../../shared/security/principal';
import { CreateSettlementDto, MarkPaidDto } from '../dto/settlement.dto';
import { SettlementService } from '../services/settlement.service';

@Controller('settlements')
export class SettlementController {
  constructor(private settlements: SettlementService) {}

  @Post()
  @UseGuards(MFAGuard)
  create(@CurrentPrincipal() actor: Principal, @Body() dto: CreateSettlementDto) {
    return this.settlements.create(dto, actor);
  }

  @Put(':id/seller-paid')
  @UseGuards(MFAGuard)
  markSellerPaid(@CurrentPrincipal() actor: Principal, @Param('id') id: string, @Body() dto: MarkPaidDto) {
    return this.settlements.markSellerPaid(id, dto.paymentReference, actor);
  }

  @Put(':id/inter-supplier-paid')
  @UseGuards(MFAGuard)
  markInterSupplierPaid(@CurrentPrincipal() actor: Principal, @Param('id') id: string, @Body() dto: MarkPaidDto) {
    return this.settlements.markInterSupplierPaid(id, dto.paymentReference, actor);
  }

  @Get('receivable')
  receivable(@CurrentPrincipal() actor: Principal) {
    return this.settlements.receivable(actor);
  }

  @Get('payable')
  payable(@CurrentPrincipal() actor: Principal) {
    return this.settlements.payable(actor);
  }

  @Get('summary')
  summary(@CurrentPrincipal() actor: Principal) {
    return this.settlements.summary(actor);
  }
}
