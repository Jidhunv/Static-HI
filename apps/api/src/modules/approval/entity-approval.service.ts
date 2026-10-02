import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * Generic Entity Approval Service
 * Reusable approval flow for Tenant and B2B Agent confirmations
 * Status: pending → confirmed → suspended
 */
@Injectable()
export class EntityApprovalService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create approval record for new entity (Tenant or B2B Agent)
   * Starts with status = pending (requires super admin confirmation)
   */
  async createApproval(entityType: 'Tenant' | 'B2BAgent', entityId: string) {
    return this.prisma.entityApproval.create({
      data: {
        entityType,
        entityId,
        status: 'pending',
      },
    });
  }

  /**
   * Get approval status for entity
   */
  async getApproval(entityType: string, entityId: string) {
    const approval = await this.prisma.entityApproval.findUnique({
      where: {
        entityType_entityId: { entityType, entityId },
      },
    });

    if (!approval) {
      throw new NotFoundException(
        `Approval record not found for ${entityType}:${entityId}`
      );
    }

    return approval;
  }

  /**
   * Confirm entity (super admin confirms Tenant, or Tenant confirms B2B Agent)
   * Changes status from pending → confirmed
   */
  async approveEntity(
    entityType: string,
    entityId: string,
    user: { id: string; email: string; name: string },
    notes?: string
  ) {
    const approval = await this.getApproval(entityType, entityId);

    if (approval.status === 'confirmed') {
      throw new BadRequestException(`Entity already confirmed`);
    }

    return this.prisma.entityApproval.update({
      where: {
        entityType_entityId: { entityType, entityId },
      },
      data: {
        status: 'confirmed',
        approverUserId: user.id,
        approverEmail: user.email,
        approverName: user.name,
        approvalNotes: notes,
        actionTakenAt: new Date(),
      },
    });
  }

  /**
   * Reject entity (admin rejects Tenant or Agent onboarding)
   * Changes status from pending → suspended
   */
  async rejectEntity(
    entityType: string,
    entityId: string,
    user: { id: string; email: string; name: string },
    reason: string
  ) {
    const approval = await this.getApproval(entityType, entityId);

    if (approval.status === 'confirmed') {
      throw new BadRequestException(`Cannot reject already confirmed entity`);
    }

    return this.prisma.entityApproval.update({
      where: {
        entityType_entityId: { entityType, entityId },
      },
      data: {
        status: 'suspended',
        approverUserId: user.id,
        approverEmail: user.email,
        approverName: user.name,
        approvalNotes: reason,
        actionTakenAt: new Date(),
      },
    });
  }

  /**
   * Suspend entity (admin suspends confirmed entity)
   */
  async suspendEntity(
    entityType: string,
    entityId: string,
    user: { id: string; email: string; name: string },
    reason: string
  ) {
    return this.prisma.entityApproval.update({
      where: {
        entityType_entityId: { entityType, entityId },
      },
      data: {
        status: 'suspended',
        approverUserId: user.id,
        approverEmail: user.email,
        approverName: user.name,
        approvalNotes: reason,
        actionTakenAt: new Date(),
      },
    });
  }

  /**
   * Reactivate suspended entity
   */
  async reactivateEntity(
    entityType: string,
    entityId: string,
    user: { id: string; email: string; name: string }
  ) {
    const approval = await this.getApproval(entityType, entityId);

    if (approval.status !== 'suspended') {
      throw new BadRequestException(`Entity is not suspended`);
    }

    return this.prisma.entityApproval.update({
      where: {
        entityType_entityId: { entityType, entityId },
      },
      data: {
        status: 'confirmed',
        approverUserId: user.id,
        approverEmail: user.email,
        approverName: user.name,
        actionTakenAt: new Date(),
      },
    });
  }

  /**
   * Check if entity is confirmed
   * Used in API guards/middleware
   */
  async isConfirmed(entityType: string, entityId: string): Promise<boolean> {
    const approval = await this.prisma.entityApproval.findUnique({
      where: {
        entityType_entityId: { entityType, entityId },
      },
    });

    return approval?.status === 'confirmed';
  }

  /**
   * List pending approvals (for super admin or tenant approval queues)
   */
  async listPending(entityType: string, skip = 0, take = 50, entityIds?: string[]) {
    return this.prisma.entityApproval.findMany({
      where: {
        entityType,
        status: 'pending',
        ...(entityIds && { entityId: { in: entityIds } }),
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });
  }

  /**
   * Get approval history
   */
  async getHistory(entityType: string, entityId: string) {
    return this.prisma.entityApproval.findUnique({
      where: {
        entityType_entityId: { entityType, entityId },
      },
    });
  }
}
