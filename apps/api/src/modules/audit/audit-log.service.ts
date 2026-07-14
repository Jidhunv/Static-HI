import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    tenantId?: string;
    userId: string;
    userEmail: string;
    userName: string;
    action: string; // create, update, delete, view, login
    entity: string; // User, Property, Booking, Commission
    entityId?: string;
    entityName?: string;
    changes?: any;
    status?: 'success' | 'failure';
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId || null,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || null,
        entityName: data.entityName || null,
        changes: data.changes || null,
        status: data.status || 'success',
        errorMessage: data.errorMessage || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  }

  async getLogs(
    userId: string,
    userRole: string,
    tenantId?: string,
    filters?: {
      action?: string;
      entity?: string;
      startDate?: Date;
      endDate?: Date;
      skip?: number;
      take?: number;
    },
  ) {
    const skip = filters?.skip || 0;
    const take = filters?.take || 50;

    // Platform admin sees everything
    if (userRole === 'superadmin') {
      return this.prisma.auditLog.findMany({
        where: {
          isArchived: false,
          ...(filters?.action && { action: filters.action }),
          ...(filters?.entity && { entity: filters.entity }),
          ...(filters?.startDate && {
            createdAt: { gte: filters.startDate },
          }),
          ...(filters?.endDate && {
            createdAt: { lte: filters.endDate },
          }),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    }

    // Tenant users see only their tenant's logs
    if (!tenantId) throw new Error('TenantId required for non-admin users');

    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        isArchived: false,
        ...(filters?.action && { action: filters.action }),
        ...(filters?.entity && { entity: filters.entity }),
        ...(filters?.startDate && {
          createdAt: { gte: filters.startDate },
        }),
        ...(filters?.endDate && {
          createdAt: { lte: filters.endDate },
        }),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getLogDetail(logId: string, userRole: string, tenantId?: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id: logId },
    });

    if (!log) return null;

    // Platform admin sees all, tenants see only their logs
    if (userRole !== 'superadmin' && log.tenantId !== tenantId) {
      return null;
    }

    return log;
  }

  async getUserActivity(userId: string, tenantId?: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.auditLog.findMany({
      where: {
        userId,
        ...(tenantId && { tenantId }),
        isArchived: false,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getEntityHistory(entityId: string, tenantId?: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityId,
        ...(tenantId && { tenantId }),
        isArchived: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async archiveOldLogs() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.auditLog.updateMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        isArchived: false,
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });
  }

  // Run every day at 2 AM to archive logs older than 30 days
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleArchiving() {
    await this.archiveOldLogs();
    console.log('[AuditLog] Archived logs older than 30 days');
  }

  async getArchiveStats(userRole: string, tenantId?: string) {
    if (userRole === 'superadmin') {
      return this.prisma.auditLog.groupBy({
        by: ['isArchived'],
        _count: true,
      });
    }

    if (!tenantId) throw new Error('TenantId required for non-admin users');

    return this.prisma.auditLog.groupBy({
      by: ['isArchived'],
      where: { tenantId },
      _count: true,
    });
  }

  async getActivityStats(tenantId?: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        ...(tenantId && { tenantId }),
        isArchived: false,
        createdAt: { gte: startDate },
      },
      _count: true,
    });
  }
}
