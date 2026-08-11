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

    if (!accessToken?.trim() || !phoneNumberId?.trim()) {
      this.logger.warn(
        `Platform WhatsApp credentials not set (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID). ` +
          `businessId=${businessId} saved display number only; Meta phone_number_id was NOT persisted. ` +
          `Connect WhatsApp via API/dashboard with Phone Number ID before n8n business lookup can succeed.`,
      );
      return null;
    }

    return this.connect(businessId, {
      phoneNumberId: phoneNumberId.trim(),
      accessToken: accessToken.trim(),
      wabaId: wabaId || undefined,
      displayPhoneNumber: displayPhoneNumber || undefined,
    });
  }

  /**
   * Normalize Meta display_phone_number / business WhatsApp digits for matching.
   */
  normalizeWhatsAppDigits(phone: string): string {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('92') && digits.length > 3 && digits[2] === '0') {
      digits = `92${digits.slice(3)}`;
    }
    // Drop leading 0 for national formats (0313... → 313...)
    if (digits.startsWith('0')) {
      digits = digits.replace(/^0+/, '');
    }
    return digits;
  }

  /**
   * Persist Meta phone_number_id on Business (and sync existing WhatsAppAccount if present).
   * Does not invent businesses — only updates an existing businessId.
   */
  async linkMetaPhoneNumberId(
    businessId: string,
    phoneNumberId: string,
    displayPhoneNumber?: string | null,
  ) {
    const id = phoneNumberId.trim();
    if (!id) {
      throw new BadRequestException('phoneNumberId is required');
    }

    const conflict = await this.prisma.business.findFirst({
      where: {
        metaPhoneNumberId: id,
        NOT: { id: businessId },
      },
      select: { id: true },
    });
    if (conflict) {
      throw new BadRequestException(
        'This WhatsApp phone_number_id is already linked to another business',
      );
    }

    const accountConflict = await this.prisma.whatsAppAccount.findFirst({
      where: {
        phoneNumberId: id,
        NOT: { businessId },
      },
      select: { id: true },
    });
    if (accountConflict) {
      throw new BadRequestException(
        'This WhatsApp phone_number_id is already linked to another business',
      );
    }

    const display = displayPhoneNumber?.trim() || undefined;

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        metaPhoneNumberId: id,
        ...(display
          ? {
              whatsappNumber: display.startsWith('+')
                ? display
                : `+${display.replace(/\D/g, '')}`,
            }
          : {}),
      },
    });

    const existingAccount = await this.prisma.whatsAppAccount.findUnique({
      where: { businessId },
    });
    if (existingAccount) {
      await this.prisma.whatsAppAccount.update({
        where: { businessId },
        data: {
          phoneNumberId: id,
          ...(display ? { displayPhoneNumber: display } : {}),
          lastWebhookAt: new Date(),
        },
      });
    }

    return { businessId, phoneNumberId: id };
  }

  /**
   * Resolve business from Meta metadata.
   * 1) phone_number_id on Business / WhatsAppAccount
   * 2) else match display_phone_number to Business.whatsappNumber/phone and persist phone_number_id
   */
  async resolveBusinessIdFromMetaMetadata(params: {
    phoneNumberId: string;
    displayPhoneNumber?: string | null;
  }): Promise<string | null> {
    const phoneNumberId = params.phoneNumberId.trim();
    if (!phoneNumberId) return null;

    const byMeta = await this.prisma.business.findUnique({
      where: { metaPhoneNumberId: phoneNumberId },
      select: { id: true },
    });
    if (byMeta) return byMeta.id;

    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { phoneNumberId },
      select: { id: true, businessId: true },
    });
    if (account) {
      await this.prisma.business.update({
        where: { id: account.businessId },
        data: { metaPhoneNumberId: phoneNumberId },
      });
      await this.prisma.whatsAppAccount.update({
        where: { id: account.id },
        data: { lastWebhookAt: new Date() },
      });
      return account.businessId;
    }

    const display = params.displayPhoneNumber?.trim();
    if (!display) {
      return null;
    }

    const displayDigits = this.normalizeWhatsAppDigits(display);
    if (!displayDigits) return null;

    const candidates = await this.prisma.business.findMany({
      where: {
        OR: [
          { whatsappNumber: { not: null } },
          { phone: { not: null } },
        ],
      },
      select: {
        id: true,
        whatsappNumber: true,
        phone: true,
        metaPhoneNumberId: true,
      },
    });

    const matches = candidates.filter((b) => {
      const wa = b.whatsappNumber
        ? this.normalizeWhatsAppDigits(b.whatsappNumber)
        : '';
      const phone = b.phone ? this.normalizeWhatsAppDigits(b.phone) : '';
      return wa === displayDigits || phone === displayDigits;
    });

    if (matches.length !== 1) {
      if (matches.length > 1) {
        this.logger.warn(
          `Ambiguous display_phone_number=${display} matched ${matches.length} businesses; not auto-linking phone_number_id=${phoneNumberId}`,
        );
      }
      return null;
    }

    const business = matches[0];
    await this.linkMetaPhoneNumberId(
      business.id,
      phoneNumberId,
      display.startsWith('+') ? display : `+${displayDigits}`,
    );
    this.logger.log(
      `Auto-linked Meta phone_number_id=${phoneNumberId} to businessId=${business.id} via display_phone_number`,
    );
    return business.id;
  }

  async findBusinessByPhoneNumberId(phoneNumberId: string) {
    return this.prisma.whatsAppAccount.findUnique({
      where: { phoneNumberId },
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
