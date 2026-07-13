import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class B2BSearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search B2B marketplace inventory
   * Returns only public_b2b or public_both properties that the reseller tenant
   * either has approval for or can access via open distribution
   */
  async searchMarketplace(
    resellerTenantId: string,
    query: {
      hotelName?: string;
      city?: string;
      countryCode?: string;
      checkInDate: Date;
      checkOutDate: Date;
      adults: number;
      children?: number;
    },
  ) {
    const { hotelName, city, countryCode, checkInDate, checkOutDate } = query;

    // Get approved distribution grants for this reseller
    const approvedGrants = await this.prisma.distributionGrant.findMany({
      where: {
        targetTenantId: resellerTenantId,
        status: 'approved',
      },
      select: { sourceTenantId: true, customB2BMargin: true },
    });

    const approvedSourceTenants = approvedGrants.map((g) => g.sourceTenantId);

    // Find properties that are:
    // 1. Public B2B with open distribution
    // 2. Public B2B with permissioned distribution AND this tenant is approved
    const properties = await this.prisma.property.findMany({
      where: {
        status: 'active',
        visibility: { in: ['public_b2b', 'public_both'] },
        OR: [
          { distributionMode: 'open' },
          {
            distributionMode: 'permissioned',
            tenantId: { in: approvedSourceTenants },
          },
        ],
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(countryCode && {
          country: {
            code: countryCode,
          },
        }),
        ...(hotelName && { name: { contains: hotelName, mode: 'insensitive' } }),
      },
      include: {
        rooms: { include: { photos: true } },
        ratePlans: true,
        tenant: { select: { id: true, name: true } },
      },
    });

    // For each property, get calendar rates and apply markups
    const results = await Promise.all(
      properties.map(async (property) => {
        const calendarRates = await this.prisma.calendarRate.findMany({
          where: {
            propertyId: property.id,
            date: {
              gte: checkInDate,
              lt: checkOutDate,
            },
            stopSell: false,
          },
        });

        // Get the source tenant's B2B markup
        const b2bMarkupRules = await this.prisma.rateMarkup.findMany({
          where: {
            tenantId: property.tenantId,
            channel: 'b2b',
          },
          orderBy: { priority: 'desc' },
        });

        // Apply markup to net rates
        const b2bMarginPercentage =
          approvedGrants.find((g) => g.sourceTenantId === property.tenantId)
            ?.customB2BMargin ||
          b2bMarkupRules[0]?.value ||
          15; // default 15%

        const rooms = property.rooms.map((room) => {
          const plans = property.ratePlans
            .filter((rp) => !rp.roomId || rp.roomId === room.id)
            .map((plan) => {
              const avgNetRate =
                calendarRates.length > 0
                  ? calendarRates.reduce((sum, cr) => sum + cr.netRate, 0) /
                    calendarRates.length
                  : 0;

              const marketplaceRate = Math.round(
                avgNetRate * (1 + b2bMarginPercentage / 100),
              );

              return {
                ratePlanCode: plan.code,
                ratePlanName: plan.name,
                boardType: plan.boardType,
                netRate: Math.round(avgNetRate),
                b2bMargin: b2bMarginPercentage,
                marketplaceRate,
                numberOfNights: Math.ceil(
                  (checkOutDate.getTime() - checkInDate.getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
                availability: Math.min(
                  ...calendarRates.map((cr) => cr.availability),
                ),
              };
            });

          return {
            roomId: room.id,
            roomType: room.type,
            roomCode: room.code,
            maxAdults: room.maxAdults,
            amenityCodes: room.amenityCodes,
            photos: room.photos,
            ratePlans: plans,
          };
        });

        return {
          propertyId: property.id,
          propertyCode: property.code,
          sourceTenantId: property.tenantId,
          sourceTenantName: property.tenant.name,
          propertyName: property.name,
          city: property.city,
          starRating: property.starCategory,
          description: property.description,
          rooms,
        };
      }),
    );

    return results.filter((r) => r.rooms.some((room) => room.ratePlans.length > 0));
  }

  /**
   * Get detailed property info for marketplace (public B2B)
   */
  async getMarketplaceProperty(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        rooms: { include: { photos: true } },
        ratePlans: true,
        tenant: { select: { id: true, name: true } },
      },
    });

    if (!property || !['public_b2b', 'public_both'].includes(property.visibility)) {
      return null;
    }

    return property;
  }
}
