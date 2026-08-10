import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createHmac } from 'crypto';
import { CustomersService } from '../customers/customers.service';
import { N8nService } from '../n8n/n8n.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderIntakeService } from '../orders/order-intake.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  let service: WebhooksService;
  const configValues: Record<string, string> = {
    META_VERIFY_TOKEN: 'verify-me',
    META_APP_SECRET: 'app-secret',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => configValues[key] ?? ''),
            get: jest.fn((key: string) => configValues[key]),
          },
        },
        { provide: PrismaService, useValue: {} },
        { provide: CustomersService, useValue: {} },
        { provide: N8nService, useValue: {} },
        { provide: WhatsAppService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: OrderIntakeService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(WebhooksService);
  });

  it('returns challenge when verify token matches', () => {
    expect(
      service.verifyChallenge('subscribe', 'verify-me', '12345'),
    ).toBe('12345');
  });

  it('rejects invalid verify token', () => {
    expect(() =>
      service.verifyChallenge('subscribe', 'wrong', '12345'),
    ).toThrow(ForbiddenException);
  });

  it('rejects missing challenge', () => {
    expect(() =>
      service.verifyChallenge('subscribe', 'verify-me', undefined),
    ).toThrow(ForbiddenException);
  });

  it('accepts valid Meta signature', () => {
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    const signature =
      'sha256=' +
      createHmac('sha256', 'app-secret').update(body).digest('hex');
    expect(() => service.verifySignature(body, signature)).not.toThrow();
  });

  it('rejects invalid Meta signature', () => {
    expect(() =>
      service.verifySignature(Buffer.from('{}'), 'sha256=deadbeef'),
    ).toThrow(ForbiddenException);
  });
});
