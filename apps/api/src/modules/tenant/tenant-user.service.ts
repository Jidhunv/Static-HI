import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TenantUserService {
  constructor(private prisma: PrismaService) {}

  async createUser(tenantId: string, data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roles?: string[];
  }) {
    const existing = await this.prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId, email: data.email } },
    });
    if (existing) throw new BadRequestException('Email already exists');

    return this.prisma.tenantUser.create({
      data: {
        tenantId,
        email: data.email,
        password: data.password, // TODO: hash with bcrypt
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'staff',
        permissions: data.roles || [],
      },
    });
  }

  async getUser(userId: string, tenantId: string) {
    const user = await this.prisma.tenantUser.findFirst({
      where: { id: userId, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async listUsers(tenantId: string, filters?: { status?: string }) {
    return this.prisma.tenantUser.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        permissions: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(userId: string, tenantId: string, data: Partial<{
    firstName: string;
    lastName: string;
    permissions: string[];
  }>) {
    return this.prisma.tenantUser.update({
      where: { id: userId },
      data,
    });
  }

  async assignRoles(userId: string, tenantId: string, permissions: string[]) {
    return this.prisma.tenantUser.update({
      where: { id: userId },
      data: { permissions },
    });
  }

  async updateStatus(userId: string, tenantId: string, status: 'active' | 'inactive' | 'suspended') {
    return this.prisma.tenantUser.update({
      where: { id: userId },
      data: { status },
    });
  }

  async deleteUser(userId: string, tenantId: string) {
    return this.prisma.tenantUser.delete({
      where: { id: userId },
    });
  }

  async getPermissions(userId: string, tenantId: string): Promise<string[]> {
    const user = await this.getUser(userId, tenantId);
    return user.permissions || [];
  }

  async hasPermission(userId: string, tenantId: string, permission: string): Promise<boolean> {
    const permissions = await this.getPermissions(userId, tenantId);
    return permissions.includes(permission);
  }
}
