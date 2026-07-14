import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getTenants() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        businessType: true,
        kycStatus: true,
        createdAt: true,
        users: {
          where: { role: 'admin' },
          select: { email: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }).then(tenants =>
      tenants.map(t => ({
        ...t,
        adminEmail: t.users[0]?.email || 'N/A',
      }))
    );
  }

  async approveTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status === 'active') {
      throw new BadRequestException('Tenant is already active');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'active' },
    });
  }

  async rejectTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status === 'rejected') {
      throw new BadRequestException('Tenant is already rejected');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'rejected' },
    });
  }
}
