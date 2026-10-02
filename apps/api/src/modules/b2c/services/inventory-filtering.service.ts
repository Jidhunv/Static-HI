import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

interface InventoryFilterCriteria {
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
}

@Injectable()
export class InventoryFilteringService {
  constructor(private prisma: PrismaService) {}

  /**
   * Filter public inventory based on multiple criteria
   * Used by distributors to find which inventory to subscribe to
   */
  async filterPublicInventory(criteria: InventoryFilterCriteria) {
    const {
      guestCountry = 'US',
      minCommissionPct = 8,
      maxCommissionPct = 30,
      minStarRating = 3,
      instantBookingOnly = false,
      freeCancellationOnly = false,
      minDaysNotice = 0,
      maxDaysAdvance = 365,
      minProfitMargin = 10,
      partnerTier = 'standard',
      limit = 10000,
    } = criteria;

    // Build the query
    let query = this.prisma.inventoryVisibility.findMany({
      where: {
        // Must be public and active
        visibilityLevel: 'public',
        status: 'active',

        // Geographic filter
        OR: [
          { allowedCountries: { has: guestCountry } },
          { allowedCountries: { isEmpty: true } }, // Empty = all countries
        ],

        // Commission range
        commissionShare: {
          gte: minCommissionPct,
          lte: maxCommissionPct,
        },

        // Booking window
        minBookingWindow: { lte: minDaysNotice },
        maxBookingWindow: { gte: maxDaysAdvance },

        // Property quality
        property: {
          starCategory: { gte: minStarRating },
          visibility: { in: ['public_b2c', 'public_both'] },
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            starCategory: true,
            visibility: true,
          },
        },
        room: {
          select: {
            id: true,
            type: true,
            code: true,
            maxOccupancy: true,
          },
        },
        ratePlan: {
          select: {
            id: true,
            code: true,
            name: true,
            boardType: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { commissionShare: 'desc' }, // High commission first
        { property: { starCategory: 'desc' } }, // Better hotels first
      ],
    });

    const inventories = await query;

    // Post-filter for profit margin
    const filtered = inventories.filter((inv) => {
      if (!inv.netRate || !inv.maxMarkup) return false;

      // Calculate if profit margin meets minimum
      const grossMargin = inv.netRate * (inv.maxMarkup / 100);
      const commissionCost = inv.netRate * ((inv.commissionShare ?? 0) / 100);
      const netProfit = grossMargin - commissionCost;
      const profitMarginPct = (netProfit / inv.netRate) * 100;

      return profitMarginPct >= minProfitMargin;
    });

    return {
      total: filtered.length,
      inventories: filtered,
    };
  }

  /**
   * Calculate effective price with commission & markup
   */
  calculateEffectivePrice(
    netRate: number,
    markupPct: number,
    commissionPct: number,
  ) {
    const markupAmount = netRate * (markupPct / 100);
    const guestPrice = netRate + markupAmount;
    const commissionToHotel = netRate * (commissionPct / 100);
    const distributorProfit = markupAmount - commissionToHotel;

    return {
      netRate,
      markupAmount,
      guestPrice,
      commissionToHotel,
      distributorProfit,
      profitMarginPct: (distributorProfit / netRate) * 100,
    };
  }

  /**
   * Check if inventory is available for a specific supplier
   */
  async isInventoryAvailable(
    supplierTenantId: string,
    propertyId: string,
    roomId: string,
    ratePlanId: string,
  ): Promise<boolean> {
    const visibility = await this.prisma.inventoryVisibility.findFirst({
      where: {
        propertyId,
        roomId,
        ratePlanId,
        visibilityLevel: 'public',
        status: 'active',
      },
    });

    return !!visibility;
  }

  /**
   * Get filtered inventory summary for dashboard
   */
  async getInventorySummary(supplierTenantId: string) {
    const inventories = await this.prisma.inventoryVisibility.groupBy({
      by: ['visibilityLevel', 'status'],
      where: {
        supplierTenantId,
      },
      _count: {
        id: true,
      },
    });

    return inventories;
  }

  /**
   * Search inventory by property, room, or rate plan code
   */
  async searchInventory(searchTerm: string, limit = 100) {
    return await this.prisma.inventoryVisibility.findMany({
      where: {
        visibilityLevel: 'public',
        status: 'active',
        OR: [
          { property: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { room: { type: { contains: searchTerm, mode: 'insensitive' } } },
          { ratePlan: { name: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      },
      include: {
        property: true,
        room: true,
        ratePlan: true,
      },
      take: limit,
    });
  }

  /**
   * Get trending inventory by popularity/bookings
   */
  async getTrendingInventory(limit = 50) {
    // Get inventory with most recent bookings
    return await this.prisma.inventoryVisibility.findMany({
      where: {
        visibilityLevel: 'public',
        status: 'active',
      },
      include: {
        property: true,
        room: true,
        ratePlan: true,
        revenueTransactions: {
          take: 1,
          orderBy: { transactionDate: 'desc' },
        },
      },
      orderBy: {
        revenueTransactions: {
          _count: 'desc',
        },
      },
      take: limit,
    });
  }
}
