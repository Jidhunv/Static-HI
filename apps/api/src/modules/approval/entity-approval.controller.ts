import { Controller, Post, Get, Put, Param, Body, Query } from '@nestjs/common';
import { EntityApprovalService } from './entity-approval.service';

@Controller('approvals')
export class EntityApprovalController {
  constructor(private service: EntityApprovalService) {}

  /**
   * List pending approvals for super admin (Tenant confirmation queue)
   */
  @Get('pending/:entityType')
  async listPending(
    @Param('entityType') entityType: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.service.listPending(
      entityType,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 50
    );
  }

  /**
   * Get approval status
   */
  @Get(':entityType/:entityId')
  async getApproval(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string
  ) {
    return this.service.getApproval(entityType, entityId);
  }

  /**
   * Approve entity (Super Admin confirms Tenant or Tenant confirms Agent)
   */
  @Put(':entityType/:entityId/approve')
  async approve(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: { notes?: string; userId: string; email: string; name: string }
  ) {
    return this.service.approveEntity(entityType, entityId, {
      id: body.userId,
      email: body.email,
      name: body.name,
    }, body.notes);
  }

  /**
   * Reject entity (admin rejects Tenant or Agent onboarding)
   */
  @Put(':entityType/:entityId/reject')
  async reject(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: { reason: string; userId: string; email: string; name: string }
  ) {
    return this.service.rejectEntity(
      entityType,
      entityId,
      {
        id: body.userId,
        email: body.email,
        name: body.name,
      },
      body.reason
    );
  }

  /**
   * Suspend entity
   */
  @Put(':entityType/:entityId/suspend')
  async suspend(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: { reason: string; userId: string; email: string; name: string }
  ) {
    return this.service.suspendEntity(
      entityType,
      entityId,
      {
        id: body.userId,
        email: body.email,
        name: body.name,
      },
      body.reason
    );
  }

  /**
   * Reactivate suspended entity
   */
  @Put(':entityType/:entityId/reactivate')
  async reactivate(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: { userId: string; email: string; name: string }
  ) {
    return this.service.reactivateEntity(entityType, entityId, {
      id: body.userId,
      email: body.email,
      name: body.name,
    });
  }

  /**
   * Check if entity is confirmed (used by guards/middleware)
   */
  @Get(':entityType/:entityId/status')
  async getStatus(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string
  ) {
    const isConfirmed = await this.service.isConfirmed(entityType, entityId);
    return { confirmed: isConfirmed };
  }
}
