import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class B2CSearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Public search for a tenant's B2C storefront
   * Returns tenant's own inventory + any B2B inventory they've sourced
   * All rates shown are the final B2C sell rates (never net rates or marketplace rates)
   */
  async searchTenantInventory(
    tenantSlug: string,
    query: {
      hotelName?: string;
      city?: string;
      checkInDate: Date;
      checkOutDate: Date;
      adults: number;
      children?: number;
    },
  ) {
    // Get tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        logoUrl: true,
        defaultB2CMarkup: true,
      },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const { hotelName, city, checkInDate, checkOutDate } = query;

    // Find properties that are:
    // 1. Owned by this tenant and public for B2C, OR
    // 2. Publicly available on B2B marketplace (this tenant can source them)
    const properties = await this.prisma.property.findMany({
      where: {
        status: 'active',
        visibility: { in: ['public_b2c', 'public_both'] },
        tenantId: tenant.id,
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(hotelName && { name: { contains: hotelName, mode: 'insensitive' } }),
      },
      include: {
        rooms: { include: { photos: true } },
        ratePlans: true,
        chargeRules: { where: { kind: 'fee' } },
      },
    });

    // TODO: Also query B2B sourced inventory from approved distribution grants

    // For each property, get calendar rates and apply tenant's B2C markup
    const results = await Promise.all(
      properties.map(async (property) => {
        const calendarRates = await this.prisma.calendarRate.findMany({
          where: {
            propertyId: property.id,
            date: { gte: checkInDate, lt: checkOutDate },
            stopSell: false,
          },
        });

        if (calendarRates.length === 0) {
          return null; // No availability
        }

        // Get B2C markup rules for this property
        const b2cMarkupRules = await this.prisma.rateMarkup.findMany({
          where: {
            tenantId: tenant.id,
            channel: 'b2c',
          },
          orderBy: { priority: 'desc' },
        });

        const b2cMarkupPercentage =
          b2cMarkupRules[0]?.value || tenant.defaultB2CMarkup || 25;

        const numberOfNights = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        const rooms = property.rooms.map((room) => {
          const plans = property.ratePlans
            .filter((rp) => !rp.roomId || rp.roomId === room.id)
            .map((plan) => {
              const avgNetRate =
                calendarRates.length > 0
                  ? calendarRates.reduce((sum, cr) => sum + cr.netRate, 0) /
                    calendarRates.length
                  : 0;

              // Calculate B2C sell rate: netRate + markup
              const b2cSellRate = Math.round(
                avgNetRate * (1 + b2cMarkupPercentage / 100),
              );

              return {
                ratePlanCode: plan.code,
                ratePlanName: plan.name,
                boardType: plan.boardType,
                b2cSellRate,
                numberOfNights,
                minLengthOfStay: plan.minLengthOfStay,
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
            maxOccupancy: room.maxOccupancy,
            amenityCodes: room.amenityCodes,
            photos: room.photos,
            ratePlans: plans.filter((p) => p.availability > 0),
          };
        });

        return {
          propertyId: property.id,
          propertyCode: property.code,
          propertyName: property.name,
          city: property.city,
          starRating: property.starCategory,
          description: property.description,
          checkInTime: property.checkInTime,
          checkOutTime: property.checkOutTime,
          rooms: rooms.filter((r) => r.ratePlans.length > 0),
        };
      }),
    );

    return {
      tenant: {
        name: tenant.name,
        primaryColor: tenant.primaryColor,
        logoUrl: tenant.logoUrl,
      },
      results: results.filter((r) => r !== null),
    };
  }

  /**
   * Get public property details
   */
  async getPublicPropertyDetails(
    tenantSlug: string,
    propertyId: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId: tenant.id,
        visibility: { in: ['public_b2c', 'public_both'] },
      },
      include: {
        rooms: { include: { photos: true } },
        ratePlans: true,
        chargeRules: true,
      },
    });

    if (!property) {
      return null;
    }

    return property;
  }

  /**
   * Get room availability for specific dates
   */
  async getRoomAvailability(
    tenantSlug: string,
    propertyId: string,
    roomCode: string,
    checkInDate: Date,
    checkOutDate: Date,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, defaultB2CMarkup: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId: tenant.id,
        visibility: { in: ['public_b2c', 'public_both'] },
      },
    });

    if (!property) {
      return null;
    }

    const room = await this.prisma.room.findFirst({
      where: {
        propertyId,
        code: roomCode,
      },
      include: {
        ratePlans: true,
      },
    });

    if (!room) {
      return null;
    }

    // Get calendar rates for the period
    const calendarRates = await this.prisma.calendarRate.findMany({
      where: {
        roomId: room.id,
        date: { gte: checkInDate, lt: checkOutDate },
        stopSell: false,
      },
      include: { ratePlan: true },
    });

    const numberOfNights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      roomCode,
      roomType: room.type,
      numberOfNights,
      availability: Math.min(...calendarRates.map((cr) => cr.availability)),
      rates: calendarRates.map((cr) => ({
        date: cr.date,
        netRatePerNight: cr.netRate,
        availability: cr.availability,
      })),
    };
  }
}
