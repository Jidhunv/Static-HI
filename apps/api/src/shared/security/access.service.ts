import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Principal } from './principal';

/** Ownership checks for routes that address a record by ID rather than by the caller's tenant. */
@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  /** Platform admins may act on any property; tenant users only on their own. */
  async assertProperty(actor: Principal, propertyId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId }, select: { tenantId: true } });
    if (!property || (!actor.isPlatformAdmin && property.tenantId !== actor.tenantId)) {
      throw new NotFoundException('Property not found');
    }
  }

  async assertRatePlan(actor: Principal, ratePlanId: string, propertyId?: string) {
    const ratePlan = await this.prisma.ratePlan.findUnique({ where: { id: ratePlanId }, select: { propertyId: true } });
    if (!ratePlan || (propertyId && ratePlan.propertyId !== propertyId)) {
      throw new NotFoundException('Rate plan not found');
    }
    await this.assertProperty(actor, ratePlan.propertyId);
  }
}
