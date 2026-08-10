import { Injectable } from '@nestjs/common';
import { NotificationType, OrderStatus, Prisma } from '@prisma/client';
import { CustomersService } from '../customers/customers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

export interface IntakeItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

@Injectable()
export class OrderIntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customers: CustomersService,
    private readonly notifications: NotificationsService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  async createFromWhatsApp(params: {
    businessId: string;
    customerPhone: string;
    customerName?: string | null;
    items: IntakeItem[];
    notes?: string;
    deliveryAddress?: string;
    waMessageId?: string;
    source?: string;
  }) {
    if (!params.items.length) {
      throw new Error('Order requires at least one item');
    }

    const customer = await this.customers.findOrCreateByPhone(
      params.businessId,
      params.customerPhone,
      params.customerName ?? undefined,
    );

    const totalAmount = params.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const count = await this.prisma.order.count({
      where: { businessId: params.businessId },
    });
    const orderNumber = `ORD-${String(count + 1).padStart(5, '0')}`;

    const order = await this.prisma.order.create({
      data: {
        businessId: params.businessId,
        customerId: customer.id,
        orderNumber,
        status: OrderStatus.PENDING,
        totalAmount: new Prisma.Decimal(totalAmount),
        notes: params.notes,
        deliveryAddress: params.deliveryAddress,
        source: params.source || 'whatsapp',
        whatsappMsgId: params.waMessageId,
        items: {
          create: params.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
          })),
        },
        statusHistory: {
          create: [{ status: OrderStatus.PENDING, changedBy: 'system' }],
        },
      },
      include: { items: true, customer: true },
    });

    await this.notifications.create(params.businessId, {
      type: NotificationType.NEW_ORDER,
      title: 'New WhatsApp order',
      message: `Order ${order.orderNumber} created from WhatsApp`,
      metadata: { orderId: order.id },
    });

    const itemLines = order.items
      .map((i) => `• ${i.name} x${i.quantity}`)
      .join('\n');
    const confirmation = [
      `Thanks${customer.name ? ` ${customer.name}` : ''}! We received your order ${order.orderNumber}.`,
      itemLines,
      `Total: ${Number(order.totalAmount).toFixed(2)} ${order.currency}`,
      'Reply CONFIRM to confirm this order.',
    ].join('\n');

    try {
      await this.whatsapp.sendText(
        params.businessId,
        customer.phone,
        confirmation,
      );
    } catch {
      // Order saved even if WhatsApp send fails
    }

    return order;
  }

  /**
   * Simple catalog matcher used when n8n is unavailable.
   * Example: "2 black kurtas" → product Black Kurta qty 2
   */
  parseMessageAgainstCatalog(
    message: string,
    products: Array<{ id: string; name: string; sku: string | null; price: number }>,
  ): IntakeItem[] | null {
    const text = message.toLowerCase();
    const qtyMatch = text.match(/(\d+)\s*(x|pcs|piece|pieces)?/);
    const quantity = qtyMatch ? Math.max(1, Number(qtyMatch[1])) : 1;

    const matched = products.find((p) => {
      const name = p.name.toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      return (
        (name && text.includes(name)) ||
        (sku && text.includes(sku)) ||
        name.split(/\s+/).every((part) => part.length < 3 || text.includes(part))
      );
    });

    if (!matched) {
      // Fuzzy: any product word hits
      const fuzzy = products.find((p) =>
        p.name
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3)
          .some((w) => text.includes(w)),
      );
      if (!fuzzy) return null;
      return [
        {
          productId: fuzzy.id,
          name: fuzzy.name,
          quantity,
          unitPrice: fuzzy.price,
        },
      ];
    }

    return [
      {
        productId: matched.id,
        name: matched.name,
        quantity,
        unitPrice: matched.price,
      },
    ];
  }
}
