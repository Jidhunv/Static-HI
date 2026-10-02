import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class InventoryPublishingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Publish inventory as public for other suppliers to consume
   */
  async publishInventoryAsPublic(
    supplierTenantId: string,
    data: {
      propertyId: string;
      roomId: string;
      ratePlanId: string;
      netRate: number;
      commissionShare: number; // % that supplier gets
      maxMarkup: number; // Max % others can add
      allowedCountries: string[];
      minBookingWindow: number;
      maxBookingWindow: number;
    },
  ) {
    // Verify property belongs to supplier
    const property = await this.prisma.property.findFirst({
      where: {
        id: data.propertyId,
        tenantId: supplierTenantId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Create or update inventory visibility
    const visibility = await this.prisma.inventoryVisibility.upsert({
      where: {
        supplierTenantId_propertyId_roomId_ratePlanId_visibilityLevel: {
          supplierTenantId,
          propertyId: data.propertyId,
          roomId: data.roomId,
          ratePlanId: data.ratePlanId,
          visibilityLevel: 'public',
        },
      },
      create: {
        supplierTenantId,
        propertyId: data.propertyId,
        roomId: data.roomId,
        ratePlanId: data.ratePlanId,
        visibilityLevel: 'public',
        netRate: data.netRate,
        maxMarkup: data.maxMarkup,
        commissionShare: data.commissionShare,
        allowedCountries: data.allowedCountries,
        minBookingWindow: data.minBookingWindow,
        maxBookingWindow: data.maxBookingWindow,
        status: 'active',
      },
      update: {
        netRate: data.netRate,
        maxMarkup: data.maxMarkup,
        commissionShare: data.commissionShare,
        allowedCountries: data.allowedCountries,
        minBookingWindow: data.minBookingWindow,
        maxBookingWindow: data.maxBookingWindow,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    return visibility;
  }

  /**
   * Mark inventory as private (hide from public)
   */
  async makeInventoryPrivate(
    supplierTenantId: string,
    propertyId: string,
    roomId: string,
    ratePlanId: string,
  ) {
    return await this.prisma.inventoryVisibility.updateMany({
      where: {
        supplierTenantId,
        propertyId,
        roomId,
        ratePlanId,
        visibilityLevel: 'public',
      },
      data: {
        visibilityLevel: 'private',
        status: 'inactive',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pause public inventory (temporarily hide)
   */
  async pauseInventory(
    supplierTenantId: string,
    propertyId: string,
    roomId: string,
    ratePlanId: string,
  ) {
    return await this.prisma.inventoryVisibility.updateMany({
      where: {
        supplierTenantId,
        propertyId,
        roomId,
        ratePlanId,
      },
      data: {
        status: 'paused',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Reserve inventory for specific partner
   */
  async reserveInventoryForPartner(
    supplierTenantId: string,
    partnerTenantId: string,
    propertyId: string,
    roomId: string,
    ratePlanId: string,
    allocationUnits: number,
    commissionPct: number,
  ) {
    // Find or create partnership
    const partnership = await this.prisma.supplierPartnership.upsert({
      where: {
        sourceSupplierStr_targetSupplierStr: {
          sourceSupplierStr: supplierTenantId,
          targetSupplierStr: partnerTenantId,
        },
      },
      create: {
        sourceSupplierStr: supplierTenantId,
        targetSupplierStr: partnerTenantId,
        partnershipType: 'reserved',
        defaultCommissionPct: commissionPct,
      },
      update: {},
    });

    // Create reserved inventory visibility
    const visibility = await this.prisma.inventoryVisibility.upsert({
      where: {
        supplierTenantId_propertyId_roomId_ratePlanId_visibilityLevel: {
          supplierTenantId,
          propertyId,
          roomId,
          ratePlanId,
          visibilityLevel: 'reserved',
        },
      },
      create: {
        supplierTenantId,
        propertyId,
        roomId,
        ratePlanId,
        visibilityLevel: 'reserved',
        reservedFor: partnerTenantId,
        reservedAllocation: allocationUnits,
        commissionShare: commissionPct,
        status: 'active',
        partnershipId: partnership.id,
      },
      update: {
        reservedAllocation: allocationUnits,
        updatedAt: new Date(),
      },
    });

    return visibility;
  }

  /**
   * Get all public inventory published by supplier
   */
  async getPublishedInventory(supplierTenantId: string) {
    return await this.prisma.inventoryVisibility.findMany({
      where: {
        supplierTenantId,
        visibilityLevel: 'public',
        status: 'active',
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        room: {
          select: {
            type: true,
            code: true,
          },
        },
        ratePlan: {
          select: {
            name: true,
            code: true,
            boardType: true,
          },
        },
      },
    });
  }

  /**
   * Update commission for public inventory
   */
  async updateCommissionForInventory(
    supplierTenantId: string,
    propertyId: string,
    roomId: string,
    ratePlanId: string,
    newCommissionPct: number,
  ) {
    return await this.prisma.inventoryVisibility.updateMany({
      where: {
        supplierTenantId,
        propertyId,
        roomId,
        ratePlanId,
        visibilityLevel: 'public',
      },
      data: {
        commissionShare: newCommissionPct,
        updatedAt: new Date(),
      },
    });
  }
}
