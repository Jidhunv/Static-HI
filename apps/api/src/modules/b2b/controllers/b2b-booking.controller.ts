import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { B2BBookingService } from '../services/b2b-booking.service';
import { TenantId } from '../../../shared/decorators/auth.decorators';

@Controller('b2b/bookings')
export class B2BBookingController {
  constructor(private b2bBookingService: B2BBookingService) {}

  @Post()
  async createB2BBooking(
    @TenantId() resellerTenantId: string,
    @Body()
    dto: {
      propertyId: string;
      sourceTenantId: string;
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
    return this.b2bBookingService.createB2BBooking(resellerTenantId, {
      propertyId: dto.propertyId,
      sourceTenantId: dto.sourceTenantId,
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

  @Get()
  async getB2BBookings(@TenantId() tenantId: string) {
    // Return both reseller bookings and source bookings
    const resellerBookings = await this.b2bBookingService.getB2BBookings(
      tenantId,
      'reseller',
    );
    const sourceBookings = await this.b2bBookingService.getB2BBookings(
      tenantId,
      'source',
    );

    return {
      asReseller: resellerBookings,
      asSource: sourceBookings,
    };
  }

  @Get(':bookingId')
  async getB2BBooking(
    @TenantId() tenantId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.b2bBookingService.getB2BBooking(bookingId, tenantId);
  }
}
