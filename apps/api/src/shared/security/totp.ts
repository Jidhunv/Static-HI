import * as crypto from 'crypto';

// RFC 6238 TOTP (SHA-1, 6 digits, 30s step): the profile Google and Microsoft Authenticator use.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const TOTP_STEP_SECONDS = 30;

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = ((value << 8) | byte) & 0xffff;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of text.replace(/=+$/, '').toUpperCase()) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error('Invalid base32 character');
    value = ((value << 5) | index) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function totpAt(secretBase32: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac('sha1', base32Decode(secretBase32)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, '0');
}

export const currentStep = (nowMs: number = Date.now()) => Math.floor(nowMs / 1000 / TOTP_STEP_SECONDS);

/** Returns the matching time step (allowing one step of clock drift either way), or null. */
export function matchTotp(secretBase32: string, code: string, nowMs: number = Date.now()): number | null {
  const now = currentStep(nowMs);
  const given = Buffer.from(code);
  for (const step of [now, now - 1, now + 1]) {
    const expected = Buffer.from(totpAt(secretBase32, step));
    if (given.length === expected.length && crypto.timingSafeEqual(given, expected)) return step;
  }
  return null;
}
