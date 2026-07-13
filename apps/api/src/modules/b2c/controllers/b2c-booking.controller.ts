import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { B2CBookingService } from '../services/b2c-booking.service';

@Controller('b2c/bookings')
export class B2CBookingController {
  constructor(private b2cBookingService: B2CBookingService) {}

  @Post()
  async createB2CBooking(
    @Body()
    dto: {
      tenantSlug: string;
      propertyId: string;
      roomTypeCode: string;
      ratePlanCode: string;
      checkInDate: string;
      checkOutDate: string;
      adults: number;
      children?: number;
      guestEmail: string;
      guestName: string;
      guestPhone?: string;
    },
  ) {
    return this.b2cBookingService.createB2CBooking({
      tenantSlug: dto.tenantSlug,
      propertyId: dto.propertyId,
      roomTypeCode: dto.roomTypeCode,
      ratePlanCode: dto.ratePlanCode,
      checkInDate: new Date(dto.checkInDate),
      checkOutDate: new Date(dto.checkOutDate),
      adults: dto.adults,
      children: dto.children,
      guestEmail: dto.guestEmail,
      guestName: dto.guestName,
      guestPhone: dto.guestPhone,
    });
  }

  @Get(':bookingCode')
  async getB2CBooking(
    @Param('bookingCode') bookingCode: string,
    @Query('email') guestEmail: string,
  ) {
    return this.b2cBookingService.getB2CBooking(bookingCode, guestEmail);
  }

  @Post(':bookingId/payment')
  async completeBookingPayment(
    @Param('bookingId') bookingId: string,
    @Query('email') guestEmail: string,
    @Body() dto: { stripePaymentIntentId: string },
  ) {
    return this.b2cBookingService.completeBookingPayment(
      bookingId,
      guestEmail,
      dto.stripePaymentIntentId,
    );
  }

  @Post(':bookingId/cancel')
  async cancelB2CBooking(
    @Param('bookingId') bookingId: string,
    @Query('email') guestEmail: string,
    @Body() dto: { reason?: string },
  ) {
    return this.b2cBookingService.cancelB2CBooking(
      bookingId,
      guestEmail,
      dto.reason,
    );
  }
}
