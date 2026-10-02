import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface CommissionCalculation {
  guestPaid: number;
  netToHotel: number;
  markupAmount: number;
  commissionToHotel: number;
  distributorProfit: number;
  platformFee: number;
  paymentGatewayFee: number;
  taxAmount: number;
  distribution: {
    hotelReceives: number;
    distributorReceives: number;
    platformReceives: number;
    taxesHeld: number;
  };
}

@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate complete revenue split for a booking
   */
  calculateRevenueSplit(
    guestPaid: number,
    netRate: number,
    nights: number,
    commissionPct: number,
    markupPct: number = 0,
    platformFeePct: number = 2,
    gatewayFeePct: number = 3,
    taxPct: number = 10,
  ): CommissionCalculation {
    // Base amounts
    const totalNetAmount = netRate * nights;
    const markupAmount = totalNetAmount * (markupPct / 100);

    // Platform and gateway fees
    const platformFee = guestPaid * (platformFeePct / 100);
    const paymentGatewayFee = guestPaid * (gatewayFeePct / 100);

    // Tax (on the net amount)
    const taxAmount = totalNetAmount * (taxPct / 100);

    // Commission to hotel (% of net rate)
    const commissionToHotel = totalNetAmount * (commissionPct / 100);

    // Distributor profit
    const distributorProfit = markupAmount - commissionToHotel;

    // Distribution
    const availableAmount = guestPaid - platformFee - paymentGatewayFee;
    const hotelReceives = totalNetAmount - platformFee * (totalNetAmount / guestPaid);
    const distributorReceives = distributorProfit;
    const platformReceives = platformFee + paymentGatewayFee;

    return {
      guestPaid,
      netToHotel: totalNetAmount,
      markupAmount,
      commissionToHotel,
      distributorProfit,
      platformFee,
      paymentGatewayFee,
      taxAmount,
      distribution: {
        hotelReceives: Math.round(hotelReceives * 100) / 100,
        distributorReceives: Math.round(distributorReceives * 100) / 100,
        platformReceives: Math.round(platformReceives * 100) / 100,
        taxesHeld: Math.round(taxAmount * 100) / 100,
      },
    };
  }

  /**
   * Record revenue transaction after booking
   */
  async recordRevenueTransaction(
    bookingId: string,
    inventoryVisibilityId: string,
    originSupplier: string,
    sellingSupplier: string,
    commissionData: CommissionCalculation,
  ) {
    return await this.prisma.revenueTransaction.create({
      data: {
        bookingId,
        inventoryVisibilityId,
        originSupplier,
        sellingSupplier,
        transactionType: 'booking',
        guestPaid: commissionData.guestPaid,
        netToHotel: commissionData.netToHotel,
        markupAmount: commissionData.markupAmount,
        commissionToHotel: commissionData.commissionToHotel,
        platformFee: commissionData.platformFee,
        paymentGatewayFee: commissionData.paymentGatewayFee,
        taxAmount: commissionData.taxAmount,
        status: 'pending',
      },
    });
  }

  /**
   * Get commission summary for a supplier
   */
  async getCommissionSummary(
    supplierTenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const transactions = await this.prisma.revenueTransaction.findMany({
      where: {
        originSupplier: supplierTenantId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['pending', 'settled'],
        },
      },
    });

    const summary = {
      totalBookings: transactions.length,
      totalCommission: transactions.reduce((sum, t) => sum + t.commissionToHotel, 0),
      totalNetRevenue: transactions.reduce((sum, t) => sum + t.netToHotel, 0),
      averageCommission: 0,
      pendingSettlement: transactions
        .filter((t) => t.status === 'pending')
        .reduce((sum, t) => sum + t.commissionToHotel, 0),
      settled: transactions
        .filter((t) => t.status === 'settled')
        .reduce((sum, t) => sum + t.commissionToHotel, 0),
    };

    summary.averageCommission =
      summary.totalBookings > 0 ? summary.totalCommission / summary.totalBookings : 0;

    return summary;
  }

  /**
   * Get commission for distributor
   */
  async getDistributorCommissionSummary(
    distributorTenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const transactions = await this.prisma.revenueTransaction.findMany({
      where: {
        sellingSupplier: distributorTenantId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['pending', 'settled'],
        },
      },
    });

    const summary = {
      totalBookings: transactions.length,
      totalMarkup: transactions.reduce((sum, t) => sum + t.markupAmount, 0),
      totalCommissionPaid: transactions.reduce((sum, t) => sum + t.commissionToHotel, 0),
      totalProfit: 0,
      platformFeesPaid: transactions.reduce((sum, t) => sum + t.platformFee, 0),
      netProfit: 0,
    };

    summary.totalProfit = summary.totalMarkup - summary.totalCommissionPaid;
    summary.netProfit = summary.totalProfit - summary.platformFeesPaid;

    return summary;
  }

  /**
   * Apply volume discounts to commission rate
   */
  applyVolumeDiscount(
    baseCommissionPct: number,
    bookingCount: number,
    volumeDiscounts: Array<{ min_bookings: number; commission_reduction: number }>,
  ): number {
    let finalCommission = baseCommissionPct;

    for (const discount of volumeDiscounts.sort((a, b) => b.min_bookings - a.min_bookings)) {
      if (bookingCount >= discount.min_bookings) {
        finalCommission = Math.max(0, baseCommissionPct - discount.commission_reduction);
        break;
      }
    }

    return finalCommission;
  }

  /**
   * Validate commission structure is profitable for distributor
   */
  validateProfitability(
    netRate: number,
    markupPct: number,
    commissionPct: number,
    minProfitMarginPct: number = 10,
  ): {
    isProfitable: boolean;
    actualMarginPct: number;
  } {
    const markupAmount = netRate * (markupPct / 100);
    const commissionCost = netRate * (commissionPct / 100);
    const netProfit = markupAmount - commissionCost;
    const profitMarginPct = (netProfit / netRate) * 100;

    return {
      isProfitable: profitMarginPct >= minProfitMarginPct,
      actualMarginPct: profitMarginPct,
    };
  }
}

  /**
   * Settle pending transactions to create invoices
   */
  async settleTransactions(
    supplierTenantId: string,
    settlementPeriod: string, // YYYY-MM
  ) {
    // Get all pending transactions for period
    const [year, month] = settlementPeriod.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const transactions = await this.prisma.revenueTransaction.findMany({
      where: {
        originSupplier: supplierTenantId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'pending',
      },
    });

    if (transactions.length === 0) {
      return null;
    }

    // Calculate totals
    const totalAmount = transactions.reduce((sum, t) => sum + t.netToHotel, 0);
    const platformFee = transactions.reduce((sum, t) => sum + t.platformFee, 0);
    const gatewayFee = transactions.reduce((sum, t) => sum + t.paymentGatewayFee, 0);
    const netAmount = totalAmount - platformFee - gatewayFee;

    // Create invoice
    const invoice = await this.prisma.supplierInvoice.create({
      data: {
        supplierId: supplierTenantId,
        invoicePeriod: settlementPeriod,
        invoiceNumber: `INV-${supplierTenantId}-${settlementPeriod}`,
        invoiceDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        totalBookings: transactions.length,
        grossAmount: totalAmount,
        platformFee,
        paymentGatewayFee: gatewayFee,
        netAmount,
        status: 'draft',
        lineItems: transactions.map((t) => ({
          booking_id: t.bookingId,
          amount: t.netToHotel,
          type: 'commission',
        })),
      },
    });

    // Mark transactions as settled
    await this.prisma.revenueTransaction.updateMany({
      where: {
        id: { in: transactions.map((t) => t.id) },
      },
      data: {
        status: 'settled',
        settlementDate: new Date(),
      },
    });

    return invoice;
  }
}
