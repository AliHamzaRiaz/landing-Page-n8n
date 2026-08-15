import {
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';

export const WhatsAppErrorCode = {
  META_AUTHORIZATION_FAILED: 'META_AUTHORIZATION_FAILED',
  PHONE_VERIFICATION_FAILED: 'PHONE_VERIFICATION_FAILED',
  WABA_NOT_FOUND: 'WABA_NOT_FOUND',
  PHONE_NUMBER_NOT_FOUND: 'PHONE_NUMBER_NOT_FOUND',
  PHONE_ALREADY_CONNECTED: 'PHONE_ALREADY_CONNECTED',
  INVALID_META_TOKEN: 'INVALID_META_TOKEN',
  WEBHOOK_SUBSCRIBE_FAILED: 'WEBHOOK_SUBSCRIBE_FAILED',
  META_API_TIMEOUT: 'META_API_TIMEOUT',
  UNSUPPORTED_NUMBER: 'UNSUPPORTED_NUMBER',
  COEXISTENCE_UNAVAILABLE: 'COEXISTENCE_UNAVAILABLE',
  CROSS_TENANT_DENIED: 'CROSS_TENANT_DENIED',
} as const;

export type WhatsAppErrorCodeValue =
  (typeof WhatsAppErrorCode)[keyof typeof WhatsAppErrorCode];

const MESSAGES: Record<WhatsAppErrorCodeValue, string> = {
  META_AUTHORIZATION_FAILED:
    'Meta authorization failed. Please try Connect WhatsApp again.',
  PHONE_VERIFICATION_FAILED:
    'Phone verification failed. Complete Meta’s WhatsApp number verification and try again.',
  WABA_NOT_FOUND:
    'WhatsApp Business Account was not found for this Meta authorization.',
  PHONE_NUMBER_NOT_FOUND:
    'A WhatsApp phone number was not found on the authorized account.',
  PHONE_ALREADY_CONNECTED:
    'This WhatsApp phone number is already connected to another business.',
  INVALID_META_TOKEN:
    'Meta rejected the authorization token. Please connect WhatsApp again.',
  WEBHOOK_SUBSCRIBE_FAILED:
    'Connected to Meta, but webhook subscription failed. Try again or contact support.',
  META_API_TIMEOUT:
    'Meta took too long to respond. Please try connecting WhatsApp again.',
  UNSUPPORTED_NUMBER:
    'This WhatsApp number is not supported for Cloud API onboarding.',
  COEXISTENCE_UNAVAILABLE:
    'WhatsApp Business App Coexistence is not available for this number. Standard Embedded Signup will be used instead.',
  CROSS_TENANT_DENIED: 'This order does not belong to the connected business.',
};

export function whatsappError(
  code: WhatsAppErrorCodeValue,
  override?: string,
): HttpException {
  const message = override || MESSAGES[code];
  if (code === WhatsAppErrorCode.PHONE_ALREADY_CONNECTED) {
    return new ConflictException({ message, code });
  }
  return new BadRequestException({ message, code });
}

export function extractWhatsAppErrorCode(
  body: unknown,
): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as { code?: unknown; error?: unknown };
  if (typeof record.code === 'string') return record.code;
  if (typeof record.error === 'string' && record.error.length < 80) {
    return record.error;
  }
  return undefined;
}
