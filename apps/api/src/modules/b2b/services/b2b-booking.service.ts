import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class B2BBookingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a B2B booking (reseller books from source tenant's inventory)
   */
  async createB2BBooking(
    resellerTenantId: string,
    dto: {
      propertyId: string;
      sourceTenantId: string;
      roomTypeCode: string;
      ratePlanCode: string;
      checkInDate: Date;
      checkOutDate: Date;
      adults: number;
      children?: number;
      guestEmail: string;
      guestName: string;
      guestPhone?: string;
    },
  ) {
    // Verify property exists and belongs to source tenant
    const property = await this.prisma.property.findFirst({
      where: {
        id: dto.propertyId,
        tenantId: dto.sourceTenantId,
        visibility: { in: ['public_b2b', 'public_both'] },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found or access denied');
    }

    // Verify reseller has access (either open or approved grant)
    const grant = await this.prisma.distributionGrant.findUnique({
      where: {
        sourceTenantId_targetTenantId: {
          sourceTenantId: dto.sourceTenantId,
          targetTenantId: resellerTenantId,
        },
      },
    });

    if (
      property.distributionMode === 'permissioned' &&
      (!grant || grant.status !== 'approved')
    ) {
      throw new BadRequestException(
        'No permission to book from this property',
      );
    }

    // Find room and rate plan
    const room = await this.prisma.room.findFirst({
      where: { propertyId: dto.propertyId, code: dto.roomTypeCode },
    });

    if (!room) {
      throw new NotFoundException('Room type not found');
    }

    const ratePlan = await this.prisma.ratePlan.findFirst({
      where: { propertyId: dto.propertyId, code: dto.ratePlanCode },
    });

    if (!ratePlan) {
      throw new NotFoundException('Rate plan not found');
    }

    // Get calendar rates and verify availability
    const calendarRates = await this.prisma.calendarRate.findMany({
      where: {
        roomId: room.id,
        ratePlanId: ratePlan.id,
        date: { gte: dto.checkInDate, lt: dto.checkOutDate },
      },
    });

    if (calendarRates.length === 0) {
      throw new BadRequestException('No availability for selected dates');
    }

    const minAvailability = Math.min(
      ...calendarRates.map((cr) => cr.availability),
    );
    if (minAvailability < 1) {
      throw new BadRequestException('Insufficient availability');
    }

    // Calculate rates and markups
    const numberOfNights = Math.ceil(
      (dto.checkOutDate.getTime() - dto.checkInDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const avgNetRate =
      calendarRates.reduce((sum, cr) => sum + cr.netRate, 0) /
      calendarRates.length;

    // Get source tenant's B2B margin
    const b2bMarginPercentage =
      grant?.customB2BMargin ||
      (await this.getDefaultB2BMargin(dto.sourceTenantId));

    const marketplaceRate = Math.round(
      avgNetRate * (1 + b2bMarginPercentage / 100),
    );

    // Calculate subtotal
    const subtotal = Math.round(marketplaceRate * numberOfNights);

    // Get applicable taxes
    const taxTotal = Math.round(subtotal * 0.1); // 10% tax (simplified)

    const finalRate = subtotal + taxTotal;

    // Create booking
    const bookingCode = `${property.code}-B2B-${nanoid(8).toUpperCase()}`;
    const confirmationNo = `CONF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nanoid(5).toUpperCase()}`;

    const booking = await this.prisma.booking.create({
      data: {
        systemConfirmationNo: confirmationNo,
        bookingCode,
        propertyId: dto.propertyId,
        tenantId: resellerTenantId,
        sourceTenantId: dto.sourceTenantId,
        resellerTenantId,
        bookingType: 'b2b',
        guestEmail: dto.guestEmail,
        guestName: dto.guestName,
        guestPhone: dto.guestPhone,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
        roomType: 'Standard',
        roomTypeCode: dto.roomTypeCode,
        ratePlanCode: dto.ratePlanCode,
        adults: dto.adults,
        children: dto.children || 0,
        rateType: 'international',
        rateAmount: marketplaceRate,
        totalAmount: finalRate,
        currency: 'USD',
        numberOfGuests: dto.adults + (dto.children || 0),
        netRate: Math.round(avgNetRate),
        numberOfNights,
        subtotal,
        source: 'b2b',
        status: 'confirmed',

        // Create rate breakdown for audit
        rateBreakdown: {
          create: {
            sourceTenantId: dto.sourceTenantId,
            resellerTenantId,
            netRate: Math.round(avgNetRate),
            b2bMarginApplied: Math.round(marketplaceRate - avgNetRate),
            marketplaceRate,
            taxTotal,
            feesTotal: 0,
            surchargesTotal: 0,
            finalRate,
            markupHistory: JSON.stringify([
              {
                applied_by: dto.sourceTenantId,
                type: 'b2b',
                value: b2bMarginPercentage,
                timestamp: new Date().toISOString(),
              },
            ]),
          },
        },
      },
      include: { rateBreakdown: true },
    });

    return {
      id: booking.id,
      bookingCode: booking.bookingCode,
      bookingType: 'b2b',
      sourceTenantId: booking.sourceTenantId,
      resellerTenantId: booking.resellerTenantId,
      propertyName: property.name,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      numberOfNights: booking.numberOfNights,
      guestName: booking.guestName,
      status: booking.status,
      rateBreakdown: booking.rateBreakdown,
      createdAt: booking.createdAt,
    };
  }

  /**
   * Get B2B bookings for a reseller or source tenant
   */
  async getB2BBookings(tenantId: string, role: 'reseller' | 'source') {
    const where =
      role === 'reseller'
        ? { resellerTenantId: tenantId, bookingType: 'b2b' }
        : { sourceTenantId: tenantId, bookingType: 'b2b' };

    return this.prisma.booking.findMany({
      where,
      include: { rateBreakdown: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get specific B2B booking
   */
  async getB2BBooking(bookingId: string, tenantId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { rateBreakdown: true },
    });

    if (!booking || booking.bookingType !== 'b2b') {
      throw new NotFoundException('Booking not found');
    }

    // Verify tenant access
    if (
      booking.sourceTenantId !== tenantId &&
      booking.resellerTenantId !== tenantId
    ) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  /**
   * Helper: Get default B2B margin for a tenant
   */
  private async getDefaultB2BMargin(tenantId: string): Promise<number> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { defaultB2BMargin: true },
    });
    return tenant?.defaultB2BMargin || 15;
  }
}
