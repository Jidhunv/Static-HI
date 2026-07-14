import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

interface CreateB2BAgentDto {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  commissionRate?: number;
  commissionType?: string;
}

@Injectable()
export class B2BAgentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create new B2B agent for tenant
   */
  async createAgent(tenantId: string, agentData: CreateB2BAgentDto) {
    // Check if email already exists for this tenant
    const existing = await this.prisma.b2BAgent.findUnique({
      where: {
        tenantId_email: { tenantId, email: agentData.email },
      },
    });

    if (existing) {
      throw new BadRequestException('Agent email already exists for this tenant');
    }

    const agent = await this.prisma.b2BAgent.create({
      data: {
        tenantId,
        ...agentData,
        commissionRate: agentData.commissionRate || 10,
        commissionType: agentData.commissionType || 'percentage',
      },
    });

    return agent;
  }

  /**
   * Get agent by ID
   */
  async getAgent(tenantId: string, agentId: string) {
    const agent = await this.prisma.b2BAgent.findFirst({
      where: { id: agentId, tenantId },
      include: {
        users: true,
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  /**
   * List all agents for tenant
   */
  async listAgents(
    tenantId: string,
    filters?: {
      status?: string;
      kycVerified?: boolean;
    },
  ) {
    return this.prisma.b2BAgent.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.kycVerified !== undefined && {
          kycVerified: filters.kycVerified,
        }),
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update agent details
   */
  async updateAgent(
    tenantId: string,
    agentId: string,
    updateData: Partial<CreateB2BAgentDto> & { logoUrl?: string; primaryColor?: string; secondaryColor?: string },
  ) {
    const agent = await this.getAgent(tenantId, agentId);

    return this.prisma.b2BAgent.update({
      where: { id: agentId },
      data: updateData,
    });
  }

  /**
   * Add user to B2B agent
   */
  async addAgentUser(
    agentId: string,
    userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: string;
    },
  ) {
    // Hash password (in production, use bcrypt)
    const hashedPassword = userData.password; // TODO: Hash this

    return this.prisma.b2BAgentUser.create({
      data: {
        agentId,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'user',
      },
    });
  }

  /**
   * Get agent users
   */
  async getAgentUsers(agentId: string) {
    return this.prisma.b2BAgentUser.findMany({
      where: { agentId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
  }

  /**
   * Verify KYC for agent
   */
  async verifyKYC(tenantId: string, agentId: string) {
    return this.prisma.b2BAgent.update({
      where: { id: agentId },
      data: { kycVerified: true },
    });
  }

  /**
   * Update commission rate
   */
  async updateCommission(
    tenantId: string,
    agentId: string,
    rate: number,
    type: string = 'percentage',
  ) {
    if (rate < 0 || rate > 100) {
      throw new BadRequestException('Commission rate must be between 0 and 100');
    }

    return this.prisma.b2BAgent.update({
      where: { id: agentId },
      data: {
        commissionRate: rate,
        commissionType: type,
      },
    });
  }

  /**
   * Suspend agent
   */
  async suspendAgent(tenantId: string, agentId: string) {
    return this.prisma.b2BAgent.update({
      where: { id: agentId },
      data: { status: 'suspended' },
    });
  }

  /**
   * Activate agent
   */
  async activateAgent(tenantId: string, agentId: string) {
    return this.prisma.b2BAgent.update({
      where: { id: agentId },
      data: { status: 'active' },
    });
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(agentId: string, startDate?: Date, endDate?: Date) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        b2bAgentId: agentId,
        ...(startDate && {
          createdAt: { gte: startDate },
        }),
        ...(endDate && {
          createdAt: { lte: endDate },
        }),
      },
      include: { commission: true },
    });

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(
      b => b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'checked_out',
    ).length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalCommission = bookings.reduce(
      (sum, b) => sum + (b.commission?.commissionAmount || 0),
      0,
    );

    return {
      totalBookings,
      confirmedBookings,
      conversionRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
      totalRevenue,
      totalCommission,
      averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
      averageCommission: confirmedBookings > 0 ? totalCommission / confirmedBookings : 0,
    };
  }
}
