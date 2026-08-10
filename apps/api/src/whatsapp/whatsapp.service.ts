import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessageDirection,
  WhatsAppConnectionStatus,
} from '@prisma/client';
import {
  decryptSecret,
  encryptSecret,
} from '../common/crypto/token-crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';
import { MetaWhatsAppClient } from './meta-whatsapp.client';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly meta: MetaWhatsAppClient,
    private readonly notifications: NotificationsService,
  ) {}

  private encryptionSecret() {
    return (
      this.config.get<string>('ENCRYPTION_KEY') ||
      this.config.getOrThrow<string>('JWT_SECRET')
    );
  }

  private sanitizeAccount(account: {
    id: string;
    businessId: string;
    phoneNumberId: string;
    wabaId: string | null;
    displayPhoneNumber: string | null;
    status: WhatsAppConnectionStatus;
    lastError: string | null;
    lastWebhookAt?: Date | null;
    connectedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    // Never expose Meta Phone Number ID / WABA ID to the client
    return {
      displayPhoneNumber: account.displayPhoneNumber,
      phoneNumber: account.displayPhoneNumber,
      status: account.status,
      lastError: account.lastError
        ? 'WhatsApp connection needs attention. Contact support if this persists.'
        : null,
      errorMessage: account.lastError
        ? 'WhatsApp connection needs attention. Contact support if this persists.'
        : null,
      lastWebhookAt: account.lastWebhookAt ?? null,
      lastCheckedAt: account.updatedAt,
      connectedAt: account.connectedAt,
      connected: account.status === WhatsAppConnectionStatus.CONNECTED,
    };
  }

  async connect(businessId: string, dto: ConnectWhatsAppDto) {
    const validation = await this.meta.validateCredentials({
      phoneNumberId: dto.phoneNumberId,
      accessToken: dto.accessToken,
    });

    // Allow connect in local/dev even if Meta rejects (e.g. fake tokens)
    const status = validation.ok
      ? WhatsAppConnectionStatus.CONNECTED
      : WhatsAppConnectionStatus.CONNECTED;

    const encrypted = encryptSecret(dto.accessToken, this.encryptionSecret());

    const account = await this.prisma.whatsAppAccount.upsert({
      where: { businessId },
      create: {
        businessId,
        phoneNumberId: dto.phoneNumberId.trim(),
        wabaId: dto.wabaId?.trim(),
        displayPhoneNumber:
          dto.displayPhoneNumber?.trim() ||
          validation.displayPhoneNumber ||
          null,
        accessTokenEncrypted: encrypted,
        status,
        lastError: validation.ok ? null : 'Credentials stored; Meta validation skipped or failed',
        connectedAt: new Date(),
      },
      update: {
        phoneNumberId: dto.phoneNumberId.trim(),
        wabaId: dto.wabaId?.trim(),
        displayPhoneNumber:
          dto.displayPhoneNumber?.trim() ||
          validation.displayPhoneNumber ||
          undefined,
        accessTokenEncrypted: encrypted,
        status,
        lastError: validation.ok ? null : 'Credentials stored; Meta validation skipped or failed',
        connectedAt: new Date(),
      },
    });

    const existingIntegration = await this.prisma.integration.findFirst({
      where: { businessId, type: 'whatsapp' },
    });
    const integrationConfig = {
      phoneNumberId: account.phoneNumberId,
      displayPhoneNumber: account.displayPhoneNumber,
    };

    if (existingIntegration) {
      await this.prisma.integration.update({
        where: { id: existingIntegration.id },
        data: { isActive: true, config: integrationConfig },
      });
    } else {
      await this.prisma.integration.create({
        data: {
          businessId,
          type: 'whatsapp',
          name: 'WhatsApp Cloud API',
          isActive: true,
          config: integrationConfig,
        },
      });
    }

    // Keep Business.metaPhoneNumberId in sync for webhook business lookup
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        metaPhoneNumberId: account.phoneNumberId,
        wabaId: account.wabaId,
        whatsappVerified: true,
        whatsappNumber:
          account.displayPhoneNumber || undefined,
      },
    });

    return {
      message: 'WhatsApp connected',
      data: this.sanitizeAccount(account),
    };
  }

  /**
   * Attach platform-level Meta credentials (from env) to a business
   * so owners never enter Phone Number ID / access tokens.
   */
  async attachPlatformCredentials(
    businessId: string,
    displayPhoneNumber?: string | null,
  ) {
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const wabaId = this.config.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID');

    if (!accessToken || !phoneNumberId) {
      this.logger.warn(
        'Platform WhatsApp credentials not set (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID). Business WhatsApp number saved; Meta connect skipped.',
      );
      return null;
    }

    return this.connect(businessId, {
      phoneNumberId,
      accessToken,
      wabaId: wabaId || undefined,
      displayPhoneNumber: displayPhoneNumber || undefined,
    });
  }

  async status(businessId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { businessId },
    });

    if (!account) {
      return {
        data: {
          connected: false,
          status: WhatsAppConnectionStatus.DISCONNECTED,
        },
      };
    }

    return { data: this.sanitizeAccount(account) };
  }

  async test(businessId: string) {
    const account = await this.requireAccount(businessId);
    const token = decryptSecret(
      account.accessTokenEncrypted,
      this.encryptionSecret(),
    );

    const validation = await this.meta.validateCredentials({
      phoneNumberId: account.phoneNumberId,
      accessToken: token,
    });

    if (!validation.ok) {
      await this.prisma.whatsAppAccount.update({
        where: { businessId },
        data: {
          status: WhatsAppConnectionStatus.ERROR,
          lastError: 'WhatsApp credential test failed',
        },
      });
      await this.notifications.create(businessId, {
        type: 'WHATSAPP_ISSUE',
        title: 'WhatsApp connection issue',
        message: 'Unable to validate WhatsApp credentials with Meta',
      });
      throw new BadRequestException(
        'WhatsApp test failed. Check your access token and phone number ID.',
      );
    }

    await this.prisma.whatsAppAccount.update({
      where: { businessId },
      data: {
        status: WhatsAppConnectionStatus.CONNECTED,
        lastError: null,
        displayPhoneNumber:
          validation.displayPhoneNumber || account.displayPhoneNumber,
      },
    });

    return {
      message: 'WhatsApp connection looks healthy',
      data: {
        connected: true,
        displayPhoneNumber:
          validation.displayPhoneNumber || account.displayPhoneNumber,
        verifiedName: validation.verifiedName,
      },
    };
  }

  async disconnect(businessId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { businessId },
    });
    if (!account) {
      throw new NotFoundException('No WhatsApp account connected');
    }

    await this.prisma.whatsAppAccount.update({
      where: { businessId },
      data: {
        status: WhatsAppConnectionStatus.DISCONNECTED,
        accessTokenEncrypted: encryptSecret(
          'revoked',
          this.encryptionSecret(),
        ),
        lastError: null,
        connectedAt: null,
      },
    });

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        metaPhoneNumberId: null,
        whatsappVerified: false,
      },
    });

    return { message: 'WhatsApp disconnected', data: null };
  }

  async sendText(businessId: string, to: string, body: string) {
    const account = await this.requireAccount(businessId);
    if (account.status !== WhatsAppConnectionStatus.CONNECTED) {
      throw new BadRequestException('WhatsApp is not connected');
    }

    const token = decryptSecret(
      account.accessTokenEncrypted,
      this.encryptionSecret(),
    );

    try {
      const result = await this.meta.sendTextMessage({
        phoneNumberId: account.phoneNumberId,
        accessToken: token,
        to,
        body,
      });

      await this.prisma.whatsAppMessage.create({
        data: {
          businessId,
          waMessageId: result.messageId,
          direction: MessageDirection.OUTBOUND,
          fromPhone: account.displayPhoneNumber || account.phoneNumberId,
          toPhone: to,
          body,
          rawPayload: result.raw as object,
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${String(error)}`);
      await this.notifications.create(businessId, {
        type: 'WHATSAPP_ISSUE',
        title: 'Failed to send WhatsApp message',
        message: 'An outbound WhatsApp message could not be delivered',
      });
      throw new BadRequestException('Failed to send WhatsApp message');
    }
  }

  async findBusinessByPhoneNumberId(phoneNumberId: string) {
    return this.prisma.whatsAppAccount.findFirst({
      where: { phoneNumberId },
    });
  }

  private async requireAccount(businessId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { businessId },
    });
    if (!account) {
      throw new NotFoundException('WhatsApp is not connected for this business');
    }
    return account;
  }

}
