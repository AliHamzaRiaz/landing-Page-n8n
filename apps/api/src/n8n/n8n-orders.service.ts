import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { N8nListOrdersDto } from './dto/n8n-list-orders.dto';

const ORDER_INCLUDE = {
  customer: {
    select: { id: true, name: true, phone: true },
  },
  business: {
    select: {
      id: true,
      name: true,
      companyName: true,
      slug: true,
      whatsappNumber: true,
    },
  },
  items: {
    select: {
      id: true,
      productId: true,
      name: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
    },
  },
} as const;

@Injectable()
export class N8nOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  presentOrder(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: Prisma.Decimal | number | string;
    currency: string;
    notes: string | null;
    deliveryAddress: string | null;
    source: string;
    whatsappMsgId: string | null;
    confirmedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    businessId: string;
    customerId: string;
    customer?: { id: string; name: string | null; phone: string } | null;
    business?: {
      id: string;
      name: string;
      companyName: string | null;
      slug: string;
      whatsappNumber: string | null;
    } | null;
    items?: Array<{
      id: string;
      productId: string | null;
      name: string;
      quantity: number;
      unitPrice: Prisma.Decimal | number | string;
      totalPrice: Prisma.Decimal | number | string;
    }>;
  }) {
    const items = order.items ?? [];
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      notes: order.notes,
      deliveryAddress: order.deliveryAddress,
      address: order.deliveryAddress,
      quantity,
      source: order.source,
      whatsappMsgId: order.whatsappMsgId,
      confirmedAt: order.confirmedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      businessId: order.businessId,
      business: order.business
        ? {
            id: order.business.id,
            name: order.business.companyName || order.business.name,
            companyName: order.business.companyName || order.business.name,
            slug: order.business.slug,
            whatsappNumber: order.business.whatsappNumber,
          }
        : { id: order.businessId },
      customer: order.customer
        ? {
            id: order.customer.id,
            name: order.customer.name,
            phone: order.customer.phone,
          }
        : { id: order.customerId, name: null, phone: null },
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    };
  }

  async assertBusinessExists(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  /**
   * n8n may send Prisma id, orderNumber (ORD-00001), or a prefixed ref
   * (e.g. confirm_ORD-00001). Resolve to the internal Order.id.
   */
  async resolveOrderId(orderRef: string): Promise<string> {
    const ref = orderRef?.trim();
    if (!ref) {
      throw new BadRequestException('orderId is required');
    }

    const byId = await this.prisma.order.findUnique({
      where: { id: ref },
      select: { id: true },
    });
    if (byId) return byId.id;

    const candidates = new Set<string>([ref]);
    const ordMatch = ref.match(/ORD-[A-Za-z0-9_-]+/i);
    if (ordMatch) {
      candidates.add(ordMatch[0]);
      candidates.add(ordMatch[0].toUpperCase());
    }

    for (const orderNumber of candidates) {
      const byNumber = await this.prisma.order.findFirst({
        where: { orderNumber: { equals: orderNumber, mode: 'insensitive' } },
        select: { id: true },
      });
      if (byNumber) return byNumber.id;
    }

    throw new NotFoundException('Order not found');
  }

  /**
   * Resolve owning business from Meta WhatsApp Cloud API phone_number_id.
   * Prefers Business.metaPhoneNumberId, then WhatsAppAccount.phoneNumberId.
   * Never uses the customer WhatsApp `from` number.
   */
  async findByWhatsAppPhoneNumberId(phoneNumberId: string) {
    const id = phoneNumberId?.trim();
    if (!id) {
      throw new BadRequestException('phoneNumberId is required');
    }

    const byMeta = await this.prisma.business.findUnique({
      where: { metaPhoneNumberId: id },
      select: {
        id: true,
        name: true,
        companyName: true,
        whatsappNumber: true,
        metaPhoneNumberId: true,
      },
    });

    if (byMeta) {
      return {
        businessId: byMeta.id,
        companyName: byMeta.companyName || byMeta.name,
        whatsappNumber: byMeta.whatsappNumber,
        phoneNumberId: byMeta.metaPhoneNumberId || id,
      };
    }

    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { phoneNumberId: id },
      select: {
        phoneNumberId: true,
        displayPhoneNumber: true,
        business: {
          select: {
            id: true,
            name: true,
            companyName: true,
            whatsappNumber: true,
            metaPhoneNumberId: true,
          },
        },
      },
    });

    if (!account?.business) {
      throw new NotFoundException(
        'Business WhatsApp number is not connected to any business.',
      );
    }

    return {
      businessId: account.business.id,
      companyName: account.business.companyName || account.business.name,
      whatsappNumber:
        account.business.whatsappNumber || account.displayPhoneNumber || null,
      phoneNumberId: account.phoneNumberId,
    };
  }

  async getOrder(orderId: string) {
    const id = await this.resolveOrderId(orderId);
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.presentOrder(order);
  }

  async listBusinessOrders(businessId: string, query: N8nListOrdersDto) {
    await this.assertBusinessExists(businessId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where: Prisma.OrderWhereInput = { businessId };

    if (query.status) where.status = query.status;
    if (query.orderNumber?.trim()) {
      where.orderNumber = {
        equals: query.orderNumber.trim(),
        mode: 'insensitive',
      };
    }
    if (query.customerPhone?.trim()) {
      const phone = query.customerPhone.trim();
      where.customer = {
        phone: { contains: phone.replace(/[^\d+]/g, '') || phone },
      };
    }

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: orders.map((order) => this.presentOrder(order)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const id = await this.resolveOrderId(orderId);
    const existing = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, confirmedAt: true, businessId: true },
    });
    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    try {
      this.ordersService.assertValidTransition(existing.status, status);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Cannot change order status from ${existing.status} to ${status}`,
      );
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        confirmedAt:
          status === OrderStatus.CONFIRMED && !existing.confirmedAt
            ? new Date()
            : undefined,
        statusHistory: {
          create: [{ status, changedBy: 'n8n' }],
        },
      },
      include: ORDER_INCLUDE,
    });

    return this.presentOrder(order);
  }
}
