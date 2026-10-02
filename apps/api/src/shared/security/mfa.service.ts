import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { Principal } from './principal';
import { base32Encode, matchTotp } from './totp';

interface MfaState {
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaBackupCodes: string[];
  mfaLastStep: number | null;
}

const MFA_FIELDS = { mfaEnabled: true, mfaSecret: true, mfaBackupCodes: true, mfaLastStep: true } as const;

@Injectable()
export class MFAService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  private load(p: Principal): Promise<MfaState | null> {
    return p.isPlatformAdmin
      ? this.prisma.platformAdmin.findUnique({ where: { id: p.id }, select: MFA_FIELDS })
      : this.prisma.tenantUser.findUnique({ where: { id: p.id }, select: MFA_FIELDS });
  }

  /** Conditional update so two concurrent requests cannot both consume the same code. */
  private async save(p: Principal, where: Record<string, unknown>, data: Partial<MfaState>): Promise<boolean> {
    const args = { where: { id: p.id, ...where }, data };
    const result = p.isPlatformAdmin
      ? await this.prisma.platformAdmin.updateMany(args)
      : await this.prisma.tenantUser.updateMany(args);
    return result.count === 1;
  }

  private readSecret(stored: string): string {
    const { encrypted, iv, authTag } = JSON.parse(stored);
    return this.encryption.decrypt(encrypted, iv, authTag);
  }

  /** Step 1: issue a secret. MFA stays off until a code from the app is confirmed. */
  async setup(p: Principal) {
    const state = await this.load(p);
    if (state?.mfaEnabled) throw new BadRequestException('MFA is already enabled');

    const secret = base32Encode(crypto.randomBytes(20));
    await this.save(p, {}, { mfaSecret: JSON.stringify(this.encryption.encrypt(secret)), mfaLastStep: null });

    const issuer = encodeURIComponent('Hotel Inventory');
    const otpauthUrl = `otpauth://totp/${issuer}:${encodeURIComponent(p.email)}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    return { secret, otpauthUrl };
  }

  /** Step 2: confirm a code, switch MFA on and hand out backup codes once. */
  async enable(p: Principal, code: string) {
    const state = await this.load(p);
    if (!state?.mfaSecret) throw new BadRequestException('Run MFA setup first');
    if (state.mfaEnabled) throw new BadRequestException('MFA is already enabled');

    const step = matchTotp(this.readSecret(state.mfaSecret), code);
    if (step === null) throw new BadRequestException('Invalid code');

    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(5).toString('hex'));
    await this.save(p, {}, {
      mfaEnabled: true,
      mfaLastStep: step,
      mfaBackupCodes: backupCodes.map((c) => this.encryption.hashData(c)),
    });
    return { backupCodes };
  }

  async disable(p: Principal, code: string) {
    if (!(await this.verify(p, code))) throw new BadRequestException('Invalid code');
    await this.save(p, {}, { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [], mfaLastStep: null });
  }

  /** True only if MFA is enabled and the code is a fresh TOTP code or an unused backup code. */
  async verify(p: Principal, code: string): Promise<boolean> {
    const state = await this.load(p);
    if (!state?.mfaEnabled || !state.mfaSecret || typeof code !== 'string') return false;

    if (/^\d{6}$/.test(code)) {
      const step = matchTotp(this.readSecret(state.mfaSecret), code);
      if (step === null || (state.mfaLastStep !== null && step <= state.mfaLastStep)) return false;
      return this.save(p, { mfaLastStep: state.mfaLastStep }, { mfaLastStep: step });
    }

    const hash = this.encryption.hashData(code.trim().toLowerCase());
    if (!state.mfaBackupCodes.includes(hash)) return false;
    return this.save(
      p,
      { mfaBackupCodes: { has: hash } },
      { mfaBackupCodes: state.mfaBackupCodes.filter((c) => c !== hash) },
    );
  }
}
