import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { N8nOrdersService } from './n8n-orders.service';

describe('N8nOrdersService', () => {
  let service: N8nOrdersService;

  const prisma = {
    business: { findUnique: jest.fn() },
    order: {
      findUnique: jest.fn(),
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
    prisma.order.findUnique.mockResolvedValue({
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
    await expect(service.getOrder('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updateStatus writes history via n8n actor', async () => {
    prisma.order.findUnique.mockResolvedValue({
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
});
