import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';

  // No fallback key: a random per-process key would make stored data unreadable after a restart.
  private get key(): Buffer {
    const hex = process.env.ENCRYPTION_KEY ?? '';
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
      throw new InternalServerErrorException('ENCRYPTION_KEY must be set to 64 hex characters');
    }
    return Buffer.from(hex, 'hex');
  }

  encrypt(data: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    return { encrypted, iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex') };
  }

  decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  }

  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
