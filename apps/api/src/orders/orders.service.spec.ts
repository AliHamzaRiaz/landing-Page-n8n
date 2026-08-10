import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: {} },
        {
          provide: NotificationsService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it('allows PENDING -> CONFIRMED', () => {
    expect(() =>
      service.assertValidTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
      ),
    ).not.toThrow();
  });

  it('blocks DELIVERED -> CANCELLED', () => {
    expect(() =>
      service.assertValidTransition(
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ),
    ).toThrow(BadRequestException);
  });

  it('blocks CANCELLED -> PROCESSING', () => {
    expect(() =>
      service.assertValidTransition(
        OrderStatus.CANCELLED,
        OrderStatus.PROCESSING,
      ),
    ).toThrow(BadRequestException);
  });
});
