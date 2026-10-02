import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettlementChainService } from '../services/settlement-chain.service';
import { ApiKeyGuard } from '../../../shared/guards/api-key.guard';
import { CurrentTenant } from '../../../shared/decorators/current-tenant.decorator';

@Controller('api/v1/b2b/settlement-chain')
@UseGuards(ApiKeyGuard)
export class SettlementChainController {
  constructor(private settlementChainService: SettlementChainService) {}

  // ============== SETTLEMENT EXECUTION ==============

  /**
   * POST /api/v1/b2b/settlement-chain/execute
   * Execute two-tier settlement for booking
   *
   * Tier 1: Guest → Platform → Distributor (Seller)
   * Tier 2: Distributor → Hotel Owner (Inventory Owner)
   */
  @Post('execute')
  @HttpCode(HttpStatus.CREATED)
  async executeSettlementChain(
    @Body()
    body: {
      bookingId: string;
      guestPaid: number;
      sellerTenantId: string;
      inventoryOwnerTenantId: string;
      netRate: number;
      nights: number;
      commissionPct: number;
      platformFeePct?: number;
      gatewayFeePct?: number;
    },
  ) {
    return await this.settlementChainService.executeSettlementChain(body.bookingId, {
      guestPaid: body.guestPaid,
      sellerTenantId: body.sellerTenantId,
      inventoryOwnerTenantId: body.inventoryOwnerTenantId,
      netRate: body.netRate,
      nights: body.nights,
      commissionPct: body.commissionPct,
      platformFeePct: body.platformFeePct || 2,
      gatewayFeePct: body.gatewayFeePct || 3,
    });
  }

  // ============== TIER 1: SELLER SETTLEMENTS ==============

  /**
   * GET /api/v1/b2b/settlement-chain/seller/settlements
   * Get all seller settlements for distributor
   * (Distributor views payments received from platform)
   */
  @Get('seller/settlements')
  async getSellerSettlements(
    @CurrentTenant() distributorTenantId: string,
    @Query('limit') limit: number = 20,
  ) {
    return await this.settlementChainService.getSellerSettlements(distributorTenantId, limit);
  }

  /**
   * PUT /api/v1/b2b/settlement-chain/seller/:settlementId/process
   * Process seller settlement payment from platform to distributor
   */
  @Put('seller/:settlementId/process')
  async processSellerSettlement(
    @Param('settlementId') settlementId: string,
    @Body() body: { bankDetails: any },
  ) {
    return await this.settlementChainService.processSellerSettlement(settlementId, body.bankDetails);
  }

  // ============== TIER 2: INTER-SUPPLIER SETTLEMENTS ==============

  /**
   * GET /api/v1/b2b/settlement-chain/payee/:hotelTenantId
   * Get commissions owed to hotel owner by distributors
   * (Hotel owner views payments owed from distributors)
   */
  @Get('payee/settlements')
  async getSettlementsAsPayee(@CurrentTenant() hotelTenantId: string, @Query('limit') limit: number = 20) {
    return await this.settlementChainService.getInterSupplierSettlementsAsPayee(
      hotelTenantId,
      limit,
    );
  }

  /**
   * GET /api/v1/b2b/settlement-chain/payer/settlements
   * Get commissions owed by distributor to hotel owners
   * (Distributor views its payment obligations)
   */
  @Get('payer/settlements')
  async getSettlementsAsPayer(
    @CurrentTenant() distributorTenantId: string,
    @Query('limit') limit: number = 20,
  ) {
    return await this.settlementChainService.getInterSupplierSettlementsAsPayer(
      distributorTenantId,
      limit,
    );
  }

  /**
   * PUT /api/v1/b2b/settlement-chain/inter-supplier/:settlementId/pay
   * Record inter-supplier settlement payment (Distributor pays Hotel)
   */
  @Put('inter-supplier/:settlementId/pay')
  async recordInterSupplierPayment(
    @CurrentTenant() distributorTenantId: string,
    @Param('settlementId') settlementId: string,
    @Body() body: { paymentReference: string },
  ) {
    return await this.settlementChainService.recordInterSupplierPayment(
      settlementId,
      distributorTenantId,
      body.paymentReference,
    );
  }

  // ============== SETTLEMENT CHAIN SUMMARY ==============

  /**
   * GET /api/v1/b2b/settlement-chain/booking/:bookingId
   * Get complete settlement chain for a booking
   * Shows both Tier 1 and Tier 2 status
   */
  @Get('booking/:bookingId')
  async getSettlementChainSummary(@Param('bookingId') bookingId: string) {
    return await this.settlementChainService.getSettlementChainSummary(bookingId);
  }

  // ============== DASHBOARDS ==============

  /**
   * GET /api/v1/b2b/settlement-chain/distributor/dashboard
   * Dashboard for distributor showing:
   * - Seller settlements received from platform
   * - Inter-supplier payments owed to hotel owners
   * - Net cash position
   */
  @Get('distributor/dashboard')
  async getDistributorDashboard(@CurrentTenant() distributorTenantId: string) {
    return await this.settlementChainService.getDistributorSettlementDashboard(
      distributorTenantId,
    );
  }

  /**
   * GET /api/v1/b2b/settlement-chain/hotel/dashboard
   * Dashboard for hotel owner showing:
   * - Commissions owed by each distributor
   * - Total commissions received
   * - Breakdown by distributor
   */
  @Get('hotel/dashboard')
  async getHotelDashboard(@CurrentTenant() hotelTenantId: string) {
    return await this.settlementChainService.getHotelSettlementDashboard(hotelTenantId);
  }

  // ============== REPORTING & MAINTENANCE ==============

  /**
   * POST /api/v1/b2b/settlement-chain/mark-overdue
   * Find and mark overdue inter-supplier settlements
   * (Called by scheduled job)
   */
  @Post('mark-overdue')
  @HttpCode(HttpStatus.OK)
  async markOverdueSettlements() {
    return await this.settlementChainService.markOverdueSettlements();
  }

  /**
   * GET /api/v1/b2b/settlement-chain/distributor/report/:month
   * Generate monthly settlement report for distributor
   * Shows receivables from platform and payables to hotels
   */
  @Get('distributor/report/:month')
  async getDistributorMonthlyReport(
    @CurrentTenant() distributorTenantId: string,
    @Param('month') month: string, // YYYY-MM format
  ) {
    return await this.settlementChainService.generateDistributorMonthlyReport(
      distributorTenantId,
      month,
    );
  }
}
