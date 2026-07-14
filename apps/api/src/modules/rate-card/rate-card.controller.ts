import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { RateCardService } from './rate-card.service';

@Controller('rate-cards')
export class RateCardController {
  constructor(private service: RateCardService) {}

  /**
   * Initialize board types (Super Admin only)
   */
  @Post('init-board-types')
  async initBoardTypes() {
    const count = await this.service.initializeBoardTypes();
    return { message: `Initialized ${count} board types` };
  }

  /**
   * Get all board types
   */
  @Get('board-types')
  async getBoardTypes() {
    return this.service.getBoardTypes();
  }

  /**
   * Add blackout period to rate plan
   */
  @Post(':propertyId/:ratePlanId/blackout')
  async addBlackout(
    @Param('propertyId') propertyId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Body()
    body: {
      startDate: string;
      endDate: string;
      reason: string;
      userId: string;
      email: string;
    }
  ) {
    return this.service.addBlackout(
      propertyId,
      ratePlanId,
      {
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason,
      },
      { id: body.userId, email: body.email }
    );
  }

  /**
   * Remove blackout period
   */
  @Delete(':propertyId/:ratePlanId/blackout')
  async removeBlackout(
    @Param('propertyId') propertyId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Body()
    body: {
      reason: string;
      userId: string;
      email: string;
    }
  ) {
    return this.service.removeBlackout(
      propertyId,
      ratePlanId,
      body.reason,
      { id: body.userId, email: body.email }
    );
  }

  /**
   * Get all blackout periods for rate plan
   */
  @Get(':ratePlanId/blackouts')
  async getBlackouts(@Param('ratePlanId') ratePlanId: string) {
    const blackouts = await this.service.getBlackouts(ratePlanId);
    return { blackouts };
  }

  /**
   * Check if date is blacked out
   */
  @Get(':ratePlanId/blackout-check')
  async checkBlackout(
    @Param('ratePlanId') ratePlanId: string,
    @Query('date') date: string
  ) {
    const isBlackedOut = await this.service.isDateBlackedOut(
      ratePlanId,
      new Date(date)
    );
    return { date, isBlackedOut };
  }

  /**
   * Check booking eligibility (availability, length of stay, blackouts, etc.)
   */
  @Post(':propertyId/:ratePlanId/check-eligibility')
  async checkEligibility(
    @Param('propertyId') propertyId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Body()
    body: {
      checkInDate: string;
      checkOutDate: string;
      quantity: number;
      roomId: string;
    }
  ) {
    return this.service.checkBookingEligibility({
      ratePlanId,
      checkInDate: new Date(body.checkInDate),
      checkOutDate: new Date(body.checkOutDate),
      quantity: body.quantity,
      propertyId,
      roomId: body.roomId,
    });
  }
}
