import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  const prisma = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  it('findAll scopes to businessId', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    await service.findAll('biz-a');
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { businessId: 'biz-a' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findOne rejects products from another tenant', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(service.findOne('p1', 'biz-a')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.product.findFirst).toHaveBeenCalledWith({
      where: { id: 'p1', businessId: 'biz-a' },
    });
  });

  it('update requires ownership by businessId', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(
      service.update('p1', 'biz-a', { name: 'New' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
