import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { InventoryLedgerService } from './inventory-ledger.service';
import { AccessService } from '../../shared/security/access.service';
import { CurrentPrincipal, Principal } from '../../shared/security/principal';

@Controller('inventory')
export class InventoryLedgerController {
  constructor(
    private service: InventoryLedgerService,
    private access: AccessService,
  ) {}

  /**
   * Check current availability for specific date
   */
  @Get(':propertyId/:roomId/:ratePlanId/availability')
  async getAvailability(
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Query('date') date: string
  ) {
    const checkDate = new Date(date);
    const available = await this.service.getAvailability(
      propertyId,
      roomId,
      ratePlanId,
      checkDate
    );

    return { available, date };
  }

  /**
   * Check availability for date range
   */
  @Get(':propertyId/:roomId/:ratePlanId/availability-range')
  async getAvailabilityRange(
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const availabilityMap = await this.service.getAvailabilityRange(
      propertyId,
      roomId,
      ratePlanId,
      new Date(startDate),
      new Date(endDate)
    );

    return Object.fromEntries(availabilityMap);
  }

  /**
   * Allocate rooms manually (tenant staff increases availability)
   */
  @Post(':propertyId/:roomId/:ratePlanId/allocate')
  async allocate(
    @CurrentPrincipal() actor: Principal,
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Body()
    body: {
      date: string;
      quantity: number;
    }
  ) {
    await this.access.assertProperty(actor, propertyId);
    return this.service.allocateRooms({
      propertyId,
      roomId,
      ratePlanId,
      date: new Date(body.date),
      quantity: body.quantity,
      actorUserId: actor.id,
      actorEmail: actor.email,
    });
  }

  /**
   * Get ledger history (audit trail)
   */
  @Get(':propertyId/ledger')
  async getLedgerHistory(
    @CurrentPrincipal() actor: Principal,
    @Param('propertyId') propertyId: string,
    @Query('roomId') roomId?: string,
    @Query('ratePlanId') ratePlanId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    await this.access.assertProperty(actor, propertyId);
    return this.service.getLedgerHistory(
      propertyId,
      roomId,
      ratePlanId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 100
    );
  }
}
