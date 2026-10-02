import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

type TenantStatus = 'active' | 'pending' | 'rejected';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getTenants() {
    const tenants = await this.prisma.tenant.findMany({
      select: { id: true, name: true, slug: true, status: true, businessType: true, kycStatus: true, createdAt: true, users: { where: { role: 'admin' }, select: { email: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
    return tenants.map(t => ({ ...t, adminEmail: t.users[0]?.email || 'N/A' }));
  }

  private async updateTenantStatus(tenantId: string, newStatus: TenantStatus, invalidStatus: TenantStatus): Promise<any> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.status === invalidStatus) throw new BadRequestException(`Tenant is already ${invalidStatus}`);
    return this.prisma.tenant.update({ where: { id: tenantId }, data: { status: newStatus } });
  }

  async approveTenant(tenantId: string) {
    return this.updateTenantStatus(tenantId, 'active', 'active');
  }

  async rejectTenant(tenantId: string) {
    return this.updateTenantStatus(tenantId, 'rejected', 'rejected');
  }
}
