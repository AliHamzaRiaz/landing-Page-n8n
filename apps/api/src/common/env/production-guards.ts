import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('ProductionGuards');

export function isProduction(config: ConfigService): boolean {
  return config.get<string>('NODE_ENV') === 'production';
}

export function assertProductionSecrets(config: ConfigService): void {
  if (!isProduction(config)) return;

  const missing: string[] = [];
  if (!config.get<string>('ENCRYPTION_KEY')?.trim()) {
    missing.push('ENCRYPTION_KEY');
  }
  if (!config.get<string>('META_APP_SECRET')?.trim()) {
    missing.push('META_APP_SECRET');
  }
  if (!config.get<string>('META_APP_ID')?.trim()) {
    missing.push('META_APP_ID');
  }
  if (!config.get<string>('META_EMBEDDED_SIGNUP_CONFIG_ID')?.trim()) {
    missing.push('META_EMBEDDED_SIGNUP_CONFIG_ID');
  }

  if (missing.length) {
    const msg = `Missing required production env: ${missing.join(', ')}`;
    logger.error(msg);
    throw new Error(msg);
  }
}

export function encryptionSecret(config: ConfigService): string {
  const key = config.get<string>('ENCRYPTION_KEY')?.trim();
  if (key) return key;
  if (isProduction(config)) {
    throw new Error('ENCRYPTION_KEY is required in production');
  }
  return config.getOrThrow<string>('JWT_SECRET');
}

export function isPlatformFallbackEnabled(config: ConfigService): boolean {
  if (isProduction(config)) return false;
  return config.get<string>('WHATSAPP_PLATFORM_FALLBACK') === 'true';
}
