import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CountryService {
  constructor(private prisma: PrismaService) {}

  async getAllCountries() {
    return this.prisma.country.findMany({
      include: {
        states: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCountryById(id: string) {
    return this.prisma.country.findUnique({
      where: { id },
      include: { states: true },
    });
  }

  async getCountryByCode(code: string) {
    return this.prisma.country.findUnique({
      where: { code },
      include: { states: true },
    });
  }
}
