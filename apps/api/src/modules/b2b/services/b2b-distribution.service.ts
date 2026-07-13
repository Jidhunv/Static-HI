import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class B2BDistributionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Reseller requests access to a source tenant's B2B inventory
   */
  async requestDistributionAccess(
    resellerTenantId: string,
    sourceTenantId: string,
  ) {
    if (resellerTenantId === sourceTenantId) {
      throw new BadRequestException(
        'Cannot request distribution from own tenant',
      );
    }

    // Check if grant already exists
    const existing = await this.prisma.distributionGrant.findUnique({
      where: {
        sourceTenantId_targetTenantId: {
          sourceTenantId,
          targetTenantId: resellerTenantId,
        },
      },
    });

    if (existing) {
      if (existing.status === 'pending') {
        throw new BadRequestException('Request already pending');
      }
      if (existing.status === 'approved') {
        throw new BadRequestException('Access already granted');
      }
    }

    // Create or update grant request
    const grant = await this.prisma.distributionGrant.upsert({
      where: {
        sourceTenantId_targetTenantId: {
          sourceTenantId,
          targetTenantId: resellerTenantId,
        },
      },
      update: { status: 'pending' },
      create: {
        sourceTenantId,
        targetTenantId: resellerTenantId,
        status: 'pending',
      },
    });

    return grant;
  }

  /**
   * Source tenant approves distribution grant (optionally with custom margin)
   */
  async approveDistributionGrant(
    sourceTenantId: string,
    grantId: string,
    customB2BMargin?: number,
  ) {
    const grant = await this.prisma.distributionGrant.findUnique({
      where: { id: grantId },
    });

    if (!grant || grant.sourceTenantId !== sourceTenantId) {
      throw new NotFoundException('Distribution grant not found');
    }

    if (grant.status === 'approved') {
      throw new BadRequestException('Grant already approved');
    }

    return this.prisma.distributionGrant.update({
      where: { id: grantId },
      data: {
        status: 'approved',
        customB2BMargin,
      },
    });
  }

  /**
   * Source tenant rejects or revokes distribution grant
   */
  async rejectDistributionGrant(sourceTenantId: string, grantId: string) {
    const grant = await this.prisma.distributionGrant.findUnique({
      where: { id: grantId },
    });

    if (!grant || grant.sourceTenantId !== sourceTenantId) {
      throw new NotFoundException('Distribution grant not found');
    }

    return this.prisma.distributionGrant.update({
      where: { id: grantId },
      data: { status: 'rejected' },
    });
  }

  /**
   * Get outgoing distribution requests/grants (source tenant perspective)
   */
  async getOutgoingGrants(sourceTenantId: string, status?: string) {
    return this.prisma.distributionGrant.findMany({
      where: {
        sourceTenantId,
        ...(status && { status }),
      },
      include: {
        targetTenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get incoming distribution requests/grants (reseller tenant perspective)
   */
  async getIncomingGrants(targetTenantId: string, status?: string) {
    return this.prisma.distributionGrant.findMany({
      where: {
        targetTenantId,
        ...(status && { status }),
      },
      include: {
        sourceTenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get specific distribution grant
   */
  async getDistributionGrant(
    grantId: string,
    tenantId: string,
  ) {
    const grant = await this.prisma.distributionGrant.findUnique({
      where: { id: grantId },
      include: {
        sourceTenant: { select: { id: true, name: true } },
        targetTenant: { select: { id: true, name: true } },
      },
    });

    if (!grant) {
      throw new NotFoundException('Distribution grant not found');
    }

    // Verify tenant can access this grant
    if (
      grant.sourceTenantId !== tenantId &&
      grant.targetTenantId !== tenantId
    ) {
      throw new NotFoundException('Distribution grant not found');
    }

    return grant;
  }
}
