import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class RatePlanService {
  constructor(private prisma: PrismaService) {}

  async getRatePlansForProperty(tenantId: string, propertyId: string) {
    // Verify tenant ownership
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.ratePlan.findMany({
      where: { propertyId },
      include: { room: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRatePlanById(tenantId: string, ratePlanId: string) {
    const ratePlan = await this.prisma.ratePlan.findUnique({
      where: { id: ratePlanId },
      include: {
        property: { select: { tenantId: true } },
        room: true,
      },
    });

    if (!ratePlan || ratePlan.property.tenantId !== tenantId) {
      throw new NotFoundException('Rate plan not found');
    }

    return ratePlan;
  }

  async createRatePlan(
    tenantId: string,
    propertyId: string,
    dto: any,
  ) {
    // Verify ownership
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.ratePlan.create({
      data: {
        propertyId,
        roomId: dto.roomId,
        code: dto.code || `RP-${Date.now()}`,
        name: dto.name,
        boardType: dto.boardType,
        status: dto.status || 'active',
        comments: dto.comments,
        taxInclusive: dto.taxInclusive !== false,
        minLengthOfStay: dto.minLengthOfStay || 1,
        maxLengthOfStay: dto.maxLengthOfStay,
      },
      include: { room: true },
    });
  }
}
