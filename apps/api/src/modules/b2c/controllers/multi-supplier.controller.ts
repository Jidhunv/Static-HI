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
import { InventoryPublishingService } from '../services/inventory-publishing.service';
import { InventoryFilteringService } from '../services/inventory-filtering.service';
import { CommissionService } from '../services/commission.service';
import { SupplierBillingService } from '../services/supplier-billing.service';
import { SupplierPartnershipService } from '../services/supplier-partnership.service';
import { ApiKeyGuard, TenantFromApiKey } from '../../api-key/api-key.guard';
import { Public } from '../../../shared/security/access.decorators';

// No user login: authenticated by the tenant's API key instead.
@Public()
@Controller('b2b/multi-supplier')
@UseGuards(ApiKeyGuard)
export class MultiSupplierController {
  constructor(
    private inventoryPublishingService: InventoryPublishingService,
    private inventoryFilteringService: InventoryFilteringService,
    private commissionService: CommissionService,
    private billingService: SupplierBillingService,
    private partnershipService: SupplierPartnershipService,
  ) {}

  // ============== INVENTORY PUBLISHING ==============

  /**
   * POST /api/v1/b2b/multi-supplier/inventory/publish
   * Publish inventory as public for other suppliers
   */
  @Post('inventory/publish')
  @HttpCode(HttpStatus.CREATED)
  async publishInventoryAsPublic(
    @TenantFromApiKey() supplierTenantId: string,
    @Body()
    body: {
      propertyId: string;
      roomId: string;
      ratePlanId: string;
      netRate: number;
      commissionShare: number;
      maxMarkup: number;
      allowedCountries: string[];
      minBookingWindow: number;
      maxBookingWindow: number;
    },
  ) {
    return await this.inventoryPublishingService.publishInventoryAsPublic(supplierTenantId, body);
  }

  /**
   * PUT /api/v1/b2b/multi-supplier/inventory/:propertyId/:roomId/:ratePlanId/private
   * Make inventory private
   */
  @Put('inventory/:propertyId/:roomId/:ratePlanId/private')
  async makeInventoryPrivate(
    @TenantFromApiKey() supplierTenantId: string,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('ratePlanId') ratePlanId: string,
  ) {
    await this.inventoryPublishingService.makeInventoryPrivate(
      supplierTenantId,
      propertyId,
      roomId,
      ratePlanId,
    );
    return { message: 'Inventory made private' };
  }

  /**
   * PUT /api/v1/b2b/multi-supplier/inventory/:propertyId/:roomId/:ratePlanId/pause
   * Pause inventory
   */
  @Put('inventory/:propertyId/:roomId/:ratePlanId/pause')
  async pauseInventory(
    @TenantFromApiKey() supplierTenantId: string,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('ratePlanId') ratePlanId: string,
  ) {
    await this.inventoryPublishingService.pauseInventory(
      supplierTenantId,
      propertyId,
      roomId,
      ratePlanId,
    );
    return { message: 'Inventory paused' };
  }

  /**
   * GET /api/v1/b2b/multi-supplier/inventory/published
   * Get all published inventory
   */
  @Get('inventory/published')
  async getPublishedInventory(@TenantFromApiKey() supplierTenantId: string) {
    return await this.inventoryPublishingService.getPublishedInventory(supplierTenantId);
  }

  /**
   * PUT /api/v1/b2b/multi-supplier/inventory/:propertyId/:roomId/:ratePlanId/commission
   * Update commission for inventory
   */
  @Put('inventory/:propertyId/:roomId/:ratePlanId/commission')
  async updateCommission(
    @TenantFromApiKey() supplierTenantId: string,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Body() body: { newCommissionPct: number },
  ) {
    await this.inventoryPublishingService.updateCommissionForInventory(
      supplierTenantId,
      propertyId,
      roomId,
      ratePlanId,
      body.newCommissionPct,
    );
    return { message: 'Commission updated' };
  }

  // ============== INVENTORY FILTERING & SUBSCRIPTION ==============

  /**
   * POST /api/v1/b2b/multi-supplier/inventory/search
   * Filter public inventory available for subscription
   */
  @Post('inventory/search')
  async filterPublicInventory(
    @Body()
    criteria: {
      guestCountry?: string;
      minCommissionPct?: number;
      maxCommissionPct?: number;
      minStarRating?: number;
      instantBookingOnly?: boolean;
      freeCancellationOnly?: boolean;
      minDaysNotice?: number;
      maxDaysAdvance?: number;
      minProfitMargin?: number;
      partnerTier?: 'gold' | 'silver' | 'bronze' | 'standard';
      limit?: number;
    },
  ) {
    return await this.inventoryFilteringService.filterPublicInventory(criteria);
  }

  /**
   * GET /api/v1/b2b/multi-supplier/inventory/search
   * Text search public inventory
   */
  @Get('inventory/search')
  async searchInventory(
    @Query('q') searchTerm: string,
    @Query('limit') limit: number = 100,
  ) {
    return await this.inventoryFilteringService.searchInventory(searchTerm, limit);
  }

  /**
   * GET /api/v1/b2b/multi-supplier/inventory/trending
   * Get trending inventory
   */
  @Get('inventory/trending')
  async getTrendingInventory(@Query('limit') limit: number = 50) {
    return await this.inventoryFilteringService.getTrendingInventory(limit);
  }

  /**
   * GET /api/v1/b2b/multi-supplier/inventory/summary
   * Get inventory summary dashboard
   */
  @Get('inventory/summary')
  async getInventorySummary(@TenantFromApiKey() supplierTenantId: string) {
    return await this.inventoryFilteringService.getInventorySummary(supplierTenantId);
  }

  /**
   * POST /api/v1/b2b/multi-supplier/inventory/calculate-price
   * Calculate effective price with markup and commission
   */
  @Post('inventory/calculate-price')
  async calculateEffectivePrice(
    @Body() body: { netRate: number; markupPct: number; commissionPct: number },
  ) {
    return this.inventoryFilteringService.calculateEffectivePrice(
      body.netRate,
      body.markupPct,
      body.commissionPct,
    );
  }

  // ============== PARTNERSHIPS ==============

  /**
   * POST /api/v1/b2b/multi-supplier/partnerships
   * Create partnership with another supplier
   */
  @Post('partnerships')
  @HttpCode(HttpStatus.CREATED)
  async createPartnership(
    @TenantFromApiKey() sourceSupplierTenantId: string,
    @Body()
    body: {
      targetSupplierTenantId: string;
      partnershipType: 'public' | 'reserved' | 'exclusive';
      defaultCommissionPct: number;
      minMarkupPct: number;
      maxMarkupPct: number;
      allowedCountries?: string[];
    },
  ) {
    return await this.partnershipService.createPartnership(sourceSupplierTenantId, body.targetSupplierTenantId, {
      partnershipType: body.partnershipType,
      defaultCommissionPct: body.defaultCommissionPct,
      minMarkupPct: body.minMarkupPct,
      maxMarkupPct: body.maxMarkupPct,
      allowedCountries: body.allowedCountries,
    });
  }

  /**
   * GET /api/v1/b2b/multi-supplier/partnerships
   * Get supplier partnerships
   */
  @Get('partnerships')
  async getPartnerships(
    @TenantFromApiKey() supplierTenantId: string,
    @Query('direction') direction: 'outgoing' | 'incoming' | 'all' = 'all',
  ) {
    return await this.partnershipService.getSupplierPartnerships(supplierTenantId, direction);
  }

  /**
   * PUT /api/v1/b2b/multi-supplier/partnerships/:partnershipId
   * Update partnership status
   */
  @Put('partnerships/:partnershipId')
  async updatePartnershipStatus(
    @TenantFromApiKey() tenantId: string,
    @Param('partnershipId') partnershipId: string,
    @Body() body: { status: 'active' | 'paused' | 'terminated' },
  ) {
    return await this.partnershipService.updatePartnershipStatus(tenantId, partnershipId, body.status);
  }

  /**
   * GET /api/v1/b2b/multi-supplier/partnerships/:partnershipId/metrics
   * Get partnership performance metrics
   */
  @Get('partnerships/:partnershipId/metrics')
  async getPartnershipMetrics(
    @TenantFromApiKey() tenantId: string,
    @Param('partnershipId') partnershipId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.partnershipService.getPartnershipMetrics(
      tenantId,
      partnershipId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * POST /api/v1/b2b/multi-supplier/partnerships/:partnershipId/commission-rules
   * Add commission rule to partnership
   */
  @Post('partnerships/:partnershipId/commission-rules')
  @HttpCode(HttpStatus.CREATED)
  async addCommissionRule(
    @TenantFromApiKey() tenantId: string,
    @Param('partnershipId') partnershipId: string,
    @Body()
    body: {
      commissionPct: number;
      country?: string;
      channel?: 'b2c' | 'b2b';
      partnerTier?: string;
      season?: string;
      lengthOfStayMin?: number;
      lengthOfStayMax?: number;
    },
  ) {
    return await this.partnershipService.addCommissionRule(tenantId, partnershipId, body);
  }

  /**
   * POST /api/v1/b2b/multi-supplier/partnerships/:partnershipId/validate
   * Validate partnership for booking
   */
  @Post('partnerships/:partnershipId/validate')
  async validatePartnershipForBooking(
    @TenantFromApiKey() tenantId: string,
    @Param('partnershipId') partnershipId: string,
    @Body()
    body: {
      netRate: number;
      markupPct: number;
      country: string;
      channel: 'b2c' | 'b2b';
    },
  ) {
    return await this.partnershipService.validatePartnershipForBooking(tenantId, partnershipId, body);
  }

  // ============== COMMISSIONS ==============

  /**
   * GET /api/v1/b2b/multi-supplier/commissions/summary
   * Get commission summary for supplier
   */
  @Get('commissions/summary')
  async getCommissionSummary(
    @TenantFromApiKey() supplierTenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.commissionService.getCommissionSummary(
      supplierTenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * GET /api/v1/b2b/multi-supplier/commissions/distributor-summary
   * Get commission summary for distributor
   */
  @Get('commissions/distributor-summary')
  async getDistributorSummary(
    @TenantFromApiKey() distributorTenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.commissionService.getDistributorCommissionSummary(
      distributorTenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * POST /api/v1/b2b/multi-supplier/commissions/calculate
   * Calculate revenue split for booking
   */
  @Post('commissions/calculate')
  async calculateRevenueSplit(
    @Body()
    body: {
      guestPaid: number;
      netRate: number;
      nights: number;
      commissionPct: number;
      markupPct?: number;
      platformFeePct?: number;
      gatewayFeePct?: number;
      taxPct?: number;
    },
  ) {
    return this.commissionService.calculateRevenueSplit(
      body.guestPaid,
      body.netRate,
      body.nights,
      body.commissionPct,
      body.markupPct,
      body.platformFeePct,
      body.gatewayFeePct,
      body.taxPct,
    );
  }

  // ============== BILLING & SETTLEMENTS ==============

  /**
   * POST /api/v1/b2b/multi-supplier/billing/invoice/:period
   * Generate monthly invoice
   */
  @Post('billing/invoice/:period')
  @HttpCode(HttpStatus.CREATED)
  async generateInvoice(
    @TenantFromApiKey() supplierId: string,
    @Param('period') period: string,
  ) {
    return await this.billingService.generateMonthlyInvoice(supplierId, period);
  }

  /**
   * GET /api/v1/b2b/multi-supplier/billing/invoices
   * Get supplier invoices
   */
  @Get('billing/invoices')
  async getInvoices(
    @TenantFromApiKey() supplierId: string,
    @Query('limit') limit: number = 20,
  ) {
    return await this.billingService.getSupplierInvoices(supplierId, limit);
  }

  /**
   * PUT /api/v1/b2b/multi-supplier/billing/invoice/:invoiceId/send
   * Send invoice to supplier
   */
  @Put('billing/invoice/:invoiceId/send')
  async sendInvoice(@TenantFromApiKey() supplierId: string, @Param('invoiceId') invoiceId: string) {
    return await this.billingService.sendInvoice(supplierId, invoiceId);
  }

  /**
   * PUT /api/v1/b2b/multi-supplier/billing/invoice/:invoiceId/mark-paid
   * Mark invoice as paid
   */
  @Put('billing/invoice/:invoiceId/mark-paid')
  async markInvoicePaid(
    @TenantFromApiKey() supplierId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() body: { paymentReference: string },
  ) {
    return await this.billingService.markInvoicePaid(supplierId, invoiceId, body.paymentReference);
  }

  /**
   * GET /api/v1/b2b/multi-supplier/billing/summary
   * Get billing summary
   */
  @Get('billing/summary')
  async getBillingSummary(@TenantFromApiKey() supplierId: string) {
    return await this.billingService.getBillingSummary(supplierId);
  }

  /**
   * POST /api/v1/b2b/multi-supplier/billing/fee-breakdown
   * Calculate fee breakdown
   */
  @Post('billing/fee-breakdown')
  async calculateFeeBreakdown(
    @Body()
    body: {
      grossAmount: number;
      platformFeePct?: number;
      gatewayFeePct?: number;
    },
  ) {
    return this.billingService.calculateFeeBreakdown(
      body.grossAmount,
      body.platformFeePct,
      body.gatewayFeePct,
    );
  }

  /**
   * GET /api/v1/b2b/multi-supplier/billing/due-dates
   * Get upcoming payment due dates
   */
  @Get('billing/due-dates')
  async getUpcomingDueDates(@TenantFromApiKey() supplierId: string, @Query('limit') limit: number = 10) {
    return await this.billingService.getUpcomingDueDates(supplierId, limit);
  }
}
