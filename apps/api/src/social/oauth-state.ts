import { createHmac, timingSafeEqual } from 'crypto';
import { SocialPlatform } from '@prisma/client';

export function parsePlatform(value: string): SocialPlatform {
  const key = value.trim().toUpperCase();
  if ((Object.values(SocialPlatform) as string[]).includes(key)) {
    return key as SocialPlatform;
  }
  throw new Error(`Unsupported platform: ${value}`);
}

export function signOAuthState(secret: string, payload: Record<string, string>) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyOAuthState(secret: string, state: string): Record<string, string> {
  const [body, sig] = state.split('.');
  if (!body || !sig) throw new Error('Invalid OAuth state');
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Invalid OAuth state');
  }
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<string, string>;
}
