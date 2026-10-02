import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface PartnershipAgreement {
  partnershipId: string;
  sourceSupplier: string;
  targetSupplier: string;
  partnershipType: 'public' | 'reserved' | 'exclusive';
  status: 'active' | 'paused' | 'terminated';
  defaultCommissionPct: number;
  minMarkupPct: number;
  maxMarkupPct: number;
  allowedCountries?: string[];
}

export interface CommissionRule {
  ruleId: string;
  partnershipId: string;
  commissionPct: number;
  conditions: {
    country?: string;
    channel?: 'b2c' | 'b2b';
    partnerTier?: string;
    season?: string;
    lengthOfStayRange?: [number, number];
  };
}

@Injectable()
export class SupplierPartnershipService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create partnership between source and target supplier
   */
  async createPartnership(
    sourceSupplierTenantId: string,
    targetSupplierTenantId: string,
    data: {
      partnershipType: 'public' | 'reserved' | 'exclusive';
      defaultCommissionPct: number;
      minMarkupPct: number;
      maxMarkupPct: number;
      allowedCountries?: string[];
    },
  ) {
    // Check if partnership already exists
    const existingPartnership = await this.prisma.supplierPartnership.findFirst({
      where: {
        sourceSupplierStr: sourceSupplierTenantId,
        targetSupplierStr: targetSupplierTenantId,
      },
    });

    if (existingPartnership) {
      throw new ConflictException('Partnership already exists between these suppliers');
    }

    // Validate commission bounds
    if (data.defaultCommissionPct < 0 || data.defaultCommissionPct > 100) {
      throw new BadRequestException('Commission percentage must be between 0 and 100');
    }

    if (data.minMarkupPct < 5 || data.maxMarkupPct > 30) {
      throw new BadRequestException('Markup must be between 5% and 30%');
    }

    if (data.minMarkupPct > data.maxMarkupPct) {
      throw new BadRequestException('Minimum markup cannot exceed maximum markup');
    }

    // Create partnership
    const partnership = await this.prisma.supplierPartnership.create({
      data: {
        sourceSupplierStr: sourceSupplierTenantId,
        targetSupplierStr: targetSupplierTenantId,
        partnershipType: data.partnershipType,
        defaultCommissionPct: data.defaultCommissionPct,
        minMarkupPct: data.minMarkupPct,
        maxMarkupPct: data.maxMarkupPct,
        allowedCountries: data.allowedCountries || [],
        status: 'active',
      },
    });

    return partnership;
  }

  /**
   * Add commission rule to partnership
   */
  async addCommissionRule(
    tenantId: string,
    partnershipId: string,
    data: {
      commissionPct: number;
      country?: string;
      channel?: 'b2c' | 'b2b';
      partnerTier?: string;
      season?: string;
      lengthOfStayMin?: number;
      lengthOfStayMax?: number;
    },
  ) {
    const partnership = await this.partyTo(partnershipId, tenantId, true);
    if (!(data.commissionPct >= 0 && data.commissionPct <= 100)) {
      throw new BadRequestException('Commission percentage must be between 0 and 100');
    }

    return this.prisma.supplierCommissionRule.create({
      data: {
        partnershipId,
        supplierId: partnership.sourceSupplierStr,
        baseCommissionPct: data.commissionPct,
        country: data.country,
        channel: data.channel ?? 'all',
        partnerTier: data.partnerTier ?? 'standard',
        season: data.season,
        minLengthOfStay: data.lengthOfStayMin ?? 1,
        maxLengthOfStay: data.lengthOfStayMax,
      },
    });
  }

  /**
   * Commission for a booking: highest-priority matching rule, else the partnership default
   */
  async getApplicableCommission(
    partnershipId: string,
    criteria: {
      country: string;
      channel: 'b2c' | 'b2b';
      partnerTier?: string;
      season?: string;
      lengthOfStay?: number;
    },
  ): Promise<number> {
    const partnership = await this.prisma.supplierPartnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership) {
      throw new NotFoundException('Partnership not found');
    }

    const nights = criteria.lengthOfStay ?? 1;
    const rule = await this.prisma.supplierCommissionRule.findFirst({
      where: {
        partnershipId,
        active: true,
        channel: { in: [criteria.channel, 'all'] },
        partnerTier: criteria.partnerTier ?? 'standard',
        minLengthOfStay: { lte: nights },
        AND: [
          { OR: [{ country: criteria.country }, { country: null }] },
          { OR: [{ season: criteria.season ?? null }, { season: null }] },
          { OR: [{ maxLengthOfStay: null }, { maxLengthOfStay: { gte: nights } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return rule?.baseCommissionPct ?? partnership.defaultCommissionPct;
  }

  /** Loads a partnership only if the tenant is a party to it (optionally only the inventory owner). */
  private async partyTo(partnershipId: string, tenantId: string, sourceOnly = false) {
    const partnership = await this.prisma.supplierPartnership.findFirst({
      where: {
        id: partnershipId,
        OR: sourceOnly
          ? [{ sourceSupplierStr: tenantId }]
          : [{ sourceSupplierStr: tenantId }, { targetSupplierStr: tenantId }],
      },
    });
    if (!partnership) throw new NotFoundException('Partnership not found');
    return partnership;
  }

  /**
   * Update partnership status
   */
  async updatePartnershipStatus(
    tenantId: string,
    partnershipId: string,
    status: 'active' | 'paused' | 'terminated',
  ) {
    await this.partyTo(partnershipId, tenantId);

    return await this.prisma.supplierPartnership.update({
      where: { id: partnershipId },
      data: { status },
    });
  }

  /**
   * Get all partnerships for a supplier
   */
  async getSupplierPartnerships(
    supplierTenantId: string,
    direction: 'outgoing' | 'incoming' | 'all' = 'all',
  ) {
    const where =
      direction === 'outgoing'
        ? { sourceSupplierStr: supplierTenantId }
        : direction === 'incoming'
          ? { targetSupplierStr: supplierTenantId }
          : {
              OR: [
                { sourceSupplierStr: supplierTenantId },
                { targetSupplierStr: supplierTenantId },
              ],
            };

    return await this.prisma.supplierPartnership.findMany({
      where,
      include: {
        commissionRules: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Validate partnership can handle booking
   */
  async validatePartnershipForBooking(
    tenantId: string,
    partnershipId: string,
    data: {
      netRate: number;
      markupPct: number;
      country: string;
      channel: 'b2c' | 'b2b';
    },
  ): Promise<{ isValid: boolean; reason?: string }> {
    const partnership = await this.prisma.supplierPartnership.findFirst({
      where: { id: partnershipId, OR: [{ sourceSupplierStr: tenantId }, { targetSupplierStr: tenantId }] },
    });

    if (!partnership) {
      return { isValid: false, reason: 'Partnership not found' };
    }

    if (partnership.status !== 'active') {
      return { isValid: false, reason: `Partnership is ${partnership.status}` };
    }

    // Validate markup
    if (data.markupPct < partnership.minMarkupPct || data.markupPct > partnership.maxMarkupPct) {
      return {
        isValid: false,
        reason: `Markup must be between ${partnership.minMarkupPct}% and ${partnership.maxMarkupPct}%`,
      };
    }

    // Validate country if restricted
    if (partnership.allowedCountries && partnership.allowedCountries.length > 0) {
      if (!partnership.allowedCountries.includes(data.country)) {
        return {
          isValid: false,
          reason: `Country ${data.country} not allowed for this partnership`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get partnership performance metrics
   */
  async getPartnershipMetrics(
    tenantId: string,
    partnershipId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const partnership = await this.partyTo(partnershipId, tenantId);

    // Get transactions through this partnership
    const transactions = await this.prisma.revenueTransaction.findMany({
      where: {
        originSupplier: partnership.sourceSupplierStr,
        sellingSupplier: partnership.targetSupplierStr,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const metrics = {
      totalBookings: transactions.length,
      totalGuestPaid: transactions.reduce((sum, t) => sum + t.guestPaid, 0),
      totalCommissionPaid: transactions.reduce((sum, t) => sum + t.commissionToHotel, 0),
      averageCommissionPct: 0,
      totalDistributorMarkup: transactions.reduce((sum, t) => sum + t.markupAmount, 0),
      averageMarkupPct: 0,
    };

    if (metrics.totalBookings > 0) {
      metrics.averageCommissionPct =
        (metrics.totalCommissionPaid / metrics.totalGuestPaid) * 100;
      metrics.averageMarkupPct = (metrics.totalDistributorMarkup / metrics.totalGuestPaid) * 100;
    }

    return metrics;
  }

  /**
   * Apply volume discount to commission
   */
  applyVolumeDiscount(
    baseCommissionPct: number,
    bookingCount: number,
    volumeDiscounts: Array<{ min_bookings: number; discount_pct: number }>,
  ): number {
    let finalCommission = baseCommissionPct;

    for (const discount of volumeDiscounts.sort((a, b) => b.min_bookings - a.min_bookings)) {
      if (bookingCount >= discount.min_bookings) {
        finalCommission = Math.max(0, baseCommissionPct - discount.discount_pct);
        break;
      }
    }

    return finalCommission;
  }

  /**
   * Terminate partnership
   */
  async terminatePartnership(partnershipId: string, effectiveDate?: Date) {
    const partnership = await this.prisma.supplierPartnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership) {
      throw new NotFoundException('Partnership not found');
    }

    return await this.prisma.supplierPartnership.update({
      where: { id: partnershipId },
      data: {
        status: 'terminated',
        terminatedAt: effectiveDate || new Date(),
      },
    });
  }
}
