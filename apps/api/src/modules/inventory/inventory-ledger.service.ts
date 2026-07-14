import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * Inventory Ledger Service
 * Manages append-only inventory changes with atomic booking consistency
 * Source of truth: inventory_ledger (appends only)
 * Fast reads: current_availability (updated transactionally)
 */
@Injectable()
export class InventoryLedgerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record inventory change (append-only ledger entry)
   */
  async recordChange(data: {
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    date: Date;
    delta: number; // positive or negative
    reason: 'manual_allocation' | 'booking' | 'cancellation_release' | 'amendment' | 'blackout_block';
    actorUserId?: string;
    actorEmail?: string;
    bookingId?: string;
  }) {
    return this.prisma.inventoryLedger.create({
      data,
    });
  }

  /**
   * Check current availability for date (fast read from materialized view)
   */
  async getAvailability(
    propertyId: string,
    roomId: string,
    ratePlanId: string,
    date: Date
  ): Promise<number> {
    const current = await this.prisma.currentAvailability.findUnique({
      where: {
        propertyId_roomId_ratePlanId_date: {
          propertyId,
          roomId,
          ratePlanId,
          date,
        },
      },
    });

    return current?.available || 0;
  }

  /**
   * Check availability for date range
   */
  async getAvailabilityRange(
    propertyId: string,
    roomId: string,
    ratePlanId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, number>> {
    const availabilities = await this.prisma.currentAvailability.findMany({
      where: {
        propertyId,
        roomId,
        ratePlanId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const map = new Map<string, number>();
    availabilities.forEach((a) => {
      map.set(a.date.toISOString().split('T')[0], a.available);
    });

    return map;
  }

  /**
   * Atomic booking: check availability + decrement in single transaction
   * Prevents overbooking under concurrent requests
   */
  async bookRoom(data: {
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    checkInDate: Date;
    checkOutDate: Date;
    quantity: number;
    bookingId: string;
    actorUserId?: string;
    actorEmail?: string;
  }): Promise<{ success: boolean; message?: string }> {
    // Generate all dates in range
    const dates = this.getDateRange(data.checkInDate, data.checkOutDate);

    try {
      // Start transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Check availability for all dates (with row lock)
        for (const date of dates) {
          const current = await tx.currentAvailability.findUnique({
            where: {
              propertyId_roomId_ratePlanId_date: {
                propertyId: data.propertyId,
                roomId: data.roomId,
                ratePlanId: data.ratePlanId,
                date,
              },
            },
          });

          if (!current || current.available < data.quantity) {
            throw new BadRequestException(
              `Insufficient availability on ${date.toISOString().split('T')[0]}`
            );
          }
        }

        // Create ledger entries for all dates
        for (const date of dates) {
          await tx.inventoryLedger.create({
            data: {
              propertyId: data.propertyId,
              roomId: data.roomId,
              ratePlanId: data.ratePlanId,
              date,
              delta: -data.quantity,
              reason: 'booking',
              actorUserId: data.actorUserId,
              actorEmail: data.actorEmail,
              bookingId: data.bookingId,
            },
          });

          // Update materialized view
          await tx.currentAvailability.update({
            where: {
              propertyId_roomId_ratePlanId_date: {
                propertyId: data.propertyId,
                roomId: data.roomId,
                ratePlanId: data.ratePlanId,
                date,
              },
            },
            data: {
              available: {
                decrement: data.quantity,
              },
            },
          });
        }

        return { success: true };
      });

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Booking failed',
      };
    }
  }

  /**
   * Release inventory on cancellation
   */
  async cancelBooking(data: {
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    checkInDate: Date;
    checkOutDate: Date;
    quantity: number;
    bookingId: string;
    actorUserId?: string;
    actorEmail?: string;
  }) {
    const dates = this.getDateRange(data.checkInDate, data.checkOutDate);

    return this.prisma.$transaction(async (tx) => {
      for (const date of dates) {
        // Create compensating ledger entry
        await tx.inventoryLedger.create({
          data: {
            propertyId: data.propertyId,
            roomId: data.roomId,
            ratePlanId: data.ratePlanId,
            date,
            delta: data.quantity, // positive
            reason: 'cancellation_release',
            actorUserId: data.actorUserId,
            actorEmail: data.actorEmail,
            bookingId: data.bookingId,
          },
        });

        // Update materialized view
        await tx.currentAvailability.update({
          where: {
            propertyId_roomId_ratePlanId_date: {
              propertyId: data.propertyId,
              roomId: data.roomId,
              ratePlanId: data.ratePlanId,
              date,
            },
          },
          data: {
            available: {
              increment: data.quantity,
            },
          },
        });
      }
    });
  }

  /**
   * Manual allocation (tenant staff increases available rooms)
   */
  async allocateRooms(data: {
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    date: Date;
    quantity: number;
    actorUserId: string;
    actorEmail: string;
    reason?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Create ledger entry
      await tx.inventoryLedger.create({
        data: {
          propertyId: data.propertyId,
          roomId: data.roomId,
          ratePlanId: data.ratePlanId,
          date: data.date,
          delta: data.quantity,
          reason: 'manual_allocation',
          actorUserId: data.actorUserId,
          actorEmail: data.actorEmail,
        },
      });

      // Ensure current_availability row exists
      const existing = await tx.currentAvailability.findUnique({
        where: {
          propertyId_roomId_ratePlanId_date: {
            propertyId: data.propertyId,
            roomId: data.roomId,
            ratePlanId: data.ratePlanId,
            date: data.date,
          },
        },
      });

      if (existing) {
        await tx.currentAvailability.update({
          where: {
            propertyId_roomId_ratePlanId_date: {
              propertyId: data.propertyId,
              roomId: data.roomId,
              ratePlanId: data.ratePlanId,
              date: data.date,
            },
          },
          data: {
            available: {
              increment: data.quantity,
            },
          },
        });
      } else {
        await tx.currentAvailability.create({
          data: {
            propertyId: data.propertyId,
            roomId: data.roomId,
            ratePlanId: data.ratePlanId,
            date: data.date,
            available: data.quantity,
          },
        });
      }
    });
  }

  /**
   * Block inventory (e.g., blackout period)
   */
  async blockInventory(data: {
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    actorUserId: string;
    actorEmail: string;
  }) {
    const dates = this.getDateRange(data.startDate, data.endDate);

    return this.prisma.$transaction(async (tx) => {
      for (const date of dates) {
        const current = await tx.currentAvailability.findUnique({
          where: {
            propertyId_roomId_ratePlanId_date: {
              propertyId: data.propertyId,
              roomId: data.roomId,
              ratePlanId: data.ratePlanId,
              date,
            },
          },
        });

        const availableToBlock = current?.available || 0;

        // Create ledger entry with negative delta = all available
        if (availableToBlock > 0) {
          await tx.inventoryLedger.create({
            data: {
              propertyId: data.propertyId,
              roomId: data.roomId,
              ratePlanId: data.ratePlanId,
              date,
              delta: -availableToBlock,
              reason: 'blackout_block',
              actorUserId: data.actorUserId,
              actorEmail: data.actorEmail,
            },
          });

          // Update availability to 0
          await tx.currentAvailability.update({
            where: {
              propertyId_roomId_ratePlanId_date: {
                propertyId: data.propertyId,
                roomId: data.roomId,
                ratePlanId: data.ratePlanId,
                date,
              },
            },
            data: {
              available: 0,
            },
          });
        }
      }
    });
  }

  /**
   * Get full ledger history for audit
   */
  async getLedgerHistory(
    propertyId: string,
    roomId?: string,
    ratePlanId?: string,
    startDate?: Date,
    endDate?: Date,
    skip = 0,
    take = 100
  ) {
    return this.prisma.inventoryLedger.findMany({
      where: {
        propertyId,
        ...(roomId && { roomId }),
        ...(ratePlanId && { ratePlanId }),
        ...(startDate && endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  /**
   * Helper: Generate date array between two dates (exclusive end date like booking does)
   */
  private getDateRange(checkInDate: Date, checkOutDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(checkInDate);

    while (current < checkOutDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }
}
