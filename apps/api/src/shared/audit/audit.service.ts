import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';

interface AuditLog {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(data: AuditLog) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId,
          changes: data.changes,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date(),
        },
      });
    } catch (e) {
      this.logger.error('Audit log failed', e);
    }
  }

  async getById(id: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { entityId: id },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getByUser(userId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
