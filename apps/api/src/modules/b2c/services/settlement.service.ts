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
const SYSTEM: Principal = { id: 'system', email: 'system', name: 'Booking flow', isPlatformAdmin: false };

export interface SettlementInput {
  bookingId: string;
  sellerTenantId: string;
  ownerTenantId: string;
  ownerNetAmount: number;
  commissionPct: number;
  guestPaid: number;
  taxAmount: number;
  currency: string;
  inventoryVisibilityId?: string | null;
}

@Injectable()
export class SettlementService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
  ) {}

  /** Manual creation by a platform admin, for bookings the booking flow did not settle itself. */
  async create(dto: CreateSettlementDto, actor: Principal) {
    this.requireAdmin(actor);
    if (dto.sellerTenantId === dto.ownerTenantId) {
      throw new BadRequestException('Seller and owner must be different tenants');
    }

    const [booking, tenants] = await Promise.all([
      this.prisma.booking.findUnique({
        where: { id: dto.bookingId },
        select: { totalAmount: true, subtotal: true, currency: true },
      }),
      this.prisma.tenant.count({ where: { id: { in: [dto.sellerTenantId, dto.ownerTenantId] } } }),
    ]);
    if (!booking) throw new NotFoundException('Booking not found');
    if (tenants !== 2) throw new NotFoundException('Seller or owner tenant not found');

    const input: SettlementInput = {
      ...dto,
      guestPaid: booking.totalAmount,
      taxAmount: booking.totalAmount - (booking.subtotal ?? booking.totalAmount),
      currency: booking.currency,
    };
    try {
      const result = await this.prisma.$transaction((tx) => this.createInTx(tx, input));
      await this.logCreated(result, actor);
      return result;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Settlements already exist for this booking');
      }
      throw e;
    }
  }

  /**
   * Creates both settlements (platform → seller, seller → inventory owner) and the revenue
   * transaction inside the caller's transaction, so they commit together with the payment.
   */
  async createInTx(tx: Prisma.TransactionClient, input: SettlementInput) {
    const split = splitBooking(input.guestPaid, input.ownerNetAmount, input.commissionPct);
    if (split.ownerAmount > split.sellerAmount) {
      throw new BadRequestException('Amount owed to the owner exceeds what the seller receives for this booking');
    }
    const common = { bookingId: input.bookingId, currency: input.currency };

    const seller = await tx.supplierSettlement.create({
      data: { ...common, settlementType: 'seller', tenantId: input.sellerTenantId, amount: split.sellerAmount },
    });
    const interSupplier = await tx.supplierSettlement.create({
      data: {
        ...common,
        settlementType: 'inter_supplier',
        tenantId: input.ownerTenantId,
        payerTenantId: input.sellerTenantId,
        amount: split.ownerAmount,
        dueDate: new Date(Date.now() + INTER_SUPPLIER_DUE_DAYS * 86_400_000),
      },
    });
    await tx.revenueTransaction.create({
      data: {
        bookingId: input.bookingId,
        inventoryVisibilityId: input.inventoryVisibilityId,
        originSupplier: input.ownerTenantId,
        sellingSupplier: input.sellerTenantId,
        guestPaid: input.guestPaid,
        netToHotel: input.ownerNetAmount,
        markupAmount: split.markup,
        commissionToHotel: split.commission,
        platformFee: split.platformFee,
        paymentGatewayFee: split.gatewayFee,
        taxAmount: input.taxAmount,
      },
    });
    return { seller, interSupplier };
  }

  logCreated(result: { seller: { id: string } }, actor: Principal = SYSTEM) {
    return this.log(actor, 'create', result.seller.id, result);
  }

  /**
   * Booking cancelled: void settlements that have not been paid. If money has already moved,
   * the revenue transaction is flagged as disputed for manual recovery.
   */
  async cancelForBooking(bookingId: string) {
    const settlements = await this.prisma.supplierSettlement.findMany({ where: { bookingId } });
    if (settlements.length === 0) return;

    const anyPaid = settlements.some((s) => s.status === 'paid');
    await this.prisma.$transaction([
      this.prisma.supplierSettlement.updateMany({
        where: { bookingId, status: { in: OPEN } },
        data: { status: 'cancelled' },
      }),
      this.prisma.revenueTransaction.updateMany({
        where: { bookingId },
        data: anyPaid
          ? { status: 'disputed', disputeReason: 'Booking cancelled after a settlement was paid; recover manually' }
          : { status: 'refunded' },
      }),
    ]);
    await this.log(SYSTEM, 'update', settlements[0].id, { bookingCancelled: true, anyPaid });
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
