import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

export interface BillingInvoice {
  invoiceId: string;
  supplierId: string;
  invoicePeriod: string;
  invoiceNumber: string;
  totalBookings: number;
  grossAmount: number;
  platformFee: number;
  paymentGatewayFee: number;
  netAmount: number;
  status: string;
}

export interface SettlementData {
  settlementId: string;
  supplierId: string;
  settlementPeriod: string;
  settlementDate: Date;
  totalAmount: number;
  status: string;
  paymentReference?: string;
}

@Injectable()
export class SupplierBillingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate monthly invoice for supplier
   */
  async generateMonthlyInvoice(supplierId: string, periodYearMonth: string) {
    const [year, month] = periodYearMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    // Get all settled transactions for period
    const transactions = await this.prisma.revenueTransaction.findMany({
      where: {
        originSupplier: supplierId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'settled',
      },
    });

    if (transactions.length === 0) {
      return null;
    }

    // Calculate totals
    const grossAmount = transactions.reduce((sum, t) => sum + t.netToHotel, 0);
    const platformFee = transactions.reduce((sum, t) => sum + t.platformFee, 0);
    const paymentGatewayFee = transactions.reduce((sum, t) => sum + t.paymentGatewayFee, 0);
    const netAmount = grossAmount - platformFee - paymentGatewayFee;

    // Check if invoice already exists
    const existingInvoice = await this.prisma.supplierInvoice.findUnique({
      where: {
        supplierId_invoicePeriod: {
          supplierId,
          invoicePeriod: periodYearMonth,
        },
      },
    });

    if (existingInvoice) {
      throw new BadRequestException(`Invoice already exists for period ${periodYearMonth}`);
    }

    // Create invoice
    const invoice = await this.prisma.supplierInvoice.create({
      data: {
        supplierId,
        invoicePeriod: periodYearMonth,
        invoiceNumber: `INV-${supplierId}-${periodYearMonth}`,
        invoiceDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        totalBookings: transactions.length,
        grossAmount,
        platformFee,
        paymentGatewayFee,
        netAmount,
        status: 'draft',
        lineItems: transactions.map((t) => ({
          booking_id: t.bookingId,
          amount: t.netToHotel,
          type: 'booking',
        })),
      },
    });

    return invoice;
  }

  /**
   * Send invoice to supplier for payment
   */
  async sendInvoice(invoiceId: string) {
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be sent');
    }

    // Update status
    return await this.prisma.supplierInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'sent',
        sentDate: new Date(),
      },
    });
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceId: string, paymentReference: string) {
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    return await this.prisma.supplierInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidDate: new Date(),
        paymentReference,
      },
    });
  }

  /**
   * Create settlement record for supplier payout
   */
  async createSettlement(supplierId: string, periodYearMonth: string) {
    // Get invoice for period
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: {
        supplierId_invoicePeriod: {
          supplierId,
          invoicePeriod: periodYearMonth,
        },
      },
    });

    if (!invoice) {
      throw new BadRequestException(`No invoice found for period ${periodYearMonth}`);
    }

    if (invoice.status !== 'paid') {
      throw new BadRequestException('Invoice must be paid before settlement');
    }

    // Create settlement record
    const settlement = await this.prisma.settlement.create({
      data: {
        supplierId,
        invoiceId: invoice.id,
        settlementPeriod: periodYearMonth,
        settlementDate: new Date(),
        totalAmount: invoice.netAmount,
        status: 'pending',
      },
    });

    return settlement;
  }

  /**
   * Process settlement payout
   */
  async processSettlementPayout(settlementId: string, bankDetails: any) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new BadRequestException('Settlement not found');
    }

    if (settlement.status !== 'pending') {
      throw new BadRequestException('Settlement already processed');
    }

    // Generate payment reference (mock)
    const paymentReference = `PAY-${settlement.supplierId}-${new Date().getTime()}`;

    // Update settlement
    return await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'completed',
        paymentReference,
        paidDate: new Date(),
      },
    });
  }

  /**
   * Get invoices for supplier
   */
  async getSupplierInvoices(supplierId: string, limit = 20) {
    return await this.prisma.supplierInvoice.findMany({
      where: { supplierId },
      orderBy: { invoiceDate: 'desc' },
      take: limit,
    });
  }

  /**
   * Get settlements for supplier
   */
  async getSupplierSettlements(supplierId: string, limit = 20) {
    return await this.prisma.settlement.findMany({
      where: { supplierId },
      orderBy: { settlementDate: 'desc' },
      take: limit,
    });
  }

  /**
   * Get billing summary for supplier
   */
  async getBillingSummary(supplierId: string) {
    const invoices = await this.prisma.supplierInvoice.findMany({
      where: { supplierId },
    });

    const settlements = await this.prisma.settlement.findMany({
      where: { supplierId },
    });

    const summary = {
      totalInvoices: invoices.length,
      draftInvoices: invoices.filter((i) => i.status === 'draft').length,
      sentInvoices: invoices.filter((i) => i.status === 'sent').length,
      paidInvoices: invoices.filter((i) => i.status === 'paid').length,
      totalBilled: invoices.reduce((sum, i) => sum + i.grossAmount, 0),
      totalFees: invoices.reduce((sum, i) => sum + i.platformFee + i.paymentGatewayFee, 0),
      totalSettled: settlements.filter((s) => s.status === 'completed').length,
      pendingSettlement: settlements
        .filter((s) => s.status === 'pending')
        .reduce((sum, s) => sum + s.totalAmount, 0),
    };

    return summary;
  }

  /**
   * Dunning: Retry failed payment
   */
  async retryFailedPayment(settlementId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new BadRequestException('Settlement not found');
    }

    if (settlement.status !== 'failed') {
      throw new BadRequestException('Only failed settlements can be retried');
    }

    return await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'pending',
        retryCount: (settlement.retryCount || 0) + 1,
      },
    });
  }

  /**
   * Calculate fees breakdown
   */
  calculateFeeBreakdown(
    grossAmount: number,
    platformFeePct: number = 2,
    gatewayFeePct: number = 3,
  ) {
    const platformFee = grossAmount * (platformFeePct / 100);
    const gatewayFee = grossAmount * (gatewayFeePct / 100);
    const netAmount = grossAmount - platformFee - gatewayFee;

    return {
      grossAmount,
      platformFee: Math.round(platformFee * 100) / 100,
      gatewayFee: Math.round(gatewayFee * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      effectiveFeePct: ((platformFee + gatewayFee) / grossAmount) * 100,
    };
  }

  /**
   * Get billing due dates for next 30 days
   */
  async getUpcomingDueDates(limit = 10) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return await this.prisma.supplierInvoice.findMany({
      where: {
        status: 'sent',
        dueDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });
  }
}
