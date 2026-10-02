import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Principal } from '../../../shared/security/principal';
import { AuditLogService } from '../../audit/audit-log.service';
import { CreateSettlementDto } from '../dto/settlement.dto';
import { splitBooking } from './settlement.math';

const INTER_SUPPLIER_DUE_DAYS = 15;
const OPEN = ['pending', 'overdue'];

@Injectable()
export class SettlementService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
  ) {}

  /** Creates both settlements for a booking: platform → seller, and seller → inventory owner. */
  async create(dto: CreateSettlementDto, actor: Principal) {
    this.requireAdmin(actor);
    if (dto.sellerTenantId === dto.ownerTenantId) {
      throw new BadRequestException('Seller and owner must be different tenants');
    }

    const [booking, tenants] = await Promise.all([
      this.prisma.booking.findUnique({ where: { id: dto.bookingId }, select: { totalAmount: true, currency: true } }),
      this.prisma.tenant.count({ where: { id: { in: [dto.sellerTenantId, dto.ownerTenantId] } } }),
    ]);
    if (!booking) throw new NotFoundException('Booking not found');
    if (tenants !== 2) throw new NotFoundException('Seller or owner tenant not found');

    const split = splitBooking(booking.totalAmount, dto.ownerNetAmount, dto.commissionPct);
    if (split.ownerAmount > split.sellerAmount) {
      throw new BadRequestException('Amount owed to the owner exceeds what the seller receives for this booking');
    }

    const common = { bookingId: dto.bookingId, currency: booking.currency };
    const dueDate = new Date(Date.now() + INTER_SUPPLIER_DUE_DAYS * 86_400_000);

    try {
      const [seller, interSupplier] = await this.prisma.$transaction([
        this.prisma.supplierSettlement.create({
          data: { ...common, settlementType: 'seller', tenantId: dto.sellerTenantId, amount: split.sellerAmount },
        }),
        this.prisma.supplierSettlement.create({
          data: {
            ...common,
            settlementType: 'inter_supplier',
            tenantId: dto.ownerTenantId,
            payerTenantId: dto.sellerTenantId,
            amount: split.ownerAmount,
            dueDate,
          },
        }),
        this.prisma.revenueTransaction.create({
          data: {
            bookingId: dto.bookingId,
            inventoryVisibilityId: dto.inventoryVisibilityId,
            originSupplier: dto.ownerTenantId,
            sellingSupplier: dto.sellerTenantId,
            guestPaid: booking.totalAmount,
            netToHotel: dto.ownerNetAmount,
            markupAmount: split.markup,
            commissionToHotel: split.commission,
            platformFee: split.platformFee,
            paymentGatewayFee: split.gatewayFee,
            taxAmount: 0,
          },
        }),
      ]);
      await this.log(actor, 'create', seller.id, { seller, interSupplier });
      return { seller, interSupplier };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Settlements already exist for this booking');
      }
      throw e;
    }
  }

  /** Platform records that it has paid the seller. */
  async markSellerPaid(id: string, paymentReference: string, actor: Principal) {
    this.requireAdmin(actor);
    return this.markPaid({ id, settlementType: 'seller', status: 'pending' }, paymentReference, actor);
  }

  /** Seller records that it has paid the inventory owner; closes the revenue transaction. */
  async markInterSupplierPaid(id: string, paymentReference: string, actor: Principal) {
    const payerTenantId = this.requireTenant(actor);
    const settlement = await this.markPaid(
      { id, settlementType: 'inter_supplier', payerTenantId, status: { in: OPEN } },
      paymentReference,
      actor,
    );
    await this.prisma.revenueTransaction.updateMany({
      where: { bookingId: settlement.bookingId, status: 'pending' },
      data: { status: 'settled', settlementDate: settlement.paidDate },
    });
    return settlement;
  }

  /** Money other suppliers still owe this tenant. */
  receivable(actor: Principal) {
    return this.prisma.supplierSettlement.findMany({
      where: { tenantId: this.requireTenant(actor), settlementType: 'inter_supplier', status: { in: OPEN } },
      orderBy: { dueDate: 'asc' },
    });
  }

  /** Money this tenant still owes inventory owners. */
  payable(actor: Principal) {
    return this.prisma.supplierSettlement.findMany({
      where: { payerTenantId: this.requireTenant(actor), status: { in: OPEN } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async summary(actor: Principal) {
    const tenantId = this.requireTenant(actor);
    const sum = async (where: Prisma.SupplierSettlementWhereInput) =>
      (await this.prisma.supplierSettlement.aggregate({ where, _sum: { amount: true } }))._sum.amount ?? 0;

    const [received, paidOut, receivable, payable] = await Promise.all([
      sum({ tenantId, status: 'paid' }),
      sum({ payerTenantId: tenantId, status: 'paid' }),
      sum({ tenantId, status: { in: OPEN } }),
      sum({ payerTenantId: tenantId, status: { in: OPEN } }),
    ]);
    return { received, paidOut, receivable, payable };
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  markOverdue() {
    return this.prisma.supplierSettlement.updateMany({
      where: { settlementType: 'inter_supplier', status: 'pending', dueDate: { lt: new Date() } },
      data: { status: 'overdue' },
    });
  }

  /** The status filter makes this atomic: a settlement can only be marked paid once. */
  private async markPaid(where: Prisma.SupplierSettlementWhereInput, paymentReference: string, actor: Principal) {
    const { count } = await this.prisma.supplierSettlement.updateMany({
      where,
      data: { status: 'paid', paymentReference, paidDate: new Date() },
    });
    if (count === 0) throw new NotFoundException('No open settlement with that id for this account');

    const settlement = await this.prisma.supplierSettlement.findUniqueOrThrow({ where: { id: where.id as string } });
    await this.log(actor, 'update', settlement.id, { status: 'paid', paymentReference });
    return settlement;
  }

  private requireAdmin(actor: Principal) {
    if (!actor.isPlatformAdmin) throw new ForbiddenException('Platform admin only');
  }

  private requireTenant(actor: Principal): string {
    if (!actor.tenantId) throw new ForbiddenException('Tenant user only');
    return actor.tenantId;
  }

  private log(actor: Principal, action: string, entityId: string, changes: unknown) {
    return this.audit.log({
      tenantId: actor.tenantId,
      userId: actor.id,
      userEmail: actor.email,
      userName: actor.name,
      action,
      entity: 'SupplierSettlement',
      entityId,
      changes,
    });
  }
}
