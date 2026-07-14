import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { InventoryLedgerService } from '../inventory/inventory-ledger.service';

export interface BlackoutRange {
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
}

/**
 * Rate Card Service
 * Manages rate plans with enhancements: blackout periods and board types
 */
@Injectable()
export class RateCardService {
  constructor(
    private prisma: PrismaService,
    private inventoryLedger: InventoryLedgerService
  ) {}

  /**
   * Add blackout range to rate plan
   * Makes rate plan unbookable for those dates
   */
  async addBlackout(
    propertyId: string,
    ratePlanId: string,
    blackout: BlackoutRange,
    user: { id: string; email: string }
  ) {
    const ratePlan = await this.prisma.ratePlan.findUnique({
      where: { id: ratePlanId },
    });

    if (!ratePlan) {
      throw new NotFoundException('Rate plan not found');
    }

    if (ratePlan.propertyId !== propertyId) {
      throw new BadRequestException(
        'Rate plan does not belong to this property'
      );
    }

    if (blackout.startDate >= blackout.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Parse existing blackouts
    const existing: BlackoutRange[] = ratePlan.blackoutRanges
      ? JSON.parse(ratePlan.blackoutRanges)
      : [];

    // Add new blackout
    existing.push(blackout);

    // Check for overlaps (optional: could allow overlapping blackouts)
    this.checkBlackoutOverlaps(existing);

    // Update rate plan
    const updated = await this.prisma.ratePlan.update({
      where: { id: ratePlanId },
      data: {
        blackoutRanges: JSON.stringify(existing),
      },
    });

    // Block inventory for blackout dates
    await this.blockInventoryForBlackout(
      propertyId,
      ratePlanId,
      blackout,
      user
    );

    return updated;
  }

  /**
   * Remove blackout range
   */
  async removeBlackout(
    propertyId: string,
    ratePlanId: string,
    reason: string,
    user: { id: string; email: string }
  ) {
    const ratePlan = await this.prisma.ratePlan.findUnique({
      where: { id: ratePlanId },
    });

    if (!ratePlan) {
      throw new NotFoundException('Rate plan not found');
    }

    const blackouts: BlackoutRange[] = ratePlan.blackoutRanges
      ? JSON.parse(ratePlan.blackoutRanges)
      : [];

    const filtered = blackouts.filter((b) => b.reason !== reason);

    if (filtered.length === blackouts.length) {
      throw new BadRequestException(`Blackout with reason "${reason}" not found`);
    }

    // Update rate plan
    const updated = await this.prisma.ratePlan.update({
      where: { id: ratePlanId },
      data: {
        blackoutRanges: JSON.stringify(filtered),
      },
    });

    return updated;
  }

  /**
   * Get blackout ranges for rate plan
   */
  async getBlackouts(ratePlanId: string): Promise<BlackoutRange[]> {
    const ratePlan = await this.prisma.ratePlan.findUnique({
      where: { id: ratePlanId },
    });

    if (!ratePlan) {
      throw new NotFoundException('Rate plan not found');
    }

    return ratePlan.blackoutRanges ? JSON.parse(ratePlan.blackoutRanges) : [];
  }

  /**
   * Check if date is in blackout for rate plan
   * Returns true if date falls within any blackout range
   */
  async isDateBlackedOut(
    ratePlanId: string,
    checkDate: Date
  ): Promise<boolean> {
    const blackouts = await this.getBlackouts(ratePlanId);

    return blackouts.some(
      (b) =>
        checkDate >= new Date(b.startDate) && checkDate <= new Date(b.endDate)
    );
  }

  /**
   * Check if date range overlaps with blackouts
   */
  async isRangeBlackedOut(
    ratePlanId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const blackouts = await this.getBlackouts(ratePlanId);

    return blackouts.some((b) => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      return startDate < bEnd && endDate > bStart; // Range overlap check
    });
  }

  /**
   * Initialize board types (Super Admin)
   */
  async initializeBoardTypes() {
    const defaults = [
      { code: 'RO', name: 'Room Only', description: 'No meals included' },
      {
        code: 'BB',
        name: 'Bed & Breakfast',
        description: 'Breakfast included',
      },
      {
        code: 'HB',
        name: 'Half Board',
        description: 'Breakfast & dinner included',
      },
      {
        code: 'FB',
        name: 'Full Board',
        description: 'All meals included',
      },
    ];

    for (const bt of defaults) {
      await this.prisma.boardCode.upsert({
        where: { code: bt.code },
        update: {},
        create: bt,
      });
    }

    return defaults.length;
  }

  /**
   * Get all board types (for UI dropdowns)
   */
  async getBoardTypes() {
    return this.prisma.boardCode.findMany({
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Availability check order (precedence)
   * Used by booking engine to determine if booking is allowed
   *
   * Order:
   * 1. Blackout check (short-circuit if true)
   * 2. Inventory check
   * 3. Min/max length of stay
   * 4. Promotion validity (if applicable)
   * 5. Early-bird/booking deadline cutoffs
   * 6. Markup rules
   */
  async checkBookingEligibility(data: {
    ratePlanId: string;
    checkInDate: Date;
    checkOutDate: Date;
    quantity: number;
    propertyId: string;
    roomId: string;
  }): Promise<{
    eligible: boolean;
    reason?: string;
    violations: string[];
  }> {
    const violations: string[] = [];

    // 1. BLACKOUT CHECK (short-circuit)
    const isBlackedOut = await this.isRangeBlackedOut(
      data.ratePlanId,
      data.checkInDate,
      data.checkOutDate
    );

    if (isBlackedOut) {
      return {
        eligible: false,
        reason: 'Date range contains blackout dates',
        violations: ['Blackout period active for requested dates'],
      };
    }

    // 2. INVENTORY CHECK
    const ratePlan = await this.prisma.ratePlan.findUnique({
      where: { id: data.ratePlanId },
    });

    if (!ratePlan) {
      throw new NotFoundException('Rate plan not found');
    }

    const availabilityMap = await this.inventoryLedger.getAvailabilityRange(
      data.propertyId,
      data.roomId,
      data.ratePlanId,
      data.checkInDate,
      data.checkOutDate
    );

    for (const [date, available] of availabilityMap.entries()) {
      if (available < data.quantity) {
        violations.push(`Insufficient availability on ${date}`);
      }
    }

    // 3. MIN/MAX LENGTH OF STAY
    const nights = this.getNumberOfNights(data.checkInDate, data.checkOutDate);

    if (nights < ratePlan.minLengthOfStay) {
      violations.push(
        `Minimum stay is ${ratePlan.minLengthOfStay} nights, requested ${nights}`
      );
    }

    if (ratePlan.maxLengthOfStay && nights > ratePlan.maxLengthOfStay) {
      violations.push(
        `Maximum stay is ${ratePlan.maxLengthOfStay} nights, requested ${nights}`
      );
    }

    return {
      eligible: violations.length === 0,
      reason: violations.length > 0 ? 'Booking eligibility check failed' : '',
      violations,
    };
  }

  /**
   * Helper: Check for overlapping blackout ranges
   */
  private checkBlackoutOverlaps(blackouts: BlackoutRange[]) {
    for (let i = 0; i < blackouts.length; i++) {
      for (let j = i + 1; j < blackouts.length; j++) {
        const b1 = blackouts[i];
        const b2 = blackouts[j];
        const start1 = new Date(b1.startDate);
        const end1 = new Date(b1.endDate);
        const start2 = new Date(b2.startDate);
        const end2 = new Date(b2.endDate);

        // Check overlap
        if (start1 < end2 && start2 < end1) {
          // Overlapping blackouts are allowed, but log a warning
          console.warn(
            `Blackout overlap detected: ${b1.reason} and ${b2.reason}`
          );
        }
      }
    }
  }

  /**
   * Helper: Block inventory for blackout period
   * Sets availability to 0 for all dates in range
   */
  private async blockInventoryForBlackout(
    propertyId: string,
    ratePlanId: string,
    blackout: BlackoutRange,
    user: { id: string; email: string }
  ) {
    const room = await this.prisma.room.findFirst({
      where: {
        ratePlans: {
          some: {
            id: ratePlanId,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found for rate plan');
    }

    await this.inventoryLedger.blockInventory({
      propertyId,
      roomId: room.id,
      ratePlanId,
      startDate: new Date(blackout.startDate),
      endDate: new Date(blackout.endDate),
      reason: `Blackout: ${blackout.reason}`,
      actorUserId: user.id,
      actorEmail: user.email,
    });
  }

  /**
   * Helper: Calculate number of nights
   */
  private getNumberOfNights(checkInDate: Date, checkOutDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / oneDay);
  }
}
