import { splitBooking } from '../../modules/b2c/services/settlement.math';
import { EncryptionService } from './encryption.service';
import { base32Decode, base32Encode, matchTotp, totpAt } from './totp';

describe('TOTP (RFC 6238 SHA-1 test vectors)', () => {
  const secret = base32Encode(Buffer.from('12345678901234567890'));

  it('round-trips base32', () => {
    expect(secret).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(base32Decode(secret).toString()).toBe('12345678901234567890');
  });

  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1234567890, '005924'],
    [2000000000, '279037'],
  ])('at %i seconds gives %s', (seconds, code) => {
    expect(totpAt(secret, Math.floor(seconds / 30))).toBe(code);
  });

  it('accepts one step of drift and rejects anything else', () => {
    const now = 1111111109 * 1000;
    expect(matchTotp(secret, '081804', now)).toBe(Math.floor(1111111109 / 30));
    expect(matchTotp(secret, '081804', now + 30_000)).not.toBeNull();
    expect(matchTotp(secret, '081804', now + 90_000)).toBeNull();
    expect(matchTotp(secret, '000000', now)).toBeNull();
  });
});

describe('EncryptionService', () => {
  const service = new EncryptionService();
  afterEach(() => delete process.env.ENCRYPTION_KEY);

  it('round-trips and detects tampering', () => {
    process.env.ENCRYPTION_KEY = 'ab'.repeat(32);
    const box = service.encrypt('secret value');
    expect(box.encrypted).not.toContain('secret');
    expect(service.decrypt(box.encrypted, box.iv, box.authTag)).toBe('secret value');
    expect(() => service.decrypt(box.encrypted, box.iv, '00'.repeat(16))).toThrow();
  });

  it('refuses to work without a valid key', () => {
    expect(() => service.encrypt('x')).toThrow('ENCRYPTION_KEY');
  });
});

describe('splitBooking', () => {
  it('splits a booking into fees, seller receipt and owner payable', () => {
    expect(splitBooking(875, 750, 5)).toEqual({
      platformFee: 17.5,
      gatewayFee: 26.25,
      commission: 37.5,
      sellerAmount: 831.25,
      ownerAmount: 787.5,
      markup: 125,
    });
  });

  it('rounds to cents', () => {
    const split = splitBooking(99.99, 80.01, 12.5);
    expect(split.platformFee).toBe(2);
    expect(split.gatewayFee).toBe(3);
    expect(split.commission).toBe(10);
    expect(split.sellerAmount).toBe(94.99);
    expect(split.ownerAmount).toBe(90.01);
  });
});
