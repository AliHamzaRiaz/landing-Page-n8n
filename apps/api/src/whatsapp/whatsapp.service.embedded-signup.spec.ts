import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { WhatsAppConnectionStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetaWhatsAppClient } from './meta-whatsapp.client';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService Embedded Signup', () => {
  let service: WhatsAppService;

  const prisma = {
    business: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    whatsAppAccount: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    integration: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const meta = {
    exchangeAuthorizationCode: jest.fn(),
    validateCredentials: jest.fn(),
    subscribeWaba: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma.business.findFirst.mockResolvedValue(null);
    prisma.whatsAppAccount.findFirst.mockResolvedValue(null);
    prisma.integration.findFirst.mockResolvedValue(null);
    prisma.business.update.mockResolvedValue({});
    prisma.integration.create.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});

    meta.exchangeAuthorizationCode.mockResolvedValue({
      accessToken: 'token-a',
      expiresIn: 3600,
    });
    meta.validateCredentials.mockResolvedValue({
      ok: true,
      displayPhoneNumber: '+923001112233',
      verifiedName: 'Shop A',
    });
    meta.subscribeWaba.mockResolvedValue(true);

    prisma.whatsAppAccount.upsert.mockResolvedValue({
      id: 'wa-1',
      businessId: 'biz-a',
      phoneNumberId: 'phone-a',
      wabaId: 'waba-a',
      displayPhoneNumber: '+923001112233',
      status: WhatsAppConnectionStatus.CONNECTED,
      lastError: null,
      connectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ENCRYPTION_KEY') return 'a'.repeat(64);
              if (key === 'NODE_ENV') return 'test';
              return undefined;
            }),
            getOrThrow: jest.fn(() => 'jwt-secret-for-tests'),
          },
        },
        { provide: MetaWhatsAppClient, useValue: meta },
        { provide: NotificationsService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(WhatsAppService);
  });

  it('completes Embedded Signup and marks CONNECTED only after Meta validation + subscribe', async () => {
    const result = await service.completeEmbeddedSignup('biz-a', 'user-1', {
      code: 'auth-code',
      wabaId: 'waba-a',
      phoneNumberId: 'phone-a',
    });

    expect(result.data.connected).toBe(true);
    expect(meta.exchangeAuthorizationCode).toHaveBeenCalledWith('auth-code');
    expect(meta.subscribeWaba).toHaveBeenCalledWith('waba-a', 'token-a');
    expect(prisma.whatsAppAccount.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: WhatsAppConnectionStatus.CONNECTED,
          phoneNumberId: 'phone-a',
        }),
      }),
    );
    expect(JSON.stringify(result)).not.toMatch(/token-a/);
  });

  it('does not mark CONNECTED when Meta validation fails', async () => {
    meta.validateCredentials.mockResolvedValue({ ok: false });

    await expect(
      service.completeEmbeddedSignup('biz-a', 'user-1', {
        code: 'auth-code',
        wabaId: 'waba-a',
        phoneNumberId: 'phone-a',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.whatsAppAccount.upsert).not.toHaveBeenCalled();
  });

  it('does not mark CONNECTED when WABA subscription fails', async () => {
    meta.subscribeWaba.mockResolvedValue(false);

    await expect(
      service.completeEmbeddedSignup('biz-a', 'user-1', {
        code: 'auth-code',
        wabaId: 'waba-a',
        phoneNumberId: 'phone-a',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.whatsAppAccount.upsert).not.toHaveBeenCalled();
  });

  it('rejects phone_number_id already linked to another business', async () => {
    prisma.business.findFirst.mockResolvedValue({ id: 'other-biz' });

    await expect(
      service.completeEmbeddedSignup('biz-a', 'user-1', {
        code: 'auth-code',
        wabaId: 'waba-a',
        phoneNumberId: 'phone-a',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
