import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { InventoryLedgerService } from '../inventory/inventory-ledger.service';
import { RateCardService } from '../rate-card/rate-card.service';
import { FXRateService } from '../fx/fx-rate.service';
import { AuditLogService } from '../audit/audit-log.service';
import { nanoid } from 'nanoid';

interface CreateBookingDto {
  propertyId: string;
  roomId: string;
  ratePlanId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomType?: string;
  rateType: 'domestic' | 'international';
  rateAmount: number;
  source: 'b2b' | 'b2c' | 'walk_in';
  baseCurrency: string;
  displayCurrency?: string;
  quantity?: number;
  specialRequests?: string;
}

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private inventoryLedger: InventoryLedgerService,
    private rateCard: RateCardService,
    private fxRate: FXRateService,
    private auditLog: AuditLogService,
  ) {}

  private generateConfirmationNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `CONF-${dateStr}-${nanoid(5).toUpperCase()}`;
  }

  private calculateNights(checkIn: Date, checkOut: Date): number {
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
  }

  async createBooking(tenantId: string, bookingData: CreateBookingDto, user?: any) {
    // Verify property exists and belongs to tenant
    const property = await this.prisma.property.findFirst({
      where: { id: bookingData.propertyId, tenantId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);

    if (checkOut <= checkIn) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    const numberOfNights = this.calculateNights(checkIn, checkOut);
    const quantity = bookingData.quantity || 1;

    // Fetch room details to get room type if not provided
    const room = await this.prisma.room.findUnique({
      where: { id: bookingData.roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const roomType = bookingData.roomType || room.type;

    const eligibility = await this.rateCard.checkBookingEligibility({
      ratePlanId: bookingData.ratePlanId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      quantity,
      propertyId: bookingData.propertyId,
      roomId: bookingData.roomId,
    });

    if (!eligibility.eligible) {
      const error = eligibility.violations.join('; ');
      await this.auditLog.log({
        tenantId,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name,
        action: 'booking_attempt_failed',
        entity: 'Booking',
        status: 'failure',
        errorMessage: error,
      });
      throw new BadRequestException(`Booking not eligible: ${error}`);
    }

    const totalAmount = bookingData.rateAmount * numberOfNights;
    let fxSnapshot = null;

    if (bookingData.displayCurrency && bookingData.displayCurrency !== bookingData.baseCurrency) {
      const rate = await this.fxRate.getRate(bookingData.baseCurrency, bookingData.displayCurrency);
      fxSnapshot = { rate, updatedAt: new Date() };
    }

    let confirmationNo = this.generateConfirmationNumber();
    while (await this.prisma.booking.findUnique({ where: { systemConfirmationNo: confirmationNo } })) {
      confirmationNo = this.generateConfirmationNumber();
    }

    try {
      const booking = await this.prisma.$transaction(async (tx) => {
        return tx.booking.create({
          data: {
            propertyId: bookingData.propertyId,
            tenantId,
            systemConfirmationNo: confirmationNo,
            guestName: bookingData.guestName,
            guestEmail: bookingData.guestEmail,
            guestPhone: bookingData.guestPhone,
            roomType: roomType,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            numberOfNights,
            numberOfGuests: bookingData.numberOfGuests,
            rateType: bookingData.rateType,
            rateAmount: bookingData.rateAmount,
            totalAmount,
            source: bookingData.source,
            specialRequests: bookingData.specialRequests,
            status: 'pending',
          },
        });
      });

      const inventoryResult = await this.inventoryLedger.bookRoom({
        propertyId: bookingData.propertyId,
        roomId: bookingData.roomId,
        ratePlanId: bookingData.ratePlanId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        quantity,
        bookingId: booking.id,
        actorUserId: user?.id,
        actorEmail: user?.email,
      });

      if (!inventoryResult.success) {
        await this.prisma.booking.delete({ where: { id: booking.id } });
        throw new BadRequestException(`Booking failed: ${inventoryResult.message}`);
      }

      await this.auditLog.log({
        tenantId,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name,
        action: 'create',
        entity: 'Booking',
        entityId: booking.id,
        entityName: confirmationNo,
        changes: { new: booking },
        status: 'success',
      });

      return booking;
    } catch (error) {
      await this.auditLog.log({
        tenantId,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name,
        action: 'create',
        entity: 'Booking',
        status: 'failure',
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async confirmBooking(tenantId: string, bookingId: string, hotelConfirmationNo?: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      include: {
        property: {
          include: {
            propertyConfig: {
              where: { tenantId },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'confirmed',
        hotelConfirmationNo,
        confirmedAt: new Date(),
      },
    });

    // Generate voucher
    await this.generateVoucher(tenantId, bookingId);

    return updatedBooking;
  }

  async cancelBooking(tenantId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });
  }

  async getBooking(tenantId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      include: {
        property: true,
        voucher: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getPropertyBookings(
    tenantId: string,
    propertyId: string,
    filters?: {
      status?: string;
      source?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        propertyId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.source && { source: filters.source }),
        ...(filters?.startDate && {
          checkInDate: { gte: new Date(filters.startDate) },
        }),
        ...(filters?.endDate && {
          checkOutDate: { lte: new Date(filters.endDate) },
        }),
      },
      include: { voucher: true },
      orderBy: { checkInDate: 'asc' },
    });

    return bookings;
  }

  async getDashboardStats(tenantId: string, propertyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCheckIns, todayCheckOuts, occupancy, revenue, allBookings] = await Promise.all([
      this.prisma.booking.count({
        where: {
          tenantId,
          propertyId,
          checkInDate: { gte: today, lt: tomorrow },
          status: { in: ['confirmed', 'checked_in'] },
        },
      }),
      this.prisma.booking.count({
        where: {
          tenantId,
          propertyId,
          checkOutDate: { gte: today, lt: tomorrow },
          status: { in: ['checked_in'] },
        },
      }),
      this.calculateOccupancy(tenantId, propertyId, today),
      this.calculateTodayRevenue(tenantId, propertyId, today),
      this.prisma.booking.findMany({
        where: {
          tenantId,
          propertyId,
          checkInDate: { lte: tomorrow },
          checkOutDate: { gte: today },
        },
        include: { voucher: true },
        take: 10,
      }),
    ]);

    return {
      todayCheckIns,
      todayCheckOuts,
      occupancy,
      revenue,
      bookings: allBookings,
    };
  }

  private async calculateOccupancy(
    tenantId: string,
    propertyId: string,
    date: Date,
  ): Promise<number> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { rooms: true },
    });

    if (!property || !property.rooms.length) {
      return 0;
    }

    const totalRooms = property.rooms.reduce((sum, room) => sum + room.quantity, 0);

    const bookedRooms = await this.prisma.booking.count({
      where: {
        tenantId,
        propertyId,
        checkInDate: { lte: date },
        checkOutDate: { gt: date },
        status: { in: ['confirmed', 'checked_in'] },
      },
    });

    return Math.round((bookedRooms / totalRooms) * 100);
  }

  private async calculateTodayRevenue(
    tenantId: string,
    propertyId: string,
    date: Date,
  ): Promise<number> {
    const result = await this.prisma.booking.aggregate({
      where: {
        tenantId,
        propertyId,
        checkInDate: { gte: date },
        status: 'confirmed',
      },
      _sum: {
        totalAmount: true,
      },
    });

    return result._sum.totalAmount || 0;
  }

  private async generateVoucher(tenantId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: {
            propertyConfig: {
              where: { tenantId },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const property = booking.property;
    const config = booking.property.propertyConfig[0];

    const voucherNo = `VOC-${booking.systemConfirmationNo}`;
    const checkInDate = booking.checkInDate.toISOString().split('T')[0];
    const checkOutDate = booking.checkOutDate.toISOString().split('T')[0];

    const voucher = await this.prisma.bookingVoucher.create({
      data: {
        bookingId,
        voucherNo,
        hotelName: property.name,
        hotelAddress: property.address,
        hotelPhone: property.phone,
        hotelEmail: property.email,
        hotelWebsite: property.website,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        checkInDate,
        checkOutDate,
        numberOfNights: booking.numberOfNights,
        roomType: booking.roomType,
        rate: `${booking.rateAmount} ${booking.currency}/${booking.numberOfNights} nights`,
        subtotal: booking.totalAmount,
        tax: booking.totalAmount * 0.1, // Assuming 10% tax
        total: booking.totalAmount * 1.1,
        currency: booking.currency,
        hotelLogo: tenant?.logoUrl,
        primaryColor: tenant?.primaryColor,
        secondaryColor: tenant?.secondaryColor,
        tenantName: tenant?.name,
        generatedAt: new Date(),
        validFrom: booking.checkInDate,
        validUntil: booking.checkOutDate,
      },
    });

    return voucher;
  }
}
