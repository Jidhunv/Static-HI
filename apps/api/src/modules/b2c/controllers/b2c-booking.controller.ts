import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { B2CBookingService } from '../services/b2c-booking.service';

@Controller('b2c')
export class B2CBookingController {
  constructor(private b2cBookingService: B2CBookingService) {}

  /**
   * Get room availability for a specific room and date range
   * Returns availability information for rate planning
   */
  @Get('rooms/:roomId')
  async getRoomAvailability(
    @Param('roomId') roomId: string,
    @Query('tenantSlug') tenantSlug: string,
    @Query('checkInDate') checkInDate: string,
    @Query('checkOutDate') checkOutDate: string,
  ) {
    // For now, return mock room details with availability data
    // In production, this would query the calendar_rates table and property details
    const numberOfNights = Math.ceil(
      (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      id: roomId,
      type: 'Deluxe Room',
      property: {
        id: 'prop-DUB-001',
        name: 'Dubai Luxury Hotel',
        city: 'Dubai',
      },
      netRate: 250,
      availability: 5,
      checkInDate,
      checkOutDate,
      numberOfNights,
      status: 'available',
    };
  }

  /**
   * Create a booking review - calculates rates before actual booking
   * This is used to show guest the final price before confirming
   */
  @Post('bookings/review')
  async reviewBooking(
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
    },
  ) {
    return this.b2cBookingService.reviewBooking({
      tenantSlug: dto.tenantSlug,
      propertyId: dto.propertyId,
      roomTypeCode: dto.roomTypeCode,
      ratePlanCode: dto.ratePlanCode,
      checkInDate: new Date(dto.checkInDate),
      checkOutDate: new Date(dto.checkOutDate),
      adults: dto.adults,
      children: dto.children,
    });
  }

  /**
   * Create a confirmed booking
   * This endpoint creates the actual booking in the system
   */
  @Post('bookings')
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
      specialRequests?: string;
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
      specialRequests: dto.specialRequests,
    });
  }

  /**
   * Search bookings by guest email
   * Used for My Bookings page - allows guests to find their bookings
   */
  @Get('bookings/search')
  async searchBookingsByEmail(
    @Query('email') email: string,
  ) {
    return this.b2cBookingService.searchBookingsByEmail(email);
  }

  /**
   * Get booking details by booking ID
   * Used to retrieve booking information after confirmation
   */
  @Get('bookings/:bookingId')
  async getB2CBookingById(
    @Param('bookingId') bookingId: string,
  ) {
    return this.b2cBookingService.getB2CBookingById(bookingId);
  }

  /**
   * Complete booking payment via Stripe
   * Called after guest completes payment on Stripe checkout
   */
  @Post('bookings/:bookingId/payment')
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

  /**
   * Cancel a booking
   * Guest can cancel their booking with refund based on cancellation policy
   */
  @Post('bookings/:bookingId/cancel')
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

  /**
   * Get booking confirmation after payment
   * Returns confirmation details and receipt
   */
  @Get('bookings/:bookingId/confirmation')
  async getBookingConfirmation(
    @Param('bookingId') bookingId: string,
    @Query('email') guestEmail: string,
  ) {
    return this.b2cBookingService.getBookingConfirmation(
      bookingId,
      guestEmail,
    );
  }
}
