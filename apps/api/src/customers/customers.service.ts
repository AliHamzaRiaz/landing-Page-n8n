import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(businessId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { businessId },
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: {
            totalAmount: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: customers.map((c) => {
        const totalSpent = c.orders
          .filter((o) => o.status !== 'CANCELLED')
          .reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const lastOrder = c.orders[0]?.createdAt ?? null;
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          notes: c.notes,
          orderCount: c._count.orders,
          totalSpent,
          lastOrder,
          status: c._count.orders > 0 ? 'active' : 'new',
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        };
      }),
    };
  }

  async findOne(id: string, businessId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
      include: {
        orders: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const totalSpent = customer.orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return {
      data: {
        ...customer,
        orderCount: customer.orders.length,
        totalSpent,
        lastOrder: customer.orders[0]?.createdAt ?? null,
      },
    };
  }

  async findOrCreateByPhone(
    businessId: string,
    phone: string,
    name?: string,
  ) {
    const normalized = phone.replace(/\D/g, '');
    const existing = await this.prisma.customer.findFirst({
      where: {
        businessId,
        OR: [{ phone }, { phone: normalized }, { phone: `+${normalized}` }],
      },
    });

    if (existing) {
      if (name && !existing.name) {
        return this.prisma.customer.update({
          where: { id: existing.id },
          data: { name },
        });
      }
      return existing;
    }

    return this.prisma.customer.create({
      data: {
        businessId,
        phone: normalized || phone,
        name,
      },
    });
  }
}
