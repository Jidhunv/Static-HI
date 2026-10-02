import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '@shared/prisma/prisma.service';

@Injectable()
export class MFAService {
  constructor(private prisma: PrismaService) {}

  async setupTOTP(userId: string, email: string) {
    const secret = speakeasy.generateSecret({
      name: `HotelApp (${email})`,
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    await this.prisma.tenant.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    return { qrCode, secret: secret.base32, backupCodes: this.generateBackupCodes() };
  }

  verifyTOTP(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 10).toUpperCase());
  }

  async validateMFA(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.tenant.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true },
    });

    if (!user?.mfaEnabled || !user.mfaSecret) return true;

    return this.verifyTOTP(user.mfaSecret, token);
  }

  async enableMFA(userId: string) {
    await this.prisma.tenant.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
  }

  async disableMFA(userId: string) {
    await this.prisma.tenant.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });
  }
}
