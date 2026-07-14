import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { nanoid } from 'nanoid';

interface RateConfigDto {
  roomType: string;
  rateType: 'domestic' | 'international';
  startDate: string;
  endDate: string;
  selectedWeekdays: string[];
  rate: number;
}

@Injectable()
export class PropertyRateService {
  constructor(private prisma: PrismaService) {}

  /**
   * Save rate configuration for a property (tenant-scoped)
   */
  async saveRateConfig(
    tenantId: string,
    propertyId: string,
    rateConfig: RateConfigDto,
  ) {
    // Verify property belongs to tenant
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Get or create PropertyConfiguration for this tenant-property pair
    let config = await this.prisma.propertyConfiguration.findUnique({
      where: {
        tenantId_propertyId: { tenantId, propertyId },
      },
    });

    if (!config) {
      config = await this.prisma.propertyConfiguration.create({
        data: {
          tenantId,
          propertyId,
        },
      });
    }

    // Validate dates
    const startDate = new Date(rateConfig.startDate);
    const endDate = new Date(rateConfig.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (!rateConfig.selectedWeekdays || rateConfig.selectedWeekdays.length === 0) {
      throw new BadRequestException('Select at least one weekday');
    }

    if (!rateConfig.rate || rateConfig.rate <= 0) {
      throw new BadRequestException('Rate must be greater than 0');
    }

    // Create PropertyRate
    const propertyRate = await this.prisma.propertyRate.create({
      data: {
        tenantId,
        propertyId,
        configId: config.id,
        roomType: rateConfig.roomType,
        rateType: rateConfig.rateType,
        startDate,
        endDate,
        weekdays: rateConfig.selectedWeekdays,
        rate: rateConfig.rate,
      },
    });

    return propertyRate;
  }

  /**
   * Get all rates for a property (tenant-scoped)
   */
  async getPropertyRates(tenantId: string, propertyId: string) {
    const rates = await this.prisma.propertyRate.findMany({
      where: {
        tenantId,
        propertyId,
      },
      orderBy: [{ startDate: 'asc' }, { roomType: 'asc' }],
    });

    return rates;
  }

  /**
   * Get rates for specific date range and room type
   */
  async getRatesForDateRange(
    tenantId: string,
    propertyId: string,
    roomType: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const rates = await this.prisma.propertyRate.findMany({
      where: {
        tenantId,
        propertyId,
        roomType,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      orderBy: { startDate: 'asc' },
    });

    return rates;
  }

  /**
   * Get rate for specific date and room type
   */
  async getApplicableRate(
    tenantId: string,
    propertyId: string,
    roomType: string,
    rateType: string,
    date: Date,
  ) {
    const dayOfWeek = this.getDayOfWeek(date);

    const rate = await this.prisma.propertyRate.findFirst({
      where: {
        tenantId,
        propertyId,
        roomType,
        rateType,
        startDate: { lte: date },
        endDate: { gte: date },
        weekdays: {
          hasSome: [dayOfWeek],
        },
      },
    });

    return rate;
  }

  /**
   * Delete rate configuration
   */
  async deleteRateConfig(tenantId: string, rateId: string) {
    const rate = await this.prisma.propertyRate.findFirst({
      where: { id: rateId, tenantId },
    });

    if (!rate) {
      throw new NotFoundException('Rate configuration not found');
    }

    await this.prisma.propertyRate.delete({
      where: { id: rateId },
    });

    return { success: true };
  }

  /**
   * Save property configuration (amenities, policies, finance)
   */
  async savePropertyConfig(
    tenantId: string,
    propertyId: string,
    configData: {
      amenities?: string[];
      cancellationPolicy?: string;
      otherPolicies?: string;
      financeManager?: any;
      salesperson?: any;
      bankDetails?: any;
      moneyTransfer?: string;
      contractStartDate?: string;
      contractEndDate?: string;
      contractUrl?: string;
    },
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    let config = await this.prisma.propertyConfiguration.findUnique({
      where: {
        tenantId_propertyId: { tenantId, propertyId },
      },
    });

    if (!config) {
      config = await this.prisma.propertyConfiguration.create({
        data: {
          tenantId,
          propertyId,
          ...configData,
        },
      });
    } else {
      config = await this.prisma.propertyConfiguration.update({
        where: { id: config.id },
        data: configData,
      });
    }

    return config;
  }

  /**
   * Get property configuration
   */
  async getPropertyConfig(tenantId: string, propertyId: string) {
    const config = await this.prisma.propertyConfiguration.findUnique({
      where: {
        tenantId_propertyId: { tenantId, propertyId },
      },
      include: {
        rates: {
          orderBy: [{ startDate: 'asc' }, { roomType: 'asc' }],
        },
      },
    });

    return config;
  }

  /**
   * Helper: Get day of week (MON, TUE, etc.)
   */
  private getDayOfWeek(date: Date): string {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  }
}
