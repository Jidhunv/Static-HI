import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}

  async createProperty(tenantId: string, dto: CreatePropertyDto) {
    // Generate unique property code
    const code = `${dto.chainName?.substring(0, 3).toUpperCase() || 'PROP'}-${dto.city?.substring(0, 3).toUpperCase()}-${nanoid(3).toUpperCase()}`;

    const property = await this.prisma.property.create({
      data: {
        tenantId,
        name: dto.name,
        code,
        type: dto.type,
        countryId: dto.countryId,
        stateId: dto.stateId,
        city: dto.city,
        address: dto.address,
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        starCategory: dto.starCategory,
        chainName: dto.chainName,
        checkInTime: dto.checkInTime || '14:00',
        checkOutTime: dto.checkOutTime || '12:00',
        status: dto.status || 'active',
        allowEarlyCheckIn: dto.allowEarlyCheckIn || false,
        allowLateCheckOut: dto.allowLateCheckOut || false,
        allowChildren: dto.allowChildren || 'yes',
        visibility: dto.visibility || 'private',
        distributionMode: dto.distributionMode || 'open',
        description: dto.description,
        usp: dto.usp,
        globalHotelId: dto.globalHotelId,
      },
      include: { rooms: true },
    });

    return property;
  }

  async getProperties(tenantId: string, filters?: { status?: string; visibility?: string }) {
    return this.prisma.property.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.visibility && { visibility: filters.visibility }),
      },
      include: { rooms: { select: { id: true, type: true, quantity: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProperty(tenantId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
      include: {
        rooms: true,
        ratePlans: true,
        policies: true,
        bankDetails: { select: { id: true, verificationStatus: true } }, // Never return bank details in full
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async updateProperty(
    tenantId: string,
    propertyId: string,
    dto: UpdatePropertyDto,
  ) {
    // Verify ownership
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.property.update({
      where: { id: propertyId },
      data: {
        name: dto.name,
        description: dto.description,
        usp: dto.usp,
        status: dto.status,
        visibility: dto.visibility,
        distributionMode: dto.distributionMode,
      },
      include: { rooms: true },
    });
  }

  async deleteProperty(tenantId: string, propertyId: string) {
    // Verify ownership
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Soft delete by setting status to inactive
    return this.prisma.property.update({
      where: { id: propertyId },
      data: { status: 'inactive' },
    });
  }

  /**
   * Search global hotels for autocomplete
   */
  async searchGlobalHotels(name: string, countryId: string, limit: number = 10) {
    const country = await this.prisma.country.findUnique({ where: { id: countryId } });
    if (!country) {
      throw new BadRequestException('Country not found');
    }

    // Use trigram similarity for fuzzy search
    const hotels = await this.prisma.$queryRaw`
      SELECT id, name, address, city, "starRating", "chainAffiliation"
      FROM "GlobalHotel"
      WHERE country = ${country.name}
      AND "name" % ${name}
      ORDER BY similarity("name", ${name}) DESC
      LIMIT ${limit}
    `;

    return hotels;
  }
}
