import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { CurrentPrincipal, Principal } from '../../shared/security/principal';

/**
 * Platform admins see every tenant's logs and may filter by tenant. Tenant users see only their
 * own tenant's logs, whatever the request asks for.
 */
@Controller('audit-logs')
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  private role = (actor: Principal) => (actor.isPlatformAdmin ? 'superadmin' : 'tenant');
  private scope = (actor: Principal, requested?: string) => (actor.isPlatformAdmin ? requested : actor.tenantId);

  /**
   * Get audit logs with role-based visibility
   */
  @Get()
  async getLogs(
    @CurrentPrincipal() actor: Principal,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.auditLogService.getLogs(actor.id, this.role(actor), actor.tenantId, {
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
  async getLogDetail(@CurrentPrincipal() actor: Principal, @Param('logId') logId: string) {
    return this.auditLogService.getLogDetail(logId, this.role(actor), actor.tenantId);
  }

  /**
   * Get activity history for specific user
   */
  @Get('user/:userId/activity')
  async getUserActivity(
    @CurrentPrincipal() actor: Principal,
    @Param('userId') userId: string,
    @Query('tenantId') tenantId?: string,
    @Query('days') days?: string,
  ) {
    return this.auditLogService.getUserActivity(userId, this.scope(actor, tenantId), days ? parseInt(days) : 7);
  }

  /**
   * Get audit history for specific entity
   */
  @Get('entity/:entityId/history')
  async getEntityHistory(
    @CurrentPrincipal() actor: Principal,
    @Param('entityId') entityId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.auditLogService.getEntityHistory(entityId, this.scope(actor, tenantId));
  }

  /**
   * Get archive statistics
   */
  @Get('stats/archive')
  async getArchiveStats(@CurrentPrincipal() actor: Principal) {
    return this.auditLogService.getArchiveStats(this.role(actor), actor.tenantId);
  }

  /**
   * Get activity statistics by action type
   */
  @Get('stats/activity')
  async getActivityStats(
    @CurrentPrincipal() actor: Principal,
    @Query('tenantId') tenantId?: string,
    @Query('days') days?: string,
  ) {
    return this.auditLogService.getActivityStats(this.scope(actor, tenantId), days ? parseInt(days) : 7);
  }
}
