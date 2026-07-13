import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class AmenityService {
  constructor(private prisma: PrismaService) {}

  async getAllAmenities() {
    return this.prisma.amenity.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getAmenitiesByCategory(category: string) {
    return this.prisma.amenity.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
  }

  async getAmenityById(id: string) {
    return this.prisma.amenity.findUnique({
      where: { id },
    });
  }
}
