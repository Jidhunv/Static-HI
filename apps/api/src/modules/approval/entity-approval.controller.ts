import { Controller, Get, Put, Param, Body, Query, ForbiddenException } from '@nestjs/common';
import { EntityApprovalService } from './entity-approval.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CurrentPrincipal, Principal } from '../../shared/security/principal';

const AGENT = 'B2BAgent';

/**
 * Platform admins decide on any entity (tenants and agents). Tenant users decide only on their own
 * tenant's B2B agents. The approver recorded is always the signed-in user.
 */
@Controller('approvals')
export class EntityApprovalController {
  constructor(
    private service: EntityApprovalService,
    private prisma: PrismaService,
  ) {}

  private async authorize(actor: Principal, entityType: string, entityId: string) {
    if (actor.isPlatformAdmin) return;
    const agent =
      entityType === AGENT
        ? await this.prisma.b2BAgent.findUnique({ where: { id: entityId }, select: { tenantId: true } })
        : null;
    if (!agent || agent.tenantId !== actor.tenantId) {
      throw new ForbiddenException('You cannot act on this approval');
    }
  }

  /**
   * List pending approvals: the full queue for platform admins, a tenant's own agents otherwise
   */
  @Get('pending/:entityType')
  async listPending(
    @CurrentPrincipal() actor: Principal,
    @Param('entityType') entityType: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    let entityIds: string[] | undefined;
    if (!actor.isPlatformAdmin) {
      if (entityType !== AGENT) throw new ForbiddenException('Platform admin only');
      const agents = await this.prisma.b2BAgent.findMany({ where: { tenantId: actor.tenantId }, select: { id: true } });
      entityIds = agents.map((agent) => agent.id);
    }
    return this.service.listPending(entityType, skip ? parseInt(skip) : 0, take ? parseInt(take) : 50, entityIds);
  }

  /**
   * Get approval status
   */
  @Get(':entityType/:entityId')
  async getApproval(
    @CurrentPrincipal() actor: Principal,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string
  ) {
    await this.authorize(actor, entityType, entityId);
    return this.service.getApproval(entityType, entityId);
  }

  /**
   * Approve entity (Super Admin confirms Tenant or Tenant confirms Agent)
   */
  @Put(':entityType/:entityId/approve')
  async approve(
    @CurrentPrincipal() actor: Principal,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: { notes?: string }
  ) {
    await this.authorize(actor, entityType, entityId);
    return this.service.approveEntity(entityType, entityId, actor, body.notes);
  }

  /**
   * Reject entity (admin rejects Tenant or Agent onboarding)
   */
  @Put(':entityType/:entityId/reject')
  async reject(
    @CurrentPrincipal() actor: Principal,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: { reason: string }
  ) {
    await this.authorize(actor, entityType, entityId);
    return this.service.rejectEntity(entityType, entityId, actor, body.reason);
  }

  /**
   * Suspend entity
   */
  @Put(':entityType/:entityId/suspend')
  async suspend(
    @CurrentPrincipal() actor: Principal,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: { reason: string }
  ) {
    await this.authorize(actor, entityType, entityId);
    return this.service.suspendEntity(entityType, entityId, actor, body.reason);
  }

  /**
   * Reactivate suspended entity
   */
  @Put(':entityType/:entityId/reactivate')
  async reactivate(
    @CurrentPrincipal() actor: Principal,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string
  ) {
    await this.authorize(actor, entityType, entityId);
    return this.service.reactivateEntity(entityType, entityId, actor);
  }

  /**
   * Check if entity is confirmed
   */
  @Get(':entityType/:entityId/status')
  async getStatus(
    @CurrentPrincipal() actor: Principal,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string
  ) {
    await this.authorize(actor, entityType, entityId);
    const isConfirmed = await this.service.isConfirmed(entityType, entityId);
    return { confirmed: isConfirmed };
  }
}
