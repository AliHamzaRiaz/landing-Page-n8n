import {
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessageDirection,
  NotificationType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { CustomersService } from '../customers/customers.service';
import { N8nService } from '../n8n/n8n.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderIntakeService } from '../orders/order-intake.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

interface WhatsAppWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{
          wa_id?: string;
          profile?: { name?: string };
        }>;
        messages?: Array<{
          id?: string;
          from?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
        }>;
        statuses?: unknown[];
      };
      field?: string;
    }>;
  }>;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly n8nService: N8nService,
    private readonly whatsappService: WhatsAppService,
    private readonly notifications: NotificationsService,
    private readonly orderIntake: OrderIntakeService,
  ) {}

  verifyChallenge(
    mode?: string,
    token?: string,
    challenge?: string,
  ): string {
    const expected = this.config.getOrThrow<string>('META_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expected && challenge) {
      return challenge;
    }
    throw new ForbiddenException('Webhook verification failed');
  }

  verifySignature(rawBody: Buffer | string | undefined, signature?: string) {
    const appSecret = this.config.get<string>('META_APP_SECRET');
    if (!appSecret) {
      this.logger.warn(
        'META_APP_SECRET not set — skipping X-Hub-Signature-256 verification',
      );
      return;
    }
    if (!signature || !rawBody) {
      throw new ForbiddenException('Missing webhook signature');
    }
    const expected =
      'sha256=' +
      createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ForbiddenException('Invalid webhook signature');
    }
  }

  async handleIncoming(payload: WhatsAppWebhookPayload) {
    if (payload.object !== 'whatsapp_business_account') {
      return { processed: 0 };
    }

    let processed = 0;

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value?.messages?.length) continue;

        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        // Prefer Business.metaPhoneNumberId, fall back to WhatsAppAccount
        let businessId: string | null = null;
        const byBusiness = await this.prisma.business.findFirst({
          where: { metaPhoneNumberId: phoneNumberId },
          select: { id: true },
        });
        if (byBusiness) {
          businessId = byBusiness.id;
        } else {
          const account =
            await this.whatsappService.findBusinessByPhoneNumberId(
              phoneNumberId,
            );
          if (account) {
            businessId = account.businessId;
            await this.prisma.whatsAppAccount.update({
              where: { id: account.id },
              data: { lastWebhookAt: new Date() },
            });
            await this.prisma.business.update({
              where: { id: businessId },
              data: { metaPhoneNumberId: phoneNumberId },
            });
          }
        }

        if (!businessId) {
          this.logger.warn(
            `No business mapped for phone_number_id=${phoneNumberId}`,
          );
          continue;
        }

        for (const message of value.messages) {
          if (!message.from || !message.id) continue;
          const body =
            message.type === 'text'
              ? message.text?.body?.trim() || ''
              : `[${message.type || 'unsupported'} message]`;

          const existing = await this.prisma.whatsAppMessage.findUnique({
            where: { waMessageId: message.id },
          });
          if (existing) continue;

          const contactName = value.contacts?.[0]?.profile?.name;
          const customer = await this.customersService.findOrCreateByPhone(
            businessId,
            message.from,
            contactName,
          );

          await this.prisma.whatsAppMessage.create({
            data: {
              businessId,
              customerId: customer.id,
              waMessageId: message.id,
              direction: MessageDirection.INBOUND,
              fromPhone: message.from,
              toPhone: value.metadata?.display_phone_number,
              body,
              rawPayload: message as unknown as Prisma.InputJsonValue,
            },
          });

          processed += 1;
          await this.processCustomerMessage({
            businessId,
            customerId: customer.id,
            customerPhone: customer.phone,
            customerName: customer.name,
            body,
            waMessageId: message.id,
          });
        }
      }
    }

    return { processed };
  }

  private async processCustomerMessage(params: {
    businessId: string;
    customerId: string;
    customerPhone: string;
    customerName?: string | null;
    body: string;
    waMessageId: string;
  }) {
    const normalized = params.body.trim().toUpperCase();

    if (normalized === 'CONFIRM' || normalized === 'YES') {
      const pending = await this.prisma.order.findFirst({
        where: {
          businessId: params.businessId,
          customerId: params.customerId,
          status: OrderStatus.PENDING,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (pending) {
        await this.prisma.order.update({
          where: { id: pending.id },
          data: {
            status: OrderStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
        });
        await this.prisma.orderStatusHistory.create({
          data: {
            orderId: pending.id,
            status: OrderStatus.CONFIRMED,
            changedBy: 'customer',
          },
        });

        await this.notifications.create(params.businessId, {
          type: NotificationType.ORDER_CONFIRMED,
          title: 'Order confirmed via WhatsApp',
          message: `Order ${pending.orderNumber} confirmed by customer`,
          metadata: { orderId: pending.id },
        });

        await this.whatsappService
          .sendText(
            params.businessId,
            params.customerPhone,
            `Order ${pending.orderNumber} is confirmed. Thank you!`,
          )
          .catch(() => undefined);
      }
      return;
    }

    const products = await this.prisma.product.findMany({
      where: { businessId: params.businessId, isActive: true },
      select: { id: true, name: true, sku: true, price: true },
      take: 100,
    });

    const catalog = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: Number(p.price),
    }));

    const result = await this.n8nService.triggerWorkflow({
      businessId: params.businessId,
      customerPhone: params.customerPhone,
      customerName: params.customerName,
      messageBody: params.body,
      waMessageId: params.waMessageId,
      products: catalog,
    });

    if (result.status === 'SUCCESS') {
      return;
    }

    // Fallback when n8n is down / not configured: local catalog parser
    const items = this.orderIntake.parseMessageAgainstCatalog(
      params.body,
      catalog,
    );
    if (items?.length) {
      this.logger.warn(
        `n8n unavailable (${result.status}). Creating order via local parser.`,
      );
      await this.orderIntake.createFromWhatsApp({
        businessId: params.businessId,
        customerPhone: params.customerPhone,
        customerName: params.customerName,
        items,
        waMessageId: params.waMessageId,
        notes: params.body,
        source: 'whatsapp-local-parser',
      });
      return;
    }

    await this.notifications.create(params.businessId, {
      type: NotificationType.AUTOMATION_FAILED,
      title: 'Could not process WhatsApp message',
      message:
        result.error ||
        'We received a WhatsApp message but could not extract an order.',
      metadata: { executionId: result.executionId, body: params.body },
    });

    await this.whatsappService
      .sendText(
        params.businessId,
        params.customerPhone,
        'Sorry, we could not understand your order. Please include product name and quantity (example: 2 Black Kurta).',
      )
      .catch(() => undefined);
  }
}
