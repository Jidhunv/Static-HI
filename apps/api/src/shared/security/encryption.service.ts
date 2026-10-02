import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private logger = new Logger(EncryptionService.name);
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;
  private ivLength = 16;

  constructor() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length < this.keyLength) {
      throw new Error('Invalid ENCRYPTION_KEY in .env - must be 32+ characters');
    }
  }

  private getKey(): Buffer {
    return Buffer.from(process.env.ENCRYPTION_KEY!.slice(0, this.keyLength), 'utf8');
  }

  encrypt(data: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.getKey(), iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (e) {
      this.logger.error('Encryption failed', e);
      throw new Error('Encryption failed');
    }
  }

  decrypt(encrypted: string): string {
    try {
      const [ivHex, tagHex, data] = encrypted.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.getKey(), iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (e) {
      this.logger.error('Decryption failed', e);
      throw new Error('Decryption failed');
    }
  }

  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, hash: string): boolean {
    const [salt, stored] = hash.split(':');
    const test = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return test === stored;
  }
}
