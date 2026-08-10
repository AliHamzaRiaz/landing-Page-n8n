import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

const ORDER_INCLUDE = {
  customer: {
    select: { id: true, name: true, phone: true, email: true },
  },
  items: true,
  statusHistory: {
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(businessId: string, query: ListOrdersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.OrderWhereInput = { businessId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { notes: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
        { customer: { phone: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        const end = new Date(query.to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput =
      query.sort === 'createdAt_asc'
        ? { createdAt: 'asc' }
        : query.sort === 'amount_desc'
          ? { totalAmount: 'desc' }
          : query.sort === 'amount_asc'
            ? { totalAmount: 'asc' }
            : { createdAt: 'desc' };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: {
        items: orders,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async findOne(id: string, businessId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, businessId },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return { data: order };
  }

  async create(businessId: string, dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, businessId },
    });
    if (!customer) {
      throw new BadRequestException('Customer not found for this business');
    }

    if (!dto.items?.length) {
      throw new BadRequestException('Order must include at least one item');
    }

    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const orderNumber = await this.nextOrderNumber(businessId);

    const order = await this.prisma.order.create({
      data: {
        businessId,
        customerId: customer.id,
        orderNumber,
        status: OrderStatus.PENDING,
        totalAmount: new Prisma.Decimal(totalAmount),
        notes: dto.notes?.trim(),
        source: dto.source?.trim() || 'manual',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            name: item.name.trim(),
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
          })),
        },
        statusHistory: {
          create: [{ status: OrderStatus.PENDING, changedBy: 'system' }],
        },
      },
      include: ORDER_INCLUDE,
    });

    await this.notifications.create(businessId, {
      type: 'NEW_ORDER',
      title: 'New order received',
      message: `Order ${order.orderNumber} was created`,
      metadata: { orderId: order.id },
    });

    return { message: 'Order created', data: order };
  }

  async update(id: string, businessId: string, dto: UpdateOrderDto) {
    const existing = await this.prisma.order.findFirst({
      where: { id, businessId },
    });
    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    if (dto.status) {
      this.assertValidTransition(existing.status, dto.status);
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes?.trim(),
        confirmedAt:
          dto.status === OrderStatus.CONFIRMED && !existing.confirmedAt
            ? new Date()
            : undefined,
        statusHistory: dto.status
          ? {
              create: [
                {
                  status: dto.status,
                  changedBy: 'owner',
                },
              ],
            }
          : undefined,
      },
      include: ORDER_INCLUDE,
    });

    if (dto.status === OrderStatus.CONFIRMED) {
      await this.notifications.create(businessId, {
        type: 'ORDER_CONFIRMED',
        title: 'Order confirmed',
        message: `Order ${order.orderNumber} was confirmed`,
        metadata: { orderId: order.id },
      });
    }

    if (dto.status === OrderStatus.CANCELLED) {
      await this.notifications.create(businessId, {
        type: 'ORDER_CANCELLED',
        title: 'Order cancelled',
        message: `Order ${order.orderNumber} was cancelled`,
        metadata: { orderId: order.id },
      });
    }

    return { message: 'Order updated', data: order };
  }

  async remove(id: string, businessId: string) {
    const existing = await this.prisma.order.findFirst({
      where: { id, businessId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.order.delete({ where: { id } });
    return { message: 'Order deleted', data: null };
  }

  assertValidTransition(from: OrderStatus, to: OrderStatus) {
    if (from === to) return;

    const allowed: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.CANCELLED,
      ],
      CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      PROCESSING: [
        OrderStatus.DISPATCHED,
        OrderStatus.SHIPPED,
        OrderStatus.CANCELLED,
      ],
      DISPATCHED: [OrderStatus.DELIVERED],
      SHIPPED: [OrderStatus.DELIVERED, OrderStatus.DISPATCHED],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!allowed[from].includes(to)) {
      throw new BadRequestException(
        `Cannot change order status from ${from} to ${to}`,
      );
    }
  }

  private async nextOrderNumber(businessId: string) {
    const count = await this.prisma.order.count({ where: { businessId } });
    const seq = String(count + 1).padStart(5, '0');
    return `ORD-${seq}`;
  }
}
