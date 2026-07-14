import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * Role-based access control service
 * Manages permissions for different user roles at tenant level
 */
@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Initialize default roles for a tenant
   */
  async initializeTenantRoles(tenantId: string) {
    const roles = [
      {
        name: 'Admin',
        description: 'Full access to all features and configurations',
        level: 1,
        permissions: [
          'users.manage',
          'hotels.manage',
          'bookings.view',
          'bookings.manage',
          'rates.manage',
          'policies.manage',
          'finance.view',
          'finance.manage',
          'reports.view',
          'b2b_agents.manage',
          'commissions.view',
          'settlements.view',
          'settings.manage',
        ],
      },
      {
        name: 'MidOffice',
        description: 'Manage hotels and pricing',
        level: 2,
        permissions: [
          'hotels.manage',
          'rates.manage',
          'policies.manage',
          'bookings.view',
          'reports.view',
        ],
      },
      {
        name: 'Finance',
        description: 'Manage financial transactions and commissions',
        level: 3,
        permissions: [
          'finance.view',
          'finance.manage',
          'commissions.view',
          'settlements.view',
          'reports.view',
        ],
      },
      {
        name: 'Sales',
        description: 'View sales data and commissions',
        level: 3,
        permissions: [
          'bookings.view',
          'reports.view',
          'commissions.view',
        ],
      },
      {
        name: 'FrontOffice',
        description: 'Manage daily operations and check-ins',
        level: 4,
        permissions: [
          'bookings.view',
          'bookings.update_status',
          'hotels.view',
          'guests.manage',
        ],
      },
      {
        name: 'B2BAgent',
        description: 'Access to own bookings and commission tracking',
        level: 5,
        permissions: [
          'bookings.view_own',
          'commissions.view_own',
          'reports.view_own',
        ],
      },
    ];

    const createdRoles = [];
    for (const role of roles) {
      try {
        const createdRole = await this.prisma.tenantRole.create({
          data: {
            tenantId,
            ...role,
          },
        });
        createdRoles.push(createdRole);
      } catch (err) {
        // Role might already exist, skip
      }
    }

    return createdRoles;
  }

  /**
   * Get role by name
   */
  async getRoleByName(tenantId: string, roleName: string) {
    return this.prisma.tenantRole.findUnique({
      where: {
        tenantId_name: { tenantId, name: roleName },
      },
    });
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    tenantId: string,
    userId: string,
    permission: string,
  ): Promise<boolean> {
    const user = await this.prisma.tenantUser.findUnique({
      where: { id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) return false;

    // Check if any role has the permission
    for (const role of user.roles) {
      if (role.permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(tenantId: string, userId: string) {
    const user = await this.prisma.tenantUser.findUnique({
      where: { id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) return [];

    const permissions = new Set<string>();
    for (const role of user.roles) {
      role.permissions.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    tenantId: string,
    userId: string,
    roleName: string,
  ) {
    const role = await this.getRoleByName(tenantId, roleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    return this.prisma.tenantUser.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: role.id },
        },
      },
    });
  }

  /**
   * Get all roles for tenant
   */
  async getTenantRoles(tenantId: string) {
    return this.prisma.tenantRole.findMany({
      where: { tenantId },
      orderBy: { level: 'asc' },
    });
  }
}
