import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { N8nOrdersService } from './n8n-orders.service';

describe('N8nOrdersService', () => {
  let service: N8nOrdersService;

  const prisma = {
    business: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    whatsAppAccount: { findUnique: jest.fn() },
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const ordersService = {
    assertValidTransition: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        N8nOrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();
    service = moduleRef.get(N8nOrdersService);
  });

  it('getOrder returns presented order without secrets', async () => {
    prisma.order.findUnique
      .mockResolvedValueOnce({ id: 'o1' })
      .mockResolvedValueOnce({
      id: 'o1',
      orderNumber: 'ORD-00001',
      status: OrderStatus.PENDING,
      totalAmount: 4000,
      currency: 'PKR',
      notes: null,
      deliveryAddress: 'Lahore',
      source: 'whatsapp-n8n',
      whatsappMsgId: 'wamid.1',
      confirmedAt: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      businessId: 'b1',
      customerId: 'c1',
      customer: { id: 'c1', name: 'Ayesha', phone: '+92300111' },
      business: {
        id: 'b1',
        name: 'ABC',
        companyName: 'ABC Garments',
        slug: 'abc-garments',
        whatsappNumber: '+92300222',
      },
      items: [
        {
          id: 'i1',
          productId: 'p1',
          name: 'Black Kurta',
          quantity: 2,
          unitPrice: 2000,
          totalPrice: 4000,
        },
      ],
    });

    const order = await service.getOrder('o1');
    expect(order.id).toBe('o1');
    expect(order.orderNumber).toBe('ORD-00001');
    expect(order.quantity).toBe(2);
    expect(order.customer.phone).toBe('+92300111');
    expect(order.address).toBe('Lahore');
    expect(JSON.stringify(order)).not.toMatch(/accessToken|password|secret/i);
  });

  it('getOrder throws when missing', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    prisma.order.findFirst.mockResolvedValue(null);
    await expect(service.getOrder('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updateStatus resolves confirm_<cuid> button ids to Order.id', async () => {
    const presented = {
      id: 'cmsowpb11000bhw1y5tfa17i2',
      orderNumber: 'ORD-00010',
      status: OrderStatus.CONFIRMED,
      totalAmount: 100,
      currency: 'PKR',
      notes: null,
      deliveryAddress: null,
      source: 'whatsapp-n8n',
      whatsappMsgId: null,
      confirmedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      businessId: 'b1',
      customerId: 'c1',
      customer: { id: 'c1', name: null, phone: '+92300' },
      business: {
        id: 'b1',
        name: 'ABC',
        companyName: 'ABC',
        slug: 'abc',
        whatsappNumber: null,
      },
      items: [],
    };

    prisma.order.findUnique
      .mockResolvedValueOnce(null) // raw confirm_<cuid>
      .mockResolvedValueOnce({ id: 'cmsowpb11000bhw1y5tfa17i2' }) // stripped cuid
      .mockResolvedValueOnce({
        id: 'cmsowpb11000bhw1y5tfa17i2',
        status: OrderStatus.PENDING,
        confirmedAt: null,
        businessId: 'b1',
      });
    prisma.order.update.mockResolvedValue(presented);

    const order = await service.updateStatus(
      'confirm_cmsowpb11000bhw1y5tfa17i2',
      OrderStatus.CONFIRMED,
    );
    expect(order.status).toBe(OrderStatus.CONFIRMED);
    expect(order.id).toBe('cmsowpb11000bhw1y5tfa17i2');
  });

  it('updateStatus resolves prefixed orderNumber refs', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    prisma.order.findFirst.mockResolvedValue({ id: 'o1' });
    prisma.order.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'o1',
        status: OrderStatus.PENDING,
        confirmedAt: null,
        businessId: 'b1',
      });
    prisma.order.update.mockResolvedValue({
      id: 'o1',
      orderNumber: 'ORD-00001',
      status: OrderStatus.CONFIRMED,
      totalAmount: 100,
      currency: 'PKR',
      notes: null,
      deliveryAddress: null,
      source: 'whatsapp-n8n',
      whatsappMsgId: null,
      confirmedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      businessId: 'b1',
      customerId: 'c1',
      customer: { id: 'c1', name: null, phone: '+92300' },
      business: {
        id: 'b1',
        name: 'ABC',
        companyName: 'ABC',
        slug: 'abc',
        whatsappNumber: null,
      },
      items: [],
    });

    const order = await service.updateStatus(
      'confirm_ORD-00001',
      OrderStatus.CONFIRMED,
    );
    expect(order.status).toBe(OrderStatus.CONFIRMED);
    expect(prisma.order.findFirst).toHaveBeenCalled();
  });

  it('updateStatus writes history via n8n actor', async () => {
    prisma.order.findUnique
      .mockResolvedValueOnce({ id: 'o1' })
      .mockResolvedValueOnce({
      id: 'o1',
      status: OrderStatus.PENDING,
      confirmedAt: null,
      businessId: 'b1',
    });
    prisma.order.update.mockResolvedValue({
      id: 'o1',
      orderNumber: 'ORD-00001',
      status: OrderStatus.CONFIRMED,
      totalAmount: 100,
      currency: 'PKR',
      notes: null,
      deliveryAddress: null,
      source: 'whatsapp-n8n',
      whatsappMsgId: null,
      confirmedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      businessId: 'b1',
      customerId: 'c1',
      customer: { id: 'c1', name: null, phone: '+92300' },
      business: {
        id: 'b1',
        name: 'ABC',
        companyName: 'ABC',
        slug: 'abc',
        whatsappNumber: null,
      },
      items: [],
    });

    const order = await service.updateStatus('o1', OrderStatus.CONFIRMED);
    expect(order.status).toBe(OrderStatus.CONFIRMED);
    expect(ordersService.assertValidTransition).toHaveBeenCalledWith(
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
    );
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          statusHistory: {
            create: [{ status: OrderStatus.CONFIRMED, changedBy: 'n8n' }],
          },
        }),
      }),
    );
  });

  it('updateStatus rejects invalid transitions', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: OrderStatus.PENDING,
      confirmedAt: null,
      businessId: 'b1',
    });
    ordersService.assertValidTransition.mockImplementation(() => {
      throw new BadRequestException('Cannot change');
    });

    await expect(
      service.updateStatus('o1', OrderStatus.DELIVERED),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('listBusinessOrders filters and paginates', async () => {
    prisma.business.findUnique.mockResolvedValue({ id: 'b1' });
    prisma.$transaction.mockResolvedValue([
      1,
      [
        {
          id: 'o1',
          orderNumber: 'ORD-00001',
          status: OrderStatus.PENDING,
          totalAmount: 100,
          currency: 'PKR',
          notes: null,
          deliveryAddress: null,
          source: 'whatsapp-n8n',
          whatsappMsgId: null,
          confirmedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          businessId: 'b1',
          customerId: 'c1',
          customer: { id: 'c1', name: 'A', phone: '+92300' },
          business: {
            id: 'b1',
            name: 'ABC',
            companyName: 'ABC',
            slug: 'abc',
            whatsappNumber: null,
          },
          items: [],
        },
      ],
    ]);

    const result = await service.listBusinessOrders('b1', {
      status: OrderStatus.PENDING,
      page: 1,
      pageSize: 50,
    });
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('o1');
  });

  it('resolves business by metaPhoneNumberId', async () => {
    prisma.business.findUnique.mockResolvedValue({
      id: 'cmsn4guam0000v9w0n3npytin',
      name: 'My Business',
      companyName: 'ABC Garments',
      whatsappNumber: '+923134996633',
      metaPhoneNumberId: '123456789',
    });

    const result = await service.findByWhatsAppPhoneNumberId('123456789');
    expect(result).toEqual({
      businessId: 'cmsn4guam0000v9w0n3npytin',
      companyName: 'ABC Garments',
      whatsappNumber: '+923134996633',
      phoneNumberId: '123456789',
    });
    expect(prisma.whatsAppAccount.findUnique).not.toHaveBeenCalled();
  });

  it('falls back to WhatsAppAccount.phoneNumberId', async () => {
    prisma.business.findUnique.mockResolvedValue(null);
    prisma.whatsAppAccount.findUnique.mockResolvedValue({
      phoneNumberId: '999888777',
      displayPhoneNumber: '+923001112233',
      business: {
        id: 'biz-wa',
        name: 'Shop',
        companyName: null,
        whatsappNumber: '+923001112233',
        metaPhoneNumberId: null,
      },
    });

    const result = await service.findByWhatsAppPhoneNumberId('999888777');
    expect(result.businessId).toBe('biz-wa');
    expect(result.companyName).toBe('Shop');
    expect(result.phoneNumberId).toBe('999888777');
  });

  it('returns 404 when phone_number_id is unknown', async () => {
    prisma.business.findUnique.mockResolvedValue(null);
    prisma.whatsAppAccount.findUnique.mockResolvedValue(null);

    await expect(
      service.findByWhatsAppPhoneNumberId('missing-phone-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.findByWhatsAppPhoneNumberId('missing-phone-id'),
    ).rejects.toThrow(
      'Business WhatsApp number is not connected to any business.',
    );
  });

  it('maps distinct phone_number_ids to distinct businesses', async () => {
    prisma.business.findUnique
      .mockResolvedValueOnce({
        id: 'biz-a',
        name: 'A',
        companyName: 'Alpha',
        whatsappNumber: '+92111',
        metaPhoneNumberId: 'phone-a',
      })
      .mockResolvedValueOnce({
        id: 'biz-b',
        name: 'B',
        companyName: 'Beta',
        whatsappNumber: '+92222',
        metaPhoneNumberId: 'phone-b',
      });

    const a = await service.findByWhatsAppPhoneNumberId('phone-a');
    const b = await service.findByWhatsAppPhoneNumberId('phone-b');
    expect(a.businessId).toBe('biz-a');
    expect(b.businessId).toBe('biz-b');
    expect(a.businessId).not.toBe(b.businessId);
  });
});
