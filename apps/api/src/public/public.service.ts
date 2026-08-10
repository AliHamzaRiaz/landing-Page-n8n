import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, OrderStatus } from '@prisma/client';
import { hashVendorToken } from '../common/crypto/vendor-token';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getBusinessOrderPage(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: {
        name: true,
        companyName: true,
        whatsappNumber: true,
        phone: true,
        slug: true,
        onboardingCompleted: true,
      },
    });

    if (!business || !business.onboardingCompleted) {
      throw new NotFoundException('This order page is not available');
    }

    const displayName = business.companyName || business.name;
    const wa = (business.whatsappNumber || business.phone || '').replace(
      /\D/g,
      '',
    );

    return {
      data: {
        businessName: displayName,
        slug: business.slug,
        whatsappNumber: business.whatsappNumber || business.phone,
        whatsappUrl: wa
          ? `https://wa.me/${wa}?text=${encodeURIComponent(
              `Hi, I want to place an order with ${displayName}.`,
            )}`
          : null,
      },
    };
  }

  private async resolveVendorAccess(token: string) {
    const tokenHash = hashVendorToken(token);
    const access = await this.prisma.vendorAccess.findUnique({
      where: { tokenHash },
      include: {
        vendor: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                companyName: true,
                vendorPortalEnabled: true,
              },
            },
          },
        },
      },
    });

    if (
      !access ||
      access.revokedAt ||
      (access.expiresAt && access.expiresAt.getTime() < Date.now()) ||
      !access.vendor.isActive ||
      !access.vendor.business.vendorPortalEnabled
    ) {
      throw new ForbiddenException('This vendor link is invalid or expired');
    }

    return access;
  }

  async getVendorPortal(token: string) {
    const access = await this.resolveVendorAccess(token);
    const businessId = access.vendor.businessId;

    const orders = await this.prisma.order.findMany({
      where: {
        businessId,
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
          ],
        },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      data: {
        businessName:
          access.vendor.business.companyName || access.vendor.business.name,
        vendorName: access.vendor.name,
        orders,
      },
    };
  }

  async markDispatched(token: string, orderId: string) {
    const access = await this.resolveVendorAccess(token);
    const businessId = access.vendor.businessId;

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, businessId },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (
      order.status === OrderStatus.DISPATCHED ||
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new ForbiddenException('This order cannot be dispatched');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DISPATCHED },
      include: {
        customer: { select: { name: true, phone: true } },
        items: true,
      },
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: OrderStatus.DISPATCHED,
        changedBy: `vendor:${access.vendor.id}`,
        note: 'Marked as dispatched by warehouse team',
      },
    });

    await this.notifications.create(businessId, {
      type: NotificationType.SYSTEM,
      title: 'Order dispatched',
      message: `Order ${order.orderNumber} was marked as dispatched`,
      metadata: { orderId },
    });

    return {
      message: 'Order marked as dispatched',
      data: updated,
    };
  }
}
