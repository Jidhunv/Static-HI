import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { nanoid } from 'nanoid';
import { SettlementService } from './settlement.service';
import { splitBooking } from './settlement.math';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

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

    let published: { id: string; netRate: number | null; maxMarkup: number | null; commissionShare: number | null } | null = null;
    if (!own) {
      if (!room || !ratePlan || property.status !== 'active') return none;
      const visibility = await this.prisma.inventoryVisibility.findFirst({
        where: {
          supplierTenantId: property.tenantId,
          propertyId: property.id,
          roomId: room.id,
          ratePlanId: ratePlan.id,
          status: 'active',
          OR: [{ visibilityLevel: 'public' }, { visibilityLevel: 'reserved', reservedFor: tenant.id }],
        },
      });
      if (!visibility) return none;

      const daysAhead = Math.floor((dto.checkInDate.getTime() - Date.now()) / MS_PER_DAY);
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

    const avgNetRate =
      published?.netRate ?? calendarRates.reduce((sum, cr) => sum + cr.netRate, 0) / calendarRates.length;

    const b2cMarkupRules = await this.prisma.rateMarkup.findMany({
      where: { tenantId: tenant.id, channel: 'b2c' },
      orderBy: { priority: 'desc' },
    });
    let b2cMarkupPercentage = b2cMarkupRules[0]?.value || tenant.defaultB2CMarkup || 25;
    if (published?.maxMarkup != null) {
      b2cMarkupPercentage = Math.min(b2cMarkupPercentage, published.maxMarkup);
    }

    const netRate = Math.round(avgNetRate);
    const b2cSellRate = Math.round(avgNetRate * (1 + b2cMarkupPercentage / 100));
    const subtotal = Math.round(b2cSellRate * numberOfNights);
    const taxTotal = Math.round(subtotal * 0.1); // 10% tax (simplified)
    const totalAmount = subtotal + taxTotal;

    let distributed: { inventoryVisibilityId: string; commissionPct: number } | null = null;
    if (published) {
      const commissionPct = published.commissionShare ?? 0;
      const split = splitBooking(totalAmount, netRate * numberOfNights, commissionPct);
      if (split.ownerAmount > split.sellerAmount) {
        throw new BadRequestException('This rate cannot be sold: the markup does not cover the amount owed to the owner');
      }
      distributed = { inventoryVisibilityId: published.id, commissionPct };
    }

    return {
      tenant,
      numberOfNights,
      offer: {
        property,
        room,
        minAvailability,
        avgNetRate,
        netRate,
        b2cMarkupPercentage,
        b2cSellRate,
        subtotal,
        taxTotal,
        totalAmount,
        distributed,
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

    // If property not found, create a demo booking with guest details persisted to DB
    if (!offer) {
      const bookingCode = `${dto.propertyId}-B2C-${nanoid(8).toUpperCase()}`;
      const confirmationNo = `CONF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nanoid(5).toUpperCase()}`;

      const booking = await this.prisma.booking.create({
        data: {
          systemConfirmationNo: confirmationNo,
          bookingCode,
          propertyId: dto.propertyId,
          tenantId: tenant.id,
          sourceTenantId: tenant.id,
          bookingType: 'b2c',
          guestEmail: dto.guestEmail,
          guestName: dto.guestName,
          guestPhone: dto.guestPhone,
          checkInDate: dto.checkInDate,
          checkOutDate: dto.checkOutDate,
          roomType: 'Standard Room',
          roomTypeCode: dto.roomTypeCode,
          ratePlanCode: dto.ratePlanCode,
          adults: dto.adults,
          children: dto.children || 0,
          rateType: 'domestic',
          rateAmount: 250,
          totalAmount: 275,
          currency: 'USD',
          netRate: 250,
          numberOfNights,
          numberOfGuests: dto.adults + (dto.children || 0),
          subtotal: 250,
          source: 'b2c',
          status: 'pending_payment',
          specialRequests: dto.specialRequests,
        },
      });

      return {
        id: booking.id,
        bookingCode: booking.bookingCode,
        bookingType: 'b2c',
        propertyName: 'Demo Hotel',
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        numberOfNights,
        b2cSellRate: 250,
        subtotal: 250,
        taxTotal: 25,
        totalAmount: 275,
        status: booking.status,
        paymentUrl: null,
        createdAt: booking.createdAt,
      };
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
  async searchBookingsByEmail(email: string) {
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
  async getB2CBookingById(bookingId: string) {
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

    // Return booking data or mock if not found
    return {
      id: booking?.id || bookingId,
      systemConfirmationNo: booking?.systemConfirmationNo || `CONF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DEMO`,
      bookingCode: booking?.bookingCode || `BOOKING-${bookingId.substring(0, 8).toUpperCase()}`,
      propertyName: booking?.property?.name || 'Luxury Palace - Dubai',
      roomType: booking?.roomType || 'Deluxe Room',
      boardType: booking?.ratePlanCode || 'Room Only',
      checkInDate: booking?.checkInDate || new Date('2026-10-05'),
      checkOutDate: booking?.checkOutDate || new Date('2026-10-10'),
      numberOfNights: booking?.numberOfNights || 5,
      numberOfGuests: booking?.numberOfGuests || 2,
      guestName: booking?.guestName || 'Guest User',
      guestEmail: booking?.guestEmail || 'guest@example.com',
      guestPhone: booking?.guestPhone || '+1 555-1234',
      totalAmount: booking?.totalAmount || 1375,
      rateAmount: booking?.rateAmount,
      currency: booking?.currency || 'USD',
      status: booking?.status || 'confirmed',
      specialRequests: booking?.specialRequests,
      createdAt: booking?.createdAt || new Date(),
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

      await tx.payment.create({
        data: {
          bookingId,
          status: 'succeeded',
          method: 'stripe',
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
