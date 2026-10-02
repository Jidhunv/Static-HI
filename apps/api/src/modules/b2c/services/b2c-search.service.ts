import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { daysUntil, MS_PER_DAY, priceStay, publishedTo, PublishedTerms } from './stay-pricing';

const pairKey = (roomId: string, ratePlanId: string) => `${roomId}:${ratePlanId}`;

@Injectable()
export class B2CSearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Public search for a tenant's B2C storefront.
   * Returns the tenant's own inventory plus inventory other suppliers have published to it.
   * All rates shown are final B2C sell rates (never net rates).
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
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, primaryColor: true, logoUrl: true, defaultB2CMarkup: true },
    });
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const { hotelName, city, checkInDate, checkOutDate } = query;
    const numberOfNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / MS_PER_DAY);
    const daysAhead = daysUntil(checkInDate);
    const propertyFilter = {
      status: 'active',
      ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
      ...(hotelName && { name: { contains: hotelName, mode: 'insensitive' as const } }),
    };

    const [published, markupRule] = await Promise.all([
      this.prisma.inventoryVisibility.findMany({
        where: {
          ...publishedTo(tenant.id),
          minBookingWindow: { lte: daysAhead },
          maxBookingWindow: { gte: daysAhead },
          property: propertyFilter,
        },
        orderBy: { visibilityLevel: 'asc' }, // 'reserved' sorts last, so it overrides 'public' below
      }),
      this.prisma.rateMarkup.findFirst({
        where: { tenantId: tenant.id, channel: 'b2c' },
        orderBy: { priority: 'desc' },
      }),
    ]);
    const markupPct = markupRule?.value || tenant.defaultB2CMarkup || 25;

    const termsByProperty = new Map<string, Map<string, PublishedTerms>>();
    for (const v of published) {
      if (!termsByProperty.has(v.propertyId)) termsByProperty.set(v.propertyId, new Map());
      termsByProperty.get(v.propertyId)!.set(pairKey(v.roomId, v.ratePlanId), v);
    }

    const properties = await this.prisma.property.findMany({
      where: {
        ...propertyFilter,
        OR: [
          { tenantId: tenant.id, visibility: { in: ['public_b2c', 'public_both'] } },
          { id: { in: [...termsByProperty.keys()] } },
        ],
      },
      include: { rooms: { include: { photos: true } }, ratePlans: true },
    });

    const calendarRates = await this.prisma.calendarRate.findMany({
      where: {
        propertyId: { in: properties.map((p) => p.id) },
        date: { gte: checkInDate, lt: checkOutDate },
        stopSell: false,
      },
      select: { roomId: true, ratePlanId: true, netRate: true, availability: true },
    });
    const ratesByPair = new Map<string, typeof calendarRates>();
    for (const cr of calendarRates) {
      const key = pairKey(cr.roomId, cr.ratePlanId);
      if (!ratesByPair.has(key)) ratesByPair.set(key, []);
      ratesByPair.get(key)!.push(cr);
    }

    const results = properties.map((property) => {
      const own = property.tenantId === tenant.id;
      const terms = termsByProperty.get(property.id);

      const rooms = property.rooms.map((room) => {
        const ratePlans = property.ratePlans
          .filter((plan) => !plan.roomId || plan.roomId === room.id)
          .flatMap((plan) => {
            const key = pairKey(room.id, plan.id);
            const rates = ratesByPair.get(key);
            const published = own ? null : terms?.get(key);
            if (!rates || (!own && !published)) return [];

            const availability = Math.min(...rates.map((cr) => cr.availability));
            const price = priceStay(rates.map((cr) => cr.netRate), markupPct, numberOfNights, published);
            if (availability < 1 || !price.sellable) return [];

            return [
              {
                ratePlanCode: plan.code,
                ratePlanName: plan.name,
                boardType: plan.boardType,
                b2cSellRate: price.sellRate,
                numberOfNights,
                minLengthOfStay: plan.minLengthOfStay,
                availability,
              },
            ];
          });

        return {
          roomId: room.id,
          roomType: room.type,
          roomCode: room.code,
          maxAdults: room.maxAdults,
          maxOccupancy: room.maxOccupancy,
          amenityCodes: room.amenityCodes,
          photos: room.photos,
          ratePlans,
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
    });

    return {
      tenant: { name: tenant.name, primaryColor: tenant.primaryColor, logoUrl: tenant.logoUrl },
      results: results.filter((r) => r.rooms.length > 0),
    };
  }

  /**
   * What a storefront tenant may show for a property: everything if it is the tenant's own public
   * property, only the published room and rate plan pairs if it belongs to another supplier.
   */
  private async sellableProperty(tenantSlug: string, propertyId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, defaultB2CMarkup: true },
    });
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { rooms: { include: { photos: true } }, ratePlans: true, chargeRules: true },
    });
    if (!property) return null;

    if (property.tenantId === tenant.id) {
      return ['public_b2c', 'public_both'].includes(property.visibility) ? { property, published: null } : null;
    }

    const published = await this.prisma.inventoryVisibility.findMany({
      where: { ...publishedTo(tenant.id), propertyId },
    });
    if (property.status !== 'active' || published.length === 0) return null;
    return { property, published };
  }

  /**
   * Get public property details
   */
  async getPublicPropertyDetails(tenantSlug: string, propertyId: string) {
    const sellable = await this.sellableProperty(tenantSlug, propertyId);
    if (!sellable) return null;

    const { property, published } = sellable;
    if (!published) return property;

    const roomIds = new Set(published.map((v) => v.roomId));
    const ratePlanIds = new Set(published.map((v) => v.ratePlanId));
    return {
      ...property,
      rooms: property.rooms.filter((room) => roomIds.has(room.id)),
      ratePlans: property.ratePlans.filter((plan) => ratePlanIds.has(plan.id)),
    };
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
    const sellable = await this.sellableProperty(tenantSlug, propertyId);
    if (!sellable) return null;

    const room = sellable.property.rooms.find((r) => r.code === roomCode);
    if (!room) return null;

    // For another supplier's room, only the published rate plans, at the published net rate
    const terms = sellable.published?.filter((v) => v.roomId === room.id);
    if (terms && terms.length === 0) return null;

    const calendarRates = await this.prisma.calendarRate.findMany({
      where: {
        roomId: room.id,
        ...(terms && { ratePlanId: { in: terms.map((v) => v.ratePlanId) } }),
        date: { gte: checkInDate, lt: checkOutDate },
        stopSell: false,
      },
    });

    return {
      roomCode,
      roomType: room.type,
      numberOfNights: Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / MS_PER_DAY),
      availability: Math.min(...calendarRates.map((cr) => cr.availability)),
      rates: calendarRates.map((cr) => ({
        date: cr.date,
        netRatePerNight: terms?.find((v) => v.ratePlanId === cr.ratePlanId)?.netRate ?? cr.netRate,
        availability: cr.availability,
      })),
    };
  }
}
