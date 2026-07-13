import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  async getRoomsForProperty(tenantId: string, propertyId: string) {
    // Verify tenant ownership of property
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.room.findMany({
      where: { propertyId },
      include: { photos: true },
      orderBy: { type: 'asc' },
    });
  }

  async getRoomById(tenantId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { photos: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Verify tenant owns the property this room belongs to
    const property = await this.prisma.property.findFirst({
      where: { id: room.propertyId, tenantId },
    });

    if (!property) {
      throw new NotFoundException('Room not found or access denied');
    }

    return room;
  }

  async createRoom(
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

    return this.prisma.room.create({
      data: {
        propertyId,
        type: dto.type,
        code: dto.code || `${dto.type.substring(0, 3)}-${Date.now()}`,
        quantity: dto.quantity,
        area: dto.area,
        areaUnit: dto.areaUnit || 'sqm',
        minAdults: dto.minAdults || 1,
        maxAdults: dto.maxAdults || 2,
        maxOccupancy: dto.maxOccupancy || 2,
        smokingPolicy: dto.smokingPolicy,
        description: dto.description,
        status: dto.status || 'active',
        amenityCodes: dto.amenityCodes || [],
      },
    });
  }
}
