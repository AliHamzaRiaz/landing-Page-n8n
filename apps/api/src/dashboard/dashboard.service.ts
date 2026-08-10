import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import {
  decryptVendorToken,
  encryptVendorToken,
  generateVendorToken,
  hashVendorToken,
} from '../common/crypto/vendor-token';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private encryptionSecret() {
    return (
      this.config.get<string>('ENCRYPTION_KEY') ||
      this.config.getOrThrow<string>('JWT_SECRET')
    );
  }

  async getStats(businessId: string) {
    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    ).replace(/\/$/, '');

    const [
      business,
      newOrders,
      pending,
      dispatched,
      delivered,
      recentOrders,
    ] = await Promise.all([
      this.prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
      this.prisma.order.count({
        where: { businessId, status: OrderStatus.PENDING },
      }),
      this.prisma.order.count({
        where: {
          businessId,
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING] },
        },
      }),
      this.prisma.order.count({
        where: {
          businessId,
          status: { in: [OrderStatus.DISPATCHED, OrderStatus.SHIPPED] },
        },
      }),
      this.prisma.order.count({
        where: { businessId, status: OrderStatus.DELIVERED },
      }),
      this.prisma.order.findMany({
        where: { businessId },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const vendorLink = await this.ensureVendorLink(businessId);

    return {
      data: {
        companyName: business.companyName || business.name,
        newOrders,
        pending,
        dispatched,
        delivered,
        recentOrders,
        customerOrderLink: `${frontendUrl}/order/${business.slug}`,
        vendorDispatchLink: `${frontendUrl}/vendor/${vendorLink}`,
        currency: business.currency,
      },
    };
  }

  private async ensureVendorLink(businessId: string) {
    let vendor = await this.prisma.vendor.findFirst({
      where: { businessId, isActive: true },
      include: {
        accessTokens: {
          where: { revokedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!vendor) {
      vendor = await this.prisma.vendor.create({
        data: {
          businessId,
          name: 'Warehouse Team',
          isActive: true,
        },
        include: { accessTokens: true },
      });
    }

    const existing = vendor.accessTokens[0];
    if (
      existing &&
      (!existing.expiresAt || existing.expiresAt.getTime() > Date.now())
    ) {
      try {
        return decryptVendorToken(
          existing.tokenEncrypted,
          this.encryptionSecret(),
        );
      } catch {
        // Fall through and regenerate if ciphertext is legacy/plain
      }
    }

    const token = generateVendorToken();
    await this.prisma.vendorAccess.create({
      data: {
        vendorId: vendor.id,
        tokenHash: hashVendorToken(token),
        tokenEncrypted: encryptVendorToken(token, this.encryptionSecret()),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    return token;
  }
}
