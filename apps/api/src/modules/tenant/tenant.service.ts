import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async getTenantInfo(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        primaryCurrency: true,
        primaryColor: true,
        logoUrl: true,
        status: true,
      },
    });
  }

  async getTenantSettings(tenantId: string) {
    return this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });
  }
}
