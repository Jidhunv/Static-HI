import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { RateCardService } from './rate-card.service';
import { PlatformAdminOnly } from '../../shared/security/access.decorators';
import { AccessService } from '../../shared/security/access.service';
import { CurrentPrincipal, Principal } from '../../shared/security/principal';

@Controller('rate-cards')
export class RateCardController {
  constructor(
    private service: RateCardService,
    private access: AccessService,
  ) {}

  /**
   * Initialize board types (Super Admin only)
   */
  @Post('init-board-types')
  @PlatformAdminOnly()
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
    @CurrentPrincipal() actor: Principal,
    @Param('propertyId') propertyId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Body()
    body: {
      startDate: string;
      endDate: string;
      reason: string;
    }
  ) {
    await this.access.assertRatePlan(actor, ratePlanId, propertyId);
    return this.service.addBlackout(
      propertyId,
      ratePlanId,
      {
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason,
      },
      { id: actor.id, email: actor.email }
    );
  }

  /**
   * Remove blackout period
   */
  @Delete(':propertyId/:ratePlanId/blackout')
  async removeBlackout(
    @CurrentPrincipal() actor: Principal,
    @Param('propertyId') propertyId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Body()
    body: {
      reason: string;
    }
  ) {
    await this.access.assertRatePlan(actor, ratePlanId, propertyId);
    return this.service.removeBlackout(
      propertyId,
      ratePlanId,
      body.reason,
      { id: actor.id, email: actor.email }
    );
  }

  /**
   * Get all blackout periods for rate plan
   */
  @Get(':ratePlanId/blackouts')
  async getBlackouts(@CurrentPrincipal() actor: Principal, @Param('ratePlanId') ratePlanId: string) {
    await this.access.assertRatePlan(actor, ratePlanId);
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
