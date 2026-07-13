import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class B2CBookingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a B2C booking (guest books on public storefront)
   * No authentication required
   */
  async createB2CBooking(dto: {
    tenantSlug: string;
    propertyId: string;
    roomTypeCode: string;
    ratePlanCode: string;
    checkInDate: Date;
    checkOutDate: Date;
    adults: number;
    children?: number;
    guestEmail: string;
    guestName: string;
    guestPhone?: string;
  }) {
    // Get tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
      select: { id: true, defaultB2CMarkup: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    // Verify property exists and is public for B2C
    const property = await this.prisma.property.findFirst({
      where: {
        id: dto.propertyId,
        tenantId: tenant.id,
        visibility: { in: ['public_b2c', 'public_both'] },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Find room
    const room = await this.prisma.room.findFirst({
      where: { propertyId: dto.propertyId, code: dto.roomTypeCode },
    });

    if (!room) {
      throw new NotFoundException('Room type not found');
    }

    // Find rate plan
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
        stopSell: false,
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

    // Calculate rates
    const numberOfNights = Math.ceil(
      (dto.checkOutDate.getTime() - dto.checkInDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const avgNetRate =
      calendarRates.reduce((sum, cr) => sum + cr.netRate, 0) /
      calendarRates.length;

    // Get B2C markup rules
    const b2cMarkupRules = await this.prisma.rateMarkup.findMany({
      where: {
        tenantId: tenant.id,
        channel: 'b2c',
      },
      orderBy: { priority: 'desc' },
    });

    const b2cMarkupPercentage =
      b2cMarkupRules[0]?.value || tenant.defaultB2CMarkup || 25;

    // Calculate B2C sell rate
    const b2cSellRate = Math.round(
      avgNetRate * (1 + b2cMarkupPercentage / 100),
    );

    const subtotal = Math.round(b2cSellRate * numberOfNights);
    const taxTotal = Math.round(subtotal * 0.1); // 10% tax (simplified)
    const totalAmount = subtotal + taxTotal;

    // Create booking
    const bookingCode = `${property.code}-B2C-${nanoid(8).toUpperCase()}`;

    const booking = await this.prisma.booking.create({
      data: {
        bookingCode,
        propertyId: dto.propertyId,
        sourceTenantId: tenant.id,
        bookingType: 'b2c',
        guestEmail: dto.guestEmail,
        guestName: dto.guestName,
        guestPhone: dto.guestPhone,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
        roomTypeCode: dto.roomTypeCode,
        ratePlanCode: dto.ratePlanCode,
        adults: dto.adults,
        children: dto.children || 0,
        netRate: Math.round(avgNetRate),
        numberOfNights,
        subtotal,
        status: 'pending_payment',

        // Create rate breakdown for audit
        rateBreakdown: {
          create: {
            sourceTenantId: tenant.id,
            netRate: Math.round(avgNetRate),
            b2cMarkupApplied: Math.round(b2cSellRate - avgNetRate),
            taxTotal,
            feesTotal: 0,
            surchargesTotal: 0,
            finalRate: totalAmount,
            markupHistory: JSON.stringify([
              {
                applied_by: tenant.id,
                type: 'b2c',
                value: b2cMarkupPercentage,
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
      bookingType: 'b2c',
      propertyName: property.name,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      numberOfNights: booking.numberOfNights,
      b2cSellRate,
      subtotal,
      taxTotal,
      totalAmount,
      status: booking.status,
      // Stripe payment URL would be generated here in production
      paymentUrl: null, // TODO: integrate Stripe Checkout
      createdAt: booking.createdAt,
    };
  }

  /**
   * Get B2C booking details (guest - no auth required)
   */
  async getB2CBooking(bookingCode: string, guestEmail: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode },
      include: { rateBreakdown: true },
    });

    if (!booking || booking.bookingType !== 'b2c') {
      throw new NotFoundException('Booking not found');
    }

    // Verify guest email matches
    if (booking.guestEmail.toLowerCase() !== guestEmail.toLowerCase()) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  /**
   * Complete B2C booking payment
   */
  async completeBookingPayment(
    bookingId: string,
    guestEmail: string,
    stripePaymentIntentId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (
      !booking ||
      booking.bookingType !== 'b2c' ||
      booking.guestEmail.toLowerCase() !== guestEmail.toLowerCase()
    ) {
      throw new NotFoundException('Booking not found');
    }

    // Create payment record
    await this.prisma.payment.create({
      data: {
        bookingId,
        status: 'succeeded',
        method: 'stripe',
        stripePaymentIntentId,
        amount: booking.subtotal,
        currency: 'USD',
        platformCommission: Math.round(booking.subtotal * 0.05), // 5% platform fee
        tenantCredit: Math.round(booking.subtotal * 0.95),
      },
    });

    // Update booking status
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'confirmed' },
    });

    return {
      id: updatedBooking.id,
      bookingCode: updatedBooking.bookingCode,
      status: updatedBooking.status,
      confirmationCode: `${updatedBooking.bookingCode}-CONFIRMED`,
      confirmationEmail: `sent_to_${updatedBooking.guestEmail}`,
      checkInDate: updatedBooking.checkInDate,
      checkOutDate: updatedBooking.checkOutDate,
    };
  }

  /**
   * Cancel B2C booking
   */
  async cancelB2CBooking(
    bookingId: string,
    guestEmail: string,
    reason?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { rateBreakdown: true },
    });

    if (
      !booking ||
      booking.bookingType !== 'b2c' ||
      booking.guestEmail.toLowerCase() !== guestEmail.toLowerCase()
    ) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking already cancelled');
    }

    // Get property cancellation policy to calculate refund
    const property = await this.prisma.property.findUnique({
      where: { id: booking.propertyId },
    });

    // Simplified refund: 50% if less than 7 days before arrival
    const daysBeforeArrival = Math.ceil(
      (booking.checkInDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    const refundPercentage = daysBeforeArrival >= 7 ? 100 : 50;
    const refundAmount = Math.round(booking.subtotal * (refundPercentage / 100));
    const refundPenalty = booking.subtotal - refundAmount;

    // Update booking
    const cancelledBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    return {
      id: cancelledBooking.id,
      bookingCode: cancelledBooking.bookingCode,
      status: cancelledBooking.status,
      cancellationRefund: refundAmount,
      refundPenalty,
      refundReason: `${daysBeforeArrival} days before arrival = ${refundPercentage}% Refund`,
      cancelledAt: cancelledBooking.cancelledAt,
    };
  }
}
