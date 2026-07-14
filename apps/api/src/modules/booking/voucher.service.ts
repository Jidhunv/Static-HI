import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class VoucherService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate beautiful HTML voucher
   */
  async generateVoucherHTML(tenantId: string, bookingId: string): Promise<string> {
    const voucher = await this.prisma.bookingVoucher.findFirst({
      where: {
        booking: {
          tenantId,
          id: bookingId,
        },
      },
      include: {
        booking: true,
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    const primaryColor = voucher.primaryColor || '#7c3aed';
    const secondaryColor = voucher.secondaryColor || '#a78bfa';

    return this.generateHTML(voucher, primaryColor, secondaryColor);
  }

  /**
   * Generate voucher for B2C guest
   */
  async generateB2CVoucher(bookingId: string): Promise<string> {
    const voucher = await this.prisma.bookingVoucher.findUnique({
      where: { id: bookingId },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    const primaryColor = voucher.primaryColor || '#3b82f6';
    const secondaryColor = voucher.secondaryColor || '#60a5fa';

    return this.generateHTML(voucher, primaryColor, secondaryColor);
  }

  /**
   * Generate voucher PDF (placeholder - actual PDF generation would use a library)
   */
  async generateVoucherPDF(voucherId: string): Promise<Buffer> {
    const voucher = await this.prisma.bookingVoucher.findUnique({
      where: { id: voucherId },
      include: {
        booking: true,
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    // In production, use a library like puppeteer or pdf-lib
    // For now, return the HTML as a placeholder
    const html = await this.generateVoucherHTML(voucher.booking.tenantId, voucher.booking.id);
    return Buffer.from(html);
  }

  /**
   * Generate HTML voucher content
   */
  private generateHTML(voucher: any, primaryColor: string, secondaryColor: string): string {
    const subtotalFormatted = voucher.subtotal.toFixed(2);
    const taxFormatted = voucher.tax.toFixed(2);
    const totalFormatted = voucher.total.toFixed(2);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotel Voucher - ${voucher.voucherNo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }

    .voucher {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      border-radius: 12px;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .logo {
      width: 60px;
      height: 60px;
      margin: 0 auto 15px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
    }

    .header h1 {
      font-size: 32px;
      margin: 10px 0;
      font-weight: 700;
    }

    .header p {
      font-size: 14px;
      opacity: 0.9;
    }

    .voucher-number {
      background: rgba(255,255,255,0.1);
      padding: 10px 20px;
      border-radius: 6px;
      margin-top: 15px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      letter-spacing: 1px;
    }

    .content {
      padding: 40px;
    }

    .section {
      margin-bottom: 30px;
    }

    .section-title {
      color: ${primaryColor};
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${primaryColor};
    }

    .guest-info, .stay-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .info-value {
      font-size: 16px;
      color: #333;
      font-weight: 600;
    }

    .hotel-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .hotel-detail-item {
      font-size: 14px;
      color: #666;
    }

    .hotel-detail-item strong {
      color: #333;
      display: block;
      margin-bottom: 3px;
    }

    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    .pricing-row {
      display: grid;
      grid-template-columns: 1fr auto;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }

    .pricing-row.total {
      background: #f9f9f9;
      padding: 15px;
      border: 2px solid ${primaryColor};
      border-radius: 6px;
      margin-top: 10px;
      font-weight: 700;
      font-size: 16px;
    }

    .pricing-row.total .label {
      color: ${primaryColor};
    }

    .pricing-row.total .value {
      color: ${primaryColor};
      font-size: 20px;
    }

    .label {
      color: #666;
    }

    .value {
      text-align: right;
      color: #333;
      font-weight: 600;
    }

    .footer {
      background: #f9f9f9;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #eee;
    }

    .footer-text {
      font-size: 12px;
      color: #999;
      line-height: 1.8;
    }

    .terms {
      margin-top: 20px;
      padding: 15px;
      background: ${primaryColor}10;
      border-left: 4px solid ${primaryColor};
      border-radius: 4px;
      font-size: 11px;
      color: #666;
    }

    .qr-code {
      width: 100px;
      height: 100px;
      margin: 15px auto;
      background: #f0f0f0;
      border: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: #999;
      border-radius: 6px;
    }

    @media print {
      body { background: white; padding: 0; }
      .voucher { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="voucher">
    <!-- HEADER -->
    <div class="header">
      ${voucher.hotelLogo ? `<div class="logo"><img src="${voucher.hotelLogo}" style="width:100%; height:100%; object-fit: cover; border-radius: 50%;"></div>` : '<div class="logo">🏨</div>'}
      <h1>${voucher.hotelName}</h1>
      <p>${voucher.tenantName || 'Hotel Reservation'}</p>
      <div class="voucher-number">${voucher.voucherNo}</div>
    </div>

    <!-- CONTENT -->
    <div class="content">
      <!-- GUEST INFORMATION -->
      <div class="section">
        <div class="section-title">Guest Information</div>
        <div class="guest-info">
          <div class="info-item">
            <span class="info-label">Guest Name</span>
            <span class="info-value">${voucher.guestName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email</span>
            <span class="info-value">${voucher.guestEmail}</span>
          </div>
          ${voucher.guestPhone ? `
          <div class="info-item">
            <span class="info-label">Phone</span>
            <span class="info-value">${voucher.guestPhone}</span>
          </div>
          ` : ''}
          <div class="info-item">
            <span class="info-label">Confirmation #</span>
            <span class="info-value">${voucher.voucherNo}</span>
          </div>
        </div>
      </div>

      <!-- STAY INFORMATION -->
      <div class="section">
        <div class="section-title">Your Stay</div>
        <div class="stay-info">
          <div class="info-item">
            <span class="info-label">Check-In</span>
            <span class="info-value">${this.formatDate(voucher.checkInDate)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Check-Out</span>
            <span class="info-value">${this.formatDate(voucher.checkOutDate)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Number of Nights</span>
            <span class="info-value">${voucher.numberOfNights}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Room Type</span>
            <span class="info-value">${voucher.roomType}</span>
          </div>
        </div>
      </div>

      <!-- HOTEL INFORMATION -->
      <div class="section">
        <div class="section-title">Hotel Details</div>
        <div class="hotel-details">
          <div class="hotel-detail-item">
            <strong>Address</strong>
            ${voucher.hotelAddress}
          </div>
          <div class="hotel-detail-item">
            <strong>Contact</strong>
            ${voucher.hotelPhone ? `Phone: ${voucher.hotelPhone}<br>` : ''}
            ${voucher.hotelEmail ? `Email: ${voucher.hotelEmail}<br>` : ''}
            ${voucher.hotelWebsite ? `Web: ${voucher.hotelWebsite}` : ''}
          </div>
        </div>
      </div>

      <!-- PRICING -->
      <div class="section">
        <div class="section-title">Pricing Breakdown</div>
        <div class="pricing-table">
          <div class="pricing-row">
            <span class="label">${voucher.rate}</span>
            <span class="value">${voucher.currency} ${subtotalFormatted}</span>
          </div>
          <div class="pricing-row">
            <span class="label">Taxes (10%)</span>
            <span class="value">${voucher.currency} ${taxFormatted}</span>
          </div>
          <div class="pricing-row total">
            <span class="label">TOTAL</span>
            <span class="value">${voucher.currency} ${totalFormatted}</span>
          </div>
        </div>
      </div>

      <!-- QR CODE -->
      <div style="text-align: center;">
        <div class="qr-code">QR Code Here</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-text">
        <p><strong>Important Information:</strong></p>
        <p>Please present this voucher at check-in. Your reservation is confirmed and guaranteed.</p>
        <p style="margin-top: 10px; font-size: 11px;">Generated on ${new Date().toLocaleDateString()} | Valid from ${this.formatDate(voucher.validFrom)} to ${this.formatDate(voucher.validUntil)}</p>
      </div>
      <div class="terms">
        <strong>Terms & Conditions:</strong><br>
        • Check-in: After 14:00 | Check-out: Before 12:00<br>
        • Cancellation: As per hotel's cancellation policy<br>
        • Payments: To be made at check-in unless otherwise arranged<br>
        • Guest must present a valid ID at check-in
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
