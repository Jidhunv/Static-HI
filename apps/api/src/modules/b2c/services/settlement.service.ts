import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { EncryptionService } from '@shared/security/encryption.service';
import { AuditService } from '@shared/audit/audit.service';
import { Decimal } from '@prisma/client/runtime/library';

interface SettlementExecute {
  bookingId: string;
  guestPaid: Decimal;
  sellerTenantId: string;
  hotelTenantId: string;
  netRate: Decimal;
  nights: number;
  commissionPct: number;
}

@Injectable()
export class SettlementService {
  private logger = new Logger(SettlementService.name);

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private audit: AuditService,
  ) {}

  async executeTwo(data: SettlementExecute) {
    const { bookingId, guestPaid, sellerTenantId, hotelTenantId, netRate, nights, commissionPct } = data;

    const platformFee = guestPaid * 0.02;
    const gatewayFee = guestPaid * 0.03;
    const netAmount = guestPaid - platformFee - gatewayFee;
    const commission = netRate * nights * (commissionPct / 100);

    const [seller, inter] = await this.prisma.$transaction([
      this.prisma.settlement.create({
        data: {
          tenantId: sellerTenantId,
          settlementType: 'seller',
          totalAmount: netAmount,
          status: 'pending_seller',
          bookingReference: bookingId,
        },
      }),
      this.prisma.settlement.create({
        data: {
          tenantId: hotelTenantId,
          settlementType: 'inter_supplier',
          payerTenantId: sellerTenantId,
          payeeTenantId: hotelTenantId,
          totalAmount: commission,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: 'pending_inter_supplier',
          bookingReference: bookingId,
        },
      }),
    ]);

    await this.prisma.revenueTransaction.create({
      data: {
        bookingId,
        originSupplier: hotelTenantId,
        sellingSupplier: sellerTenantId,
        guestPaid: guestPaid.toNumber(),
        netToHotel: (netRate * nights).toNumber(),
        commissionToHotel: commission.toNumber(),
        platformFee: platformFee.toNumber(),
        paymentGatewayFee: gatewayFee.toNumber(),
        sellerSettlementId: seller.id,
        interSupplierSettlementId: inter.id,
      },
    });

    await this.audit.log({
      action: 'settlement.created',
      entityType: 'settlement',
      entityId: seller.id,
      userId: sellerTenantId,
      changes: { tier1: seller.id, tier2: inter.id },
    });

    return { seller: seller.id, inter: inter.id };
  }

  async processSeller(settleId: string, ref: string) {
    const settle = await this.prisma.settlement.findUniqueOrThrow({ where: { id: settleId } });

    if (settle.status !== 'pending_seller') throw new BadRequestException('Invalid status');

    const updated = await this.prisma.settlement.update({
      where: { id: settleId },
      data: { status: 'completed_seller', paymentReference: ref, paidDate: new Date() },
    });

    await this.audit.log({
      action: 'settlement.processed',
      entityType: 'settlement',
      entityId: settleId,
      userId: settle.tenantId,
      changes: { status: 'completed_seller', ref },
    });

    return updated;
  }

  async payInter(settleId: string, distributorId: string, ref: string) {
    const settle = await this.prisma.settlement.findUniqueOrThrow({ where: { id: settleId } });

    if (settle.payerTenantId !== distributorId || settle.status !== 'pending_inter_supplier') {
      throw new BadRequestException('Unauthorized or invalid status');
    }

    const updated = await this.prisma.settlement.update({
      where: { id: settleId },
      data: { status: 'completed_inter_supplier', paymentReference: ref, paidDate: new Date() },
    });

    await this.audit.log({
      action: 'settlement.paid',
      entityType: 'settlement',
      entityId: settleId,
      userId: distributorId,
      changes: { status: 'completed_inter_supplier' },
    });

    return updated;
  }

  async getOwed(tenantId: string) {
    return this.prisma.settlement.findMany({
      where: {
        payeeTenantId: tenantId,
        settlementType: 'inter_supplier',
        status: { in: ['pending_inter_supplier', 'overdue'] },
      },
      select: { id: true, totalAmount: true, dueDate: true, status: true, payerTenantId: true },
    });
  }

  async dashboard(tenantId: string) {
    const [received, owed] = await Promise.all([
      this.prisma.settlement.aggregate({
        where: { tenantId, settlementType: 'seller', status: 'completed_seller' },
        _sum: { totalAmount: true },
      }),
      this.prisma.settlement.aggregate({
        where: { payerTenantId: tenantId, settlementType: 'inter_supplier', status: 'completed_inter_supplier' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      received: received._sum.totalAmount?.toNumber() ?? 0,
      paid: owed._sum.totalAmount?.toNumber() ?? 0,
      net: (received._sum.totalAmount?.toNumber() ?? 0) - (owed._sum.totalAmount?.toNumber() ?? 0),
    };
  }
}
