import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

/**
 * Two-Tier Settlement Chain Model:
 *
 * Guest Pays ($875)
 *    ↓
 * Platform Collects
 *    ├─ Platform Fee (2%): $17.50
 *    └─ Gateway Fee (3%): $26.25
 *    ↓
 * Distributor B Receives → Settlement #1
 *    ├─ Net Amount: $831.25
 *    ├─ Commission Owed to Hotel A: $112.50
 *    └─ Distributor Keeps: $718.75
 *    ↓
 * Distributor B Settles with Hotel A → Settlement #2
 *    └─ Hotel A Receives: $112.50 (commission from distributor)
 */

export interface SettlementChainFlow {
  booking_id: string;
  guest_paid: number;

  // Tier 1: Guest → Distributor through Platform
  seller_settlement: {
    settlementId: string;
    sellerTenantId: string; // Distributor
    grossAmount: number;
    platformFee: number;
    gatewayFee: number;
    netAmount: number;
    status: string;
    paymentDate?: Date;
  };

  // Tier 2: Distributor → Inventory Owner
  inter_supplier_settlement: {
    settlementId: string;
    payerTenantId: string; // Distributor
    payeeTenantId: string; // Hotel Owner
    commissionAmount: number;
    status: string;
    dueDate: Date;
    paidDate?: Date;
  };
}

@Injectable()
export class SettlementChainService {
  constructor(private prisma: PrismaService) {}

  /**
   * Execute two-tier settlement after booking confirmation
   *
   * Flow:
   * 1. Seller (Distributor) settlement from platform
   * 2. Inter-supplier settlement (Distributor pays Hotel owner)
   */
  async executeSettlementChain(
    bookingId: string,
    data: {
      guestPaid: number;
      sellerTenantId: string; // Distributor B
      inventoryOwnerTenantId: string; // Hotel A
      netRate: number;
      nights: number;
      commissionPct: number;
      platformFeePct: number;
      gatewayFeePct: number;
    },
  ): Promise<SettlementChainFlow> {
    // Calculate amounts
    const platformFee = data.guestPaid * (data.platformFeePct / 100);
    const gatewayFee = data.guestPaid * (data.gatewayFeePct / 100);
    const netAmount = data.guestPaid - platformFee - gatewayFee;
    const totalNetRate = data.netRate * data.nights;
    const commissionToOwner = totalNetRate * (data.commissionPct / 100);

    // Tier 1: Seller Settlement (Platform → Distributor)
    const sellerSettlement = await this.prisma.settlement.create({
      data: {
        supplierId: data.sellerTenantId,
        settlementPeriod: new Date().toISOString().slice(0, 7),
        settlementDate: new Date(),
        totalAmount: netAmount,
        status: 'pending_seller',
        settlementType: 'seller', // Payment from platform to distributor
        bookingReference: bookingId,
      },
    });

    // Tier 2: Inter-Supplier Settlement (Distributor → Hotel Owner)
    // Due date is 15 days after booking for distributor to pay hotel
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const interSupplierSettlement = await this.prisma.settlement.create({
      data: {
        supplierId: data.inventoryOwnerTenantId,
        payerTenantId: data.sellerTenantId, // Distributor
        payeeTenantId: data.inventoryOwnerTenantId, // Hotel
        settlementPeriod: new Date().toISOString().slice(0, 7),
        settlementDate: new Date(),
        totalAmount: commissionToOwner,
        status: 'pending_inter_supplier',
        settlementType: 'inter_supplier', // Payment from distributor to hotel owner
        dueDate,
        bookingReference: bookingId,
      },
    });

    // Create revenue transaction tracking
    await this.prisma.revenueTransaction.create({
      data: {
        bookingId,
        originSupplier: data.inventoryOwnerTenantId,
        sellingSupplier: data.sellerTenantId,
        transactionType: 'booking',
        guestPaid: data.guestPaid,
        netToHotel: totalNetRate,
        markupAmount: netAmount - totalNetRate,
        commissionToHotel: commissionToOwner,
        platformFee,
        paymentGatewayFee: gatewayFee,
        status: 'pending',
        sellerSettlementId: sellerSettlement.id,
        interSupplierSettlementId: interSupplierSettlement.id,
      },
    });

    return {
      booking_id: bookingId,
      guest_paid: data.guestPaid,
      seller_settlement: {
        settlementId: sellerSettlement.id,
        sellerTenantId: data.sellerTenantId,
        grossAmount: data.guestPaid,
        platformFee,
        gatewayFee,
        netAmount,
        status: 'pending_seller',
      },
      inter_supplier_settlement: {
        settlementId: interSupplierSettlement.id,
        payerTenantId: data.sellerTenantId,
        payeeTenantId: data.inventoryOwnerTenantId,
        commissionAmount: commissionToOwner,
        status: 'pending_inter_supplier',
        dueDate,
      },
    };
  }

  /**
   * Process seller settlement (Platform → Distributor payment)
   */
  async processSellerSettlement(settlementId: string, bankDetails: any) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new BadRequestException('Settlement not found');
    }

    if (settlement.status !== 'pending_seller') {
      throw new BadRequestException('Settlement is not pending seller payment');
    }

    const paymentReference = `PAY-SELLER-${settlement.supplierId}-${Date.now()}`;

    return await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'completed_seller',
        paymentReference,
        paidDate: new Date(),
      },
    });
  }

  /**
   * Get seller settlements (Distributor side)
   * Distributor views payments received from platform
   */
  async getSellerSettlements(distributorTenantId: string, limit = 20) {
    return await this.prisma.settlement.findMany({
      where: {
        supplierId: distributorTenantId,
        settlementType: 'seller',
      },
      orderBy: { settlementDate: 'desc' },
      take: limit,
    });
  }

  /**
   * Get inter-supplier settlements (Hotel owner side)
   * Hotel views commission payments owed from distributors
   */
  async getInterSupplierSettlementsAsPayee(hotelTenantId: string, limit = 20) {
    return await this.prisma.settlement.findMany({
      where: {
        payeeTenantId: hotelTenantId,
        settlementType: 'inter_supplier',
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });
  }

  /**
   * Get inter-supplier settlements (Distributor side)
   * Distributor views commissions owed to hotel owners
   */
  async getInterSupplierSettlementsAsPayer(distributorTenantId: string, limit = 20) {
    return await this.prisma.settlement.findMany({
      where: {
        payerTenantId: distributorTenantId,
        settlementType: 'inter_supplier',
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });
  }

  /**
   * Record inter-supplier settlement payment (Distributor pays Hotel)
   */
  async recordInterSupplierPayment(
    settlementId: string,
    distributorTenantId: string,
    paymentReference: string,
  ) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new BadRequestException('Settlement not found');
    }

    if (settlement.payerTenantId !== distributorTenantId) {
      throw new BadRequestException('Only the payer can settle this');
    }

    if (settlement.status !== 'pending_inter_supplier') {
      throw new BadRequestException('Settlement is not pending payment');
    }

    return await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'completed_inter_supplier',
        paymentReference,
        paidDate: new Date(),
      },
    });
  }

  /**
   * Get settlement chain summary for booking
   */
  async getSettlementChainSummary(bookingId: string) {
    const transaction = await this.prisma.revenueTransaction.findFirst({
      where: { bookingId },
    });

    if (!transaction) {
      throw new BadRequestException('Booking not found');
    }

    const sellerSettlement = transaction.sellerSettlementId
      ? await this.prisma.settlement.findUnique({
          where: { id: transaction.sellerSettlementId },
        })
      : null;

    const interSupplierSettlement = transaction.interSupplierSettlementId
      ? await this.prisma.settlement.findUnique({
          where: { id: transaction.interSupplierSettlementId },
        })
      : null;

    return {
      booking_id: bookingId,
      guest_paid: transaction.guestPaid,
      tier_1_seller_settlement: {
        settlement_id: sellerSettlement?.id,
        status: sellerSettlement?.status,
        amount: sellerSettlement?.totalAmount,
        platform_fee: transaction.platformFee,
        gateway_fee: transaction.paymentGatewayFee,
        paid_date: sellerSettlement?.paidDate,
      },
      tier_2_inter_supplier_settlement: {
        settlement_id: interSupplierSettlement?.id,
        status: interSupplierSettlement?.status,
        commission_amount: interSupplierSettlement?.totalAmount,
        due_date: interSupplierSettlement?.dueDate,
        paid_date: interSupplierSettlement?.paidDate,
      },
    };
  }

  /**
   * Dashboard: Distributor view
   * Shows seller settlements received + inter-supplier payments owed
   */
  async getDistributorSettlementDashboard(distributorTenantId: string) {
    const sellerSettlements = await this.prisma.settlement.findMany({
      where: {
        supplierId: distributorTenantId,
        settlementType: 'seller',
      },
    });

    const interSupplierPaymentsOwed = await this.prisma.settlement.findMany({
      where: {
        payerTenantId: distributorTenantId,
        settlementType: 'inter_supplier',
        status: { in: ['pending_inter_supplier', 'overdue'] },
      },
    });

    const totalReceived = sellerSettlements
      .filter((s) => s.status === 'completed_seller')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const totalPending = sellerSettlements
      .filter((s) => s.status === 'pending_seller')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const totalOwed = interSupplierPaymentsOwed.reduce((sum, s) => sum + s.totalAmount, 0);

    return {
      seller_settlements: {
        total_received: totalReceived,
        total_pending: totalPending,
        completed_count: sellerSettlements.filter((s) => s.status === 'completed_seller').length,
        pending_count: sellerSettlements.filter((s) => s.status === 'pending_seller').length,
      },
      inter_supplier_obligations: {
        total_owed: totalOwed,
        outstanding_payments: interSupplierPaymentsOwed.length,
        overdue_count: interSupplierPaymentsOwed.filter((s) => {
          const today = new Date();
          return s.dueDate && new Date(s.dueDate) < today;
        }).length,
      },
      net_position: totalReceived - totalOwed,
    };
  }

  /**
   * Dashboard: Hotel (Inventory Owner) view
   * Shows commissions owed by distributors
   */
  async getHotelSettlementDashboard(hotelTenantId: string) {
    const commissionsOwed = await this.prisma.settlement.findMany({
      where: {
        payeeTenantId: hotelTenantId,
        settlementType: 'inter_supplier',
        status: { in: ['pending_inter_supplier', 'overdue'] },
      },
    });

    const commissionsPaid = await this.prisma.settlement.findMany({
      where: {
        payeeTenantId: hotelTenantId,
        settlementType: 'inter_supplier',
        status: 'completed_inter_supplier',
      },
    });

    const totalOwed = commissionsOwed.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalReceived = commissionsPaid.reduce((sum, s) => sum + s.totalAmount, 0);

    const byDistributor = await this.prisma.settlement.groupBy({
      by: ['payerTenantId'],
      where: {
        payeeTenantId: hotelTenantId,
        settlementType: 'inter_supplier',
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    return {
      commissions_owed: {
        total_amount: totalOwed,
        outstanding_count: commissionsOwed.length,
        overdue_count: commissionsOwed.filter((s) => {
          const today = new Date();
          return s.dueDate && new Date(s.dueDate) < today;
        }).length,
      },
      commissions_received: {
        total_amount: totalReceived,
        paid_count: commissionsPaid.length,
      },
      by_distributor: byDistributor,
    };
  }

  /**
   * Escalate overdue inter-supplier settlements
   */
  async markOverdueSettlements() {
    const today = new Date();
    return await this.prisma.settlement.updateMany({
      where: {
        settlementType: 'inter_supplier',
        dueDate: { lt: today },
        status: 'pending_inter_supplier',
      },
      data: {
        status: 'overdue',
      },
    });
  }

  /**
   * Generate monthly settlement report for distributor
   */
  async generateDistributorMonthlyReport(distributorTenantId: string, month: string) {
    const [year, monthNum] = month.split('-');
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);

    const sellerSettlements = await this.prisma.settlement.findMany({
      where: {
        supplierId: distributorTenantId,
        settlementType: 'seller',
        settlementDate: { gte: startDate, lte: endDate },
      },
    });

    const interSupplierSettlements = await this.prisma.settlement.findMany({
      where: {
        payerTenantId: distributorTenantId,
        settlementType: 'inter_supplier',
        settlementDate: { gte: startDate, lte: endDate },
      },
    });

    const totalReceived = sellerSettlements.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalObligation = interSupplierSettlements.reduce((sum, s) => sum + s.totalAmount, 0);

    return {
      period: month,
      seller_settlements: {
        count: sellerSettlements.length,
        total_received: totalReceived,
        completed_count: sellerSettlements.filter((s) => s.status === 'completed_seller')
          .length,
      },
      inter_supplier_settlements: {
        count: interSupplierSettlements.length,
        total_obligation: totalObligation,
        paid_count: interSupplierSettlements.filter((s) => s.status === 'completed_inter_supplier')
          .length,
      },
      net_cash_position: totalReceived - totalObligation,
    };
  }
}
