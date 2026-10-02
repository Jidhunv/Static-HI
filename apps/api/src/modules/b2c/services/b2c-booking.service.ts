import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { nanoid } from 'nanoid';
import { SettlementService } from './settlement.service';
import { PaymentVerifierService } from './payment-verifier.service';
import { daysUntil, MS_PER_DAY, priceStay, publishedTo, PublishedTerms } from './stay-pricing';

interface StayRequest {
  tenantSlug: string;
  propertyId: string;
  roomTypeCode: string;
  ratePlanCode: string;
  checkInDate: Date;
  checkOutDate: Date;
  adults: number;
  children?: number;
}

@Injectable()
export class B2CBookingService {
  constructor(
    private prisma: PrismaService,
    private settlements: SettlementService,
    private payments: PaymentVerifierService,
  ) {}

  /**
   * Prices a stay for a storefront tenant. The property is either the tenant's own, or another
   * supplier's inventory that is published (public, or reserved for this tenant); in that case the
   * owner's published net rate, markup cap and commission apply. `offer` is null when the tenant
   * cannot sell the property.
   */
  private async quote(dto: StayRequest) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
      select: { id: true, defaultB2CMarkup: true },
    });
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const numberOfNights = Math.ceil((dto.checkOutDate.getTime() - dto.checkInDate.getTime()) / MS_PER_DAY);
    const none = { tenant, numberOfNights, offer: null };

    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property) return none;
    const own = property.tenantId === tenant.id;
    if (own && !['public_b2c', 'public_both'].includes(property.visibility)) return none;

    const [room, ratePlan] = await Promise.all([
      this.prisma.room.findFirst({ where: { propertyId: dto.propertyId, code: dto.roomTypeCode } }),
      this.prisma.ratePlan.findFirst({ where: { propertyId: dto.propertyId, code: dto.ratePlanCode } }),
    ]);

    let published: PublishedTerms | null = null;
    if (!own) {
      if (!room || !ratePlan || property.status !== 'active') return none;
      const visibility = await this.prisma.inventoryVisibility.findFirst({
        where: { ...publishedTo(tenant.id), propertyId: property.id, roomId: room.id, ratePlanId: ratePlan.id },
        orderBy: { visibilityLevel: 'desc' }, // terms reserved for this tenant win over public ones
      });
      if (!visibility) return none;

      const daysAhead = daysUntil(dto.checkInDate);
      if (daysAhead < visibility.minBookingWindow || daysAhead > visibility.maxBookingWindow) {
        throw new BadRequestException('Check-in date is outside the booking window for this rate');
      }
      published = visibility;
    }

    if (!room) {
      throw new NotFoundException('Room type not found');
    }
    if (!ratePlan) {
      throw new NotFoundException('Rate plan not found');
    }

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
    const minAvailability = Math.min(...calendarRates.map((cr) => cr.availability));
    if (minAvailability < 1) {
      throw new BadRequestException('Insufficient availability');
    }

    const markupRule = await this.prisma.rateMarkup.findFirst({
      where: { tenantId: tenant.id, channel: 'b2c' },
      orderBy: { priority: 'desc' },
    });
    const price = priceStay(
      calendarRates.map((cr) => cr.netRate),
      markupRule?.value || tenant.defaultB2CMarkup || 25,
      numberOfNights,
      published,
    );
    if (!price.sellable) {
      throw new BadRequestException('This rate cannot be sold: the markup does not cover the amount owed to the owner');
    }

    return {
      tenant,
      numberOfNights,
      offer: {
        property,
        room,
        minAvailability,
        avgNetRate: price.avgNetRate,
        netRate: price.netRate,
        b2cMarkupPercentage: price.appliedMarkupPct,
        b2cSellRate: price.sellRate,
        subtotal: price.subtotal,
        taxTotal: price.taxTotal,
        totalAmount: price.totalAmount,
        distributed:
          published && price.commissionPct !== null
            ? { inventoryVisibilityId: published.id, commissionPct: price.commissionPct }
            : null,
      },
    };
  }

  /**
   * Review booking - calculate rates without creating booking
   * Used to show price breakdown before guest confirms
   */
  async reviewBooking(dto: StayRequest) {
    const { numberOfNights, offer } = await this.quote(dto);
    if (!offer) {
      throw new NotFoundException('Property not found');
    }

    return {
      propertyName: offer.property.name,
      roomType: offer.room.type,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      numberOfNights,
      numberOfGuests: dto.adults + (dto.children || 0),
      priceBreakdown: {
        perNightRate: offer.b2cSellRate,
        numberOfNights,
        subtotal: offer.subtotal,
        taxes: offer.taxTotal,
        totalAmount: offer.totalAmount,
        currency: 'USD',
      },
      availability: offer.minAvailability,
      cancellationPolicy: 'Free cancellation up to 7 days before check-in',
    };
  }

  /**
   * Create a B2C booking (guest books on public storefront)
   * No authentication required
   */
  async createB2CBooking(
    dto: StayRequest & {
      guestEmail: string;
      guestName: string;
      guestPhone?: string;
      specialRequests?: string;
    },
  ) {
    const { tenant, numberOfNights, offer } = await this.quote(dto);

    if (!offer) {
      throw new NotFoundException('This property is not available from this storefront');
    }

    const { property, room, netRate, b2cSellRate, b2cMarkupPercentage, subtotal, taxTotal, totalAmount, distributed } = offer;
    // The booking belongs to the inventory owner; a storefront selling someone else's inventory is the reseller.
    const ownerTenantId = property.tenantId;
    const resellerTenantId = distributed ? tenant.id : undefined;

    const bookingCode = `${property.code}-B2C-${nanoid(8).toUpperCase()}`;
    const confirmationNo = `CONF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nanoid(5).toUpperCase()}`;

    const booking = await this.prisma.booking.create({
      data: {
        systemConfirmationNo: confirmationNo,
        bookingCode,
        propertyId: dto.propertyId,
        tenantId: ownerTenantId,
        sourceTenantId: ownerTenantId,
        resellerTenantId,
        bookingType: 'b2c',
        guestEmail: dto.guestEmail,
        guestName: dto.guestName,
        guestPhone: dto.guestPhone,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
        roomType: room.type,
        roomTypeCode: dto.roomTypeCode,
        ratePlanCode: dto.ratePlanCode,
        adults: dto.adults,
        children: dto.children || 0,
        rateType: 'domestic',
        rateAmount: netRate,
        totalAmount: totalAmount,
        currency: 'USD',
        netRate,
        numberOfNights,
        numberOfGuests: dto.adults + (dto.children || 0),
        subtotal,
        source: 'b2c',
        status: 'pending_payment',
        specialRequests: dto.specialRequests,

        // Create rate breakdown for audit
        rateBreakdown: {
          create: {
            sourceTenantId: ownerTenantId,
            resellerTenantId,
            commissionPct: distributed?.commissionPct,
            inventoryVisibilityId: distributed?.inventoryVisibilityId,
            netRate,
            b2cMarkupApplied: Math.round(b2cSellRate - offer.avgNetRate),
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
   * Search bookings by guest email (for My Bookings page)
   */
  async searchBookingsByEmail(email: string, reference: string) {
    // Knowing an email address is not enough: the caller must also hold one of that guest's references.
    const proof = await this.prisma.booking.findFirst({
      where: {
        guestEmail: { equals: email, mode: 'insensitive' },
        bookingType: 'b2c',
        OR: [{ id: reference }, { bookingCode: reference }, { systemConfirmationNo: reference }],
      },
      select: { id: true },
    });
    if (!proof) return { bookings: [] };

    const bookings = await this.prisma.booking.findMany({
      where: {
        guestEmail: { equals: email, mode: 'insensitive' },
        bookingType: 'b2c',
      },
      include: {
        property: {
          select: {
            name: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      bookings: bookings.map(booking => ({
        id: booking.id,
        bookingCode: booking.bookingCode,
        systemConfirmationNo: booking.systemConfirmationNo,
        propertyName: booking.property?.name,
        roomType: booking.roomType,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        numberOfNights: booking.numberOfNights,
        numberOfGuests: booking.numberOfGuests,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        status: booking.status,
        createdAt: booking.createdAt,
        property: booking.property,
      })),
    };
  }

  /**
   * Get B2C booking by ID (for confirmation page)
   */
  async getB2CBookingById(bookingId: string, guestEmail: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        rateBreakdown: true,
        property: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    });

    if (
      !booking ||
      booking.bookingType !== 'b2c' ||
      booking.guestEmail.toLowerCase() !== guestEmail.toLowerCase()
    ) {
      throw new NotFoundException('Booking not found');
    }

    return {
      id: booking.id,
      systemConfirmationNo: booking.systemConfirmationNo,
      bookingCode: booking.bookingCode,
      propertyName: booking.property?.name,
      roomType: booking.roomType,
      boardType: booking.ratePlanCode,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      numberOfNights: booking.numberOfNights,
      numberOfGuests: booking.numberOfGuests,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      totalAmount: booking.totalAmount,
      rateAmount: booking.rateAmount,
      currency: booking.currency,
      status: booking.status,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
    };
  }

  /**
   * Get B2C booking details (guest - no auth required)
   */
  async getB2CBooking(bookingCode: string, guestEmail: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        bookingCode,
        bookingType: 'b2c',
        guestEmail: { equals: guestEmail, mode: 'insensitive' },
      },
      include: { rateBreakdown: true },
    });

    if (!booking) {
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
      include: { rateBreakdown: true },
    });

    if (
      !booking ||
      booking.bookingType !== 'b2c' ||
      booking.guestEmail.toLowerCase() !== guestEmail.toLowerCase()
    ) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'pending_payment') {
      throw new BadRequestException('Booking is not awaiting payment');
    }
    const verified = await this.payments.verify(stripePaymentIntentId, {
      bookingId,
      amount: booking.totalAmount,
      currency: booking.currency,
    });

    const subtotalAmount = booking.subtotal || booking.totalAmount;
    const breakdown = booking.rateBreakdown;
    const sellerTenantId = booking.resellerTenantId;
    const ownerTenantId = booking.sourceTenantId;
    const netRate = booking.netRate;

    // Payment, confirmation and (for another supplier's inventory) settlements commit together.
    const settled = await this.prisma.$transaction(async (tx) => {
      // Claiming the status first means a booking can only be paid once.
      const claimed = await tx.booking.updateMany({
        where: { id: bookingId, status: 'pending_payment' },
        data: { status: 'confirmed', confirmedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new BadRequestException('Booking is not awaiting payment');
      }

      // One payment confirms one booking.
      if (await tx.payment.findFirst({ where: { stripePaymentIntentId }, select: { id: true } })) {
        throw new BadRequestException('This payment has already been used');
      }

      await tx.payment.create({
        data: {
          bookingId,
          status: 'succeeded',
          method: verified ? 'stripe' : 'unverified_dev',
          stripePaymentIntentId,
          amount: subtotalAmount,
          currency: 'USD',
          platformCommission: Math.round(subtotalAmount * 0.05), // 5% platform fee
          tenantCredit: Math.round(subtotalAmount * 0.95),
        },
      });

      if (!sellerTenantId || !ownerTenantId || sellerTenantId === ownerTenantId || netRate == null) return null;
      return this.settlements.createInTx(tx, {
        bookingId,
        sellerTenantId,
        ownerTenantId,
        ownerNetAmount: netRate * booking.numberOfNights,
        commissionPct: breakdown?.commissionPct ?? 0,
        inventoryVisibilityId: breakdown?.inventoryVisibilityId,
        guestPaid: booking.totalAmount,
        taxAmount: booking.totalAmount - subtotalAmount,
        currency: booking.currency,
      });
    });
    if (settled) await this.settlements.logCreated(settled);

    const updatedBooking = await this.prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });

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
    const refundableAmount = booking.subtotal || booking.totalAmount;
    const refundAmount = Math.round(refundableAmount * (refundPercentage / 100));
    const refundPenalty = refundableAmount - refundAmount;

    // Update booking
    const cancelledBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
    await this.settlements.cancelForBooking(bookingId);

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

  /**
   * Get booking confirmation after successful payment
   */
  async getBookingConfirmation(bookingId: string, guestEmail: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        rateBreakdown: true,
      },
    });

    if (
      !booking ||
      booking.bookingType !== 'b2c' ||
      booking.guestEmail.toLowerCase() !== guestEmail.toLowerCase()
    ) {
      throw new NotFoundException('Booking not found');
    }

    // Get property details for confirmation
    const property = await this.prisma.property.findUnique({
      where: { id: booking.propertyId },
      select: {
        name: true,
        address: true,
        city: true,
        phone: true,
        email: true,
        checkInTime: true,
        checkOutTime: true,
      },
    });

    return {
      confirmationNo: booking.systemConfirmationNo,
      bookingCode: booking.bookingCode,
      status: booking.status,
      propertyName: property?.name,
      propertyAddress: property?.address,
      propertyCity: property?.city,
      propertyPhone: property?.phone,
      propertyEmail: property?.email,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      checkInTime: property?.checkInTime,
      checkOutTime: property?.checkOutTime,
      roomType: booking.roomType,
      numberOfNights: booking.numberOfNights,
      numberOfGuests: booking.numberOfGuests,
      adults: booking.adults,
      children: booking.children,
      specialRequests: booking.specialRequests,
      priceBreakdown: {
        perNightRate: booking.netRate,
        subtotal: booking.subtotal,
        taxes: booking.totalAmount - (booking.subtotal || 0),
        totalAmount: booking.totalAmount,
        currency: booking.currency,
      },
      cancellationPolicy: 'Free cancellation up to 7 days before check-in',
      createdAt: booking.createdAt,
    };
  }
}
