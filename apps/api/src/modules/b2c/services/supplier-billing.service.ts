import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

const round = (n: number) => Math.round(n * 100) / 100;

/** Monthly invoices per supplier. Payouts themselves live in SettlementService. */
@Injectable()
export class SupplierBillingService {
  constructor(private prisma: PrismaService) {}

  async generateMonthlyInvoice(supplierId: string, period: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new BadRequestException('Period must be YYYY-MM');
    const [year, month] = period.split('-').map(Number);

    const transactions = await this.prisma.revenueTransaction.findMany({
      where: {
        originSupplier: supplierId,
        status: 'settled',
        transactionDate: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
      },
    });
    if (transactions.length === 0) return null;

    const existing = await this.prisma.supplierInvoice.findUnique({
      where: { supplierId_invoicePeriod: { supplierId, invoicePeriod: period } },
    });
    if (existing) throw new ConflictException(`Invoice already exists for period ${period}`);

    const total = (pick: (t: (typeof transactions)[number]) => number) =>
      round(transactions.reduce((sum, t) => sum + pick(t), 0));
    const grossAmount = total((t) => t.netToHotel);
    const platformFee = total((t) => t.platformFee);
    const paymentGatewayFee = total((t) => t.paymentGatewayFee);

    return this.prisma.supplierInvoice.create({
      data: {
        supplierId,
        invoicePeriod: period,
        invoiceNumber: `INV-${supplierId}-${period}`,
        dueDate: new Date(Date.now() + 15 * 86_400_000),
        totalBookings: transactions.length,
        grossAmount,
        platformFee,
        paymentGatewayFee,
        netAmount: round(grossAmount - platformFee - paymentGatewayFee),
        lineItems: transactions.map((t) => ({ booking_id: t.bookingId, amount: t.netToHotel, type: 'booking' })),
      },
    });
  }

  sendInvoice(supplierId: string, invoiceId: string) {
    return this.transition(supplierId, invoiceId, ['draft'], { status: 'sent', sentDate: new Date() });
  }

  markInvoicePaid(supplierId: string, invoiceId: string, paymentReference: string) {
    return this.transition(supplierId, invoiceId, ['sent', 'overdue'], {
      status: 'paid',
      paidDate: new Date(),
      paymentReference,
    });
  }

  getSupplierInvoices(supplierId: string, limit = 20) {
    return this.prisma.supplierInvoice.findMany({
      where: { supplierId },
      orderBy: { invoiceDate: 'desc' },
      take: Math.min(Number(limit) || 20, 100),
    });
  }

  async getBillingSummary(supplierId: string) {
    const groups = await this.prisma.supplierInvoice.groupBy({
      by: ['status'],
      where: { supplierId },
      _count: true,
      _sum: { grossAmount: true, platformFee: true, paymentGatewayFee: true },
    });
    const count = (status: string) => groups.find((g) => g.status === status)?._count ?? 0;

    return {
      totalInvoices: groups.reduce((sum, g) => sum + g._count, 0),
      draftInvoices: count('draft'),
      sentInvoices: count('sent'),
      paidInvoices: count('paid'),
      totalBilled: round(groups.reduce((sum, g) => sum + (g._sum.grossAmount ?? 0), 0)),
      totalFees: round(
        groups.reduce((sum, g) => sum + (g._sum.platformFee ?? 0) + (g._sum.paymentGatewayFee ?? 0), 0),
      ),
    };
  }

  calculateFeeBreakdown(grossAmount: number, platformFeePct = 2, gatewayFeePct = 3) {
    const platformFee = round((grossAmount * platformFeePct) / 100);
    const gatewayFee = round((grossAmount * gatewayFeePct) / 100);
    return {
      grossAmount,
      platformFee,
      gatewayFee,
      netAmount: round(grossAmount - platformFee - gatewayFee),
      effectiveFeePct: platformFeePct + gatewayFeePct,
    };
  }

  /** This supplier's sent invoices falling due in the next 30 days. */
  getUpcomingDueDates(supplierId: string, limit = 10) {
    return this.prisma.supplierInvoice.findMany({
      where: {
        supplierId,
        status: 'sent',
        dueDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86_400_000) },
      },
      orderBy: { dueDate: 'asc' },
      take: Math.min(Number(limit) || 10, 100),
    });
  }

  /** Status change scoped to the owning supplier and to the allowed starting states. */
  private async transition(supplierId: string, id: string, from: string[], data: Record<string, unknown>) {
    const { count } = await this.prisma.supplierInvoice.updateMany({
      where: { id, supplierId, status: { in: from } },
      data,
    });
    if (count === 0) throw new NotFoundException(`No invoice with that id in status ${from.join(' or ')}`);
    return this.prisma.supplierInvoice.findUnique({ where: { id } });
  }
}
