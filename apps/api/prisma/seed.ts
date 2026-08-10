import {
  NotificationType,
  OrderStatus,
  PrismaClient,
  UserRole,
  WhatsAppConnectionStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { createCipheriv, createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();
const DEMO_VENDOR_TOKEN = 'demo-vendor-token-ennitant';

function encryptSecret(plaintext: string, secret: string): string {
  const key = /^[0-9a-fA-F]{64}$/.test(secret.trim())
    ? Buffer.from(secret.trim(), 'hex')
    : createHash('sha256').update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function main() {
  const phoneNumber = '+923001234567';
  const password = 'Demo1234!';
  const encryptionSecret =
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'local-dev-encryption-secret';

  await prisma.orderStatusHistory.deleteMany();
  await prisma.vendorAccess.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.workflowExecution.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.whatsAppAccount.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  const business = await prisma.business.create({
    data: {
      name: 'Demo Fashion',
      companyName: 'Demo Fashion',
      slug: 'demo-fashion',
      ownerName: 'Demo Owner',
      industry: 'Fashion & Apparel',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      phone: phoneNumber,
      whatsappNumber: phoneNumber,
      whatsappVerified: true,
      vendorPortalEnabled: true,
      onboardingCompleted: true,
    },
  });

  const passwordHash = await argon2.hash(password);
  await prisma.user.create({
    data: {
      phoneNumber,
      passwordHash,
      firstName: 'Demo',
      lastName: 'Owner',
      role: UserRole.OWNER,
      isVerified: true,
      businessId: business.id,
    },
  });

  const vendor = await prisma.vendor.create({
    data: {
      businessId: business.id,
      name: 'Main Warehouse',
      phoneNumber: '+923009876543',
      isActive: true,
    },
  });

  await prisma.vendorAccess.create({
    data: {
      vendorId: vendor.id,
      tokenHash: hashToken(DEMO_VENDOR_TOKEN),
      tokenEncrypted: encryptSecret(DEMO_VENDOR_TOKEN, encryptionSecret),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const products = await Promise.all([
    prisma.product.create({
      data: {
        businessId: business.id,
        name: 'Black Kurta',
        description: 'Classic black kurta',
        sku: 'KUR-BLK',
        price: 2000,
        stock: 50,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: 'White Shirt',
        description: 'Cotton white shirt',
        sku: 'SHT-WHT',
        price: 1500,
        stock: 40,
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        name: 'Blue Jeans',
        description: 'Slim fit jeans',
        sku: 'JNS-BLU',
        price: 3500,
        stock: 30,
      },
    }),
  ]);

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: 'Ali Ahmed',
        phone: '923111111111',
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: 'Sara Khan',
        phone: '923222222222',
      },
    }),
  ]);

  const order1 = await prisma.order.create({
    data: {
      businessId: business.id,
      customerId: customers[0].id,
      orderNumber: 'ORD-1001',
      status: OrderStatus.PENDING,
      totalAmount: 4000,
      deliveryAddress: 'Lahore',
      items: {
        create: [
          {
            productId: products[0].id,
            name: products[0].name,
            quantity: 2,
            unitPrice: 2000,
            totalPrice: 4000,
          },
        ],
      },
      statusHistory: {
        create: [{ status: OrderStatus.PENDING, changedBy: 'system' }],
      },
    },
  });

  await prisma.order.create({
    data: {
      businessId: business.id,
      customerId: customers[1].id,
      orderNumber: 'ORD-1002',
      status: OrderStatus.PROCESSING,
      totalAmount: 1500,
      items: {
        create: [
          {
            productId: products[1].id,
            name: products[1].name,
            quantity: 1,
            unitPrice: 1500,
            totalPrice: 1500,
          },
        ],
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING, changedBy: 'system' },
          { status: OrderStatus.CONFIRMED, changedBy: 'system' },
          { status: OrderStatus.PROCESSING, changedBy: 'system' },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      businessId: business.id,
      customerId: customers[0].id,
      orderNumber: 'ORD-1003',
      status: OrderStatus.DISPATCHED,
      totalAmount: 3500,
      items: {
        create: [
          {
            productId: products[2].id,
            name: products[2].name,
            quantity: 1,
            unitPrice: 3500,
            totalPrice: 3500,
          },
        ],
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING, changedBy: 'system' },
          { status: OrderStatus.DISPATCHED, changedBy: 'vendor' },
        ],
      },
    },
  });

  await prisma.whatsAppAccount.create({
    data: {
      businessId: business.id,
      phoneNumberId: 'demo-phone-id',
      displayPhoneNumber: phoneNumber,
      accessTokenEncrypted: encryptSecret('demo-token', encryptionSecret),
      status: WhatsAppConnectionStatus.CONNECTED,
      connectedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      businessId: business.id,
      type: NotificationType.NEW_ORDER,
      title: 'New order received',
      message: `Order ${order1.orderNumber} from Ali Ahmed`,
    },
  });

  console.log('Seed complete');
  console.log(`Demo login: ${phoneNumber} / ${password}`);
  console.log('Customer link: /order/demo-fashion');
  console.log('Vendor link: /vendor/demo-vendor-token-ennitant');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
