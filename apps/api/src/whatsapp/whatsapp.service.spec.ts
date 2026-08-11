import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetaWhatsAppClient } from './meta-whatsapp.client';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService meta phone linking', () => {
  let service: WhatsAppService;
  const prisma = {
    business: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    whatsAppAccount: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
            getOrThrow: jest.fn(() => 'jwt-secret-for-tests'),
          },
        },
        { provide: MetaWhatsAppClient, useValue: {} },
        { provide: NotificationsService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(WhatsAppService);
  });

  it('resolves connected phone_number_id from Business.metaPhoneNumberId', async () => {
    prisma.business.findUnique.mockResolvedValue({ id: 'biz-1' });

    await expect(
      service.resolveBusinessIdFromMetaMetadata({
        phoneNumberId: '1192018783994580',
      }),
    ).resolves.toBe('biz-1');
  });

  it('auto-links phone_number_id via unique display_phone_number match', async () => {
    prisma.business.findUnique.mockResolvedValue(null); // by metaPhoneNumberId
    prisma.whatsAppAccount.findUnique.mockImplementation(
      async (args: { where: { phoneNumberId?: string; businessId?: string } }) => {
        if (args.where.phoneNumberId) return null;
        if (args.where.businessId) return null;
        return null;
      },
    );
    prisma.business.findMany.mockResolvedValue([
      {
        id: 'biz-my',
        whatsappNumber: '+923134996633',
        phone: '+923134996633',
        metaPhoneNumberId: null,
      },
    ]);
    prisma.business.findFirst.mockResolvedValue(null);
    prisma.whatsAppAccount.findFirst.mockResolvedValue(null);
    prisma.business.update.mockResolvedValue({});

    const id = await service.resolveBusinessIdFromMetaMetadata({
      phoneNumberId: '1192018783994580',
      displayPhoneNumber: '923134996633',
    });

    expect(id).toBe('biz-my');
    expect(prisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'biz-my' },
        data: expect.objectContaining({
          metaPhoneNumberId: '1192018783994580',
        }),
      }),
    );
  });

  it('does not link when display phone matches multiple businesses', async () => {
    prisma.business.findUnique.mockResolvedValue(null);
    prisma.whatsAppAccount.findUnique.mockResolvedValue(null);
    prisma.business.findMany.mockResolvedValue([
      {
        id: 'biz-1',
        whatsappNumber: '+923134996633',
        phone: null,
        metaPhoneNumberId: null,
      },
      {
        id: 'biz-2',
        whatsappNumber: '+923134996633',
        phone: null,
        metaPhoneNumberId: null,
      },
    ]);

    await expect(
      service.resolveBusinessIdFromMetaMetadata({
        phoneNumberId: '1192018783994580',
        displayPhoneNumber: '923134996633',
      }),
    ).resolves.toBeNull();
    expect(prisma.business.update).not.toHaveBeenCalled();
  });

  it('rejects linking phone_number_id already owned by another business', async () => {
    prisma.business.findFirst.mockResolvedValue({ id: 'other' });
    await expect(
      service.linkMetaPhoneNumberId('biz-my', '1192018783994580'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns null for unknown phone_number_id without display phone', async () => {
    prisma.business.findUnique.mockResolvedValue(null);
    prisma.whatsAppAccount.findUnique.mockResolvedValue(null);

    await expect(
      service.resolveBusinessIdFromMetaMetadata({
        phoneNumberId: 'unknown-id',
      }),
    ).resolves.toBeNull();
  });
});
