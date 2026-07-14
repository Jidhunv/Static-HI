import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  /**
   * Get audit logs with role-based visibility
   * Platform Admin sees all, Tenants see only their logs
   */
  @Get()
  async getLogs(
    @Query('userId') userId: string,
    @Query('userRole') userRole: string,
    @Query('tenantId') tenantId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.auditLogService.getLogs(userId, userRole, tenantId, {
      action,
      entity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 50,
    });
  }

  /**
   * Get specific audit log detail
   */
  @Get(':logId')
  async getLogDetail(
    @Param('logId') logId: string,
    @Query('userId') userId: string,
    @Query('userRole') userRole: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.auditLogService.getLogDetail(logId, userRole, tenantId);
  }

  /**
   * Get activity history for specific user
   */
  @Get('user/:userId/activity')
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('tenantId') tenantId?: string,
    @Query('days') days?: string,
  ) {
    return this.auditLogService.getUserActivity(
      userId,
      tenantId,
      days ? parseInt(days) : 7,
    );
  }

  /**
   * Get audit history for specific entity
   */
  @Get('entity/:entityId/history')
  async getEntityHistory(
    @Param('entityId') entityId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.auditLogService.getEntityHistory(entityId, tenantId);
  }

  /**
   * Get archive statistics
   */
  @Get('stats/archive')
  async getArchiveStats(
    @Query('userRole') userRole: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.auditLogService.getArchiveStats(userRole, tenantId);
  }

  /**
   * Get activity statistics by action type
   */
  @Get('stats/activity')
  async getActivityStats(
    @Query('tenantId') tenantId?: string,
    @Query('days') days?: string,
  ) {
    return this.auditLogService.getActivityStats(
      tenantId,
      days ? parseInt(days) : 7,
    );
  }
}
