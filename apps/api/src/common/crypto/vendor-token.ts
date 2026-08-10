import { createHash, randomBytes } from 'crypto';
import { decryptSecret, encryptSecret } from './token-crypto';

export function hashVendorToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateVendorToken(): string {
  return randomBytes(24).toString('hex');
}

export function encryptVendorToken(token: string, secret: string): string {
  return encryptSecret(token, secret);
}

export function decryptVendorToken(
  encrypted: string,
  secret: string,
): string {
  return decryptSecret(encrypted, secret);
}
