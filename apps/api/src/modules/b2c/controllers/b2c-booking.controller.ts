import { Controller, Post, Get, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { B2CBookingService } from '../services/b2c-booking.service';
import { Public } from '../../../shared/security/access.decorators';
import { CreateGuestBookingDto, GuestCancelDto, GuestPaymentDto, StayDto } from '../dto/guest-booking.dto';

// Per IP address. Guests have no account, so these limits are what slows guessing of booking references.
const GUEST_LOOKUP_LIMIT = { short: { limit: 10, ttl: 60000 }, long: { limit: 60, ttl: 3600000 } };
const GUEST_WRITE_LIMIT = { short: { limit: 10, ttl: 60000 }, long: { limit: 40, ttl: 3600000 } };

const requireEmail = (email?: string) => {
  if (!email || typeof email !== 'string') throw new BadRequestException('email is required');
  return email;
};

/**
 * Guest-facing storefront routes: no account, so no login. A guest reaches a booking only with its
 * ID or reference together with the email address it was booked under.
 */
@Public()
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
  async reviewBooking(@Body() dto: StayDto) {
    return this.b2cBookingService.reviewBooking({
      ...dto,
      checkInDate: new Date(dto.checkInDate),
      checkOutDate: new Date(dto.checkOutDate),
    });
  }

  /**
   * Create a booking awaiting payment
   */
  @Post('bookings')
  @Throttle(GUEST_WRITE_LIMIT)
  async createB2CBooking(@Body() dto: CreateGuestBookingDto) {
    return this.b2cBookingService.createB2CBooking({
      ...dto,
      checkInDate: new Date(dto.checkInDate),
      checkOutDate: new Date(dto.checkOutDate),
    });
  }

  /**
   * My Bookings: lists a guest's bookings. The guest proves the email is theirs by also giving the
   * reference (booking code, confirmation number or ID) of any one of their bookings.
   */
  @Get('bookings/search')
  @Throttle(GUEST_LOOKUP_LIMIT)
  async searchBookingsByEmail(
    @Query('email') email: string,
    @Query('reference') reference: string,
  ) {
    if (!reference || typeof reference !== 'string') throw new BadRequestException('reference is required');
    return this.b2cBookingService.searchBookingsByEmail(requireEmail(email), reference);
  }

  /**
   * Get booking details by booking ID and guest email
   */
  @Get('bookings/:bookingId')
  @Throttle(GUEST_LOOKUP_LIMIT)
  async getB2CBookingById(
    @Param('bookingId') bookingId: string,
    @Query('email') guestEmail: string,
  ) {
    return this.b2cBookingService.getB2CBookingById(bookingId, requireEmail(guestEmail));
  }

  /**
   * Complete booking payment via Stripe
   * Called after guest completes payment on Stripe checkout; the payment is verified with Stripe
   */
  @Post('bookings/:bookingId/payment')
  @Throttle(GUEST_WRITE_LIMIT)
  async completeBookingPayment(
    @Param('bookingId') bookingId: string,
    @Query('email') guestEmail: string,
    @Body() dto: GuestPaymentDto,
  ) {
    return this.b2cBookingService.completeBookingPayment(
      bookingId,
      requireEmail(guestEmail),
      dto.stripePaymentIntentId,
    );
  }

  /**
   * Cancel a booking
   * Guest can cancel their booking with refund based on cancellation policy
   */
  @Post('bookings/:bookingId/cancel')
  @Throttle(GUEST_WRITE_LIMIT)
  async cancelB2CBooking(
    @Param('bookingId') bookingId: string,
    @Query('email') guestEmail: string,
    @Body() dto: GuestCancelDto,
  ) {
    return this.b2cBookingService.cancelB2CBooking(
      bookingId,
      requireEmail(guestEmail),
      dto.reason,
    );
  }

  /**
   * Get booking confirmation after payment
   * Returns confirmation details and receipt
   */
  @Get('bookings/:bookingId/confirmation')
  @Throttle(GUEST_LOOKUP_LIMIT)
  async getBookingConfirmation(
    @Param('bookingId') bookingId: string,
    @Query('email') guestEmail: string,
  ) {
    return this.b2cBookingService.getBookingConfirmation(
      bookingId,
      requireEmail(guestEmail),
    );
  }
}
