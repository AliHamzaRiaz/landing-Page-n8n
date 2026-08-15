import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessageDirection,
  Prisma,
  WhatsAppConnectionStatus,
} from '@prisma/client';
import {
  decryptSecret,
  encryptSecret,
} from '../common/crypto/token-crypto';
import {
  encryptionSecret,
  isPlatformFallbackEnabled,
} from '../common/env/production-guards';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';
import { EmbeddedSignupCompleteDto } from './dto/embedded-signup-complete.dto';
import { MetaApiError, MetaWhatsAppClient } from './meta-whatsapp.client';
import {
  WhatsAppErrorCode,
  whatsappError,
} from './whatsapp-onboarding.errors';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly meta: MetaWhatsAppClient,
    private readonly notifications: NotificationsService,
  ) {}

  getEmbeddedSignupConfig() {
    const appId = this.config.get<string>('META_APP_ID')?.trim();
    const configId = this.config
      .get<string>('META_EMBEDDED_SIGNUP_CONFIG_ID')
      ?.trim();

    if (!appId || !configId) {
      throw new BadRequestException(
        'WhatsApp Embedded Signup is not configured on the server',
      );
    }

    return {
      appId,
      configId,
      graphVersion: this.config.get<string>('META_GRAPH_API_VERSION', 'v21.0'),
      coexistenceSupported: true,
    };
  }

  async completeEmbeddedSignup(
    businessId: string,
    userId: string,
    dto: EmbeddedSignupCompleteDto,
  ) {
    const wabaId = dto.wabaId.trim();
    const onboardingPath = dto.onboardingPath ?? 'embedded_signup';

    let accessToken: string;
    let tokenExpiresAt: Date | null = null;

    try {
      const exchanged = await this.meta.exchangeAuthorizationCode(dto.code);
      accessToken = exchanged.accessToken;
      if (exchanged.expiresIn) {
        tokenExpiresAt = new Date(Date.now() + exchanged.expiresIn * 1000);
      }
    } catch (error) {
      this.logger.warn(
        `Embedded Signup token exchange failed for businessId=${businessId}`,
      );
      await this.recordConnectionError(
        businessId,
        userId,
        'Meta authorization failed',
      );
      throw this.mapMetaError(error, WhatsAppErrorCode.META_AUTHORIZATION_FAILED);
    }

    try {
      await this.meta.getWaba(wabaId, accessToken);
    } catch (error) {
      await this.recordConnectionError(
        businessId,
        userId,
        'WhatsApp Business Account was not found',
      );
      throw this.mapMetaError(error, WhatsAppErrorCode.WABA_NOT_FOUND);
    }

    let phoneNumberId: string;
    let displayPhoneNumber: string | null = dto.displayPhoneNumber?.trim() || null;

    try {
      const resolved = await this.resolveAuthorizedPhone({
        wabaId,
        accessToken,
        sessionPhoneNumberId: dto.phoneNumberId?.trim(),
      });
      phoneNumberId = resolved.phoneNumberId;
      displayPhoneNumber =
        displayPhoneNumber || resolved.displayPhoneNumber || null;
    } catch (error) {
      await this.recordConnectionError(
        businessId,
        userId,
        'WhatsApp phone number was not found',
      );
      if (error instanceof HttpException) throw error;
      throw this.mapMetaError(error, WhatsAppErrorCode.PHONE_NUMBER_NOT_FOUND);
    }

    await this.assertPhoneNumberIdAvailable(businessId, phoneNumberId);

    let validation;
    try {
      validation = await this.meta.validateCredentials({
        phoneNumberId,
        accessToken,
      });
    } catch (error) {
      await this.persistErrorAccount({
        businessId,
        userId,
        phoneNumberId,
        wabaId,
        displayPhoneNumber,
        accessToken,
        tokenExpiresAt,
        onboardingPath,
        lastError: 'Meta phone validation timed out',
      });
      throw this.mapMetaError(error, WhatsAppErrorCode.META_API_TIMEOUT);
    }

    if (!validation.ok) {
      await this.persistErrorAccount({
        businessId,
        userId,
        phoneNumberId,
        wabaId,
        displayPhoneNumber,
        accessToken,
        tokenExpiresAt,
        onboardingPath,
        lastError: 'Meta rejected the WhatsApp phone credentials',
      });
      throw whatsappError(WhatsAppErrorCode.PHONE_VERIFICATION_FAILED);
    }

    displayPhoneNumber =
      displayPhoneNumber || validation.displayPhoneNumber || null;

    let subscribed: boolean;
    try {
      subscribed = await this.meta.subscribeWaba(wabaId, accessToken);
    } catch (error) {
      await this.persistErrorAccount({
        businessId,
        userId,
        phoneNumberId,
        wabaId,
        displayPhoneNumber,
        accessToken,
        tokenExpiresAt,
        onboardingPath,
        lastError: 'Webhook subscription timed out',
        isOnBizApp: validation.isOnBizApp,
        platformType: validation.platformType,
        verifiedName: validation.verifiedName,
      });
      throw this.mapMetaError(error, WhatsAppErrorCode.META_API_TIMEOUT);
    }

    if (!subscribed) {
      await this.persistErrorAccount({
        businessId,
        userId,
        phoneNumberId,
        wabaId,
        displayPhoneNumber,
        accessToken,
        tokenExpiresAt,
        onboardingPath,
        lastError: 'Webhook subscription failed',
        isOnBizApp: validation.isOnBizApp,
        platformType: validation.platformType,
        verifiedName: validation.verifiedName,
      });
      throw whatsappError(WhatsAppErrorCode.WEBHOOK_SUBSCRIBE_FAILED);
    }

    const encrypted = encryptSecret(accessToken, encryptionSecret(this.config));
    const now = new Date();
    const metadata = {
      verifiedName: validation.verifiedName ?? null,
      wabaId,
      onboardingPath,
      isOnBizApp: validation.isOnBizApp ?? null,
      platformType: validation.platformType ?? null,
    } as Prisma.InputJsonValue;

    const account = await this.prisma.whatsAppAccount.upsert({
      where: { businessId },
      create: {
        businessId,
        phoneNumberId,
        wabaId,
        displayPhoneNumber,
        accessTokenEncrypted: encrypted,
        status: WhatsAppConnectionStatus.CONNECTED,
        lastError: null,
        connectedAt: now,
        embeddedSignupAt: now,
        connectedByUserId: userId,
        tokenExpiresAt,
        connectionMetadata: metadata,
      },
      update: {
        phoneNumberId,
        wabaId,
        displayPhoneNumber: displayPhoneNumber || undefined,
        accessTokenEncrypted: encrypted,
        status: WhatsAppConnectionStatus.CONNECTED,
        lastError: null,
        connectedAt: now,
        embeddedSignupAt: now,
        connectedByUserId: userId,
        tokenExpiresAt,
        connectionMetadata: metadata,
      },
    });

    await this.syncIntegrationAndBusiness(businessId, account, displayPhoneNumber);

    await this.prisma.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'whatsapp.embedded_signup.connected',
        entity: 'WhatsAppAccount',
        entityId: account.id,
        metadata: {
          phoneNumberId,
          wabaId,
          displayPhoneNumber,
          onboardingPath,
        },
      },
    });

    return {
      message: 'WhatsApp connected successfully',
      data: this.sanitizeAccount(account),
    };
  }

  async connect(businessId: string, dto: ConnectWhatsAppDto) {
    if (!isPlatformFallbackEnabled(this.config)) {
      throw new ForbiddenException(
        'Manual WhatsApp token connect is disabled. Use Connect WhatsApp (Meta Embedded Signup).',
      );
    }
    const validation = await this.meta.validateCredentials({
      phoneNumberId: dto.phoneNumberId,
      accessToken: dto.accessToken,
    });

    if (!validation.ok && !isPlatformFallbackEnabled(this.config)) {
      throw new BadRequestException(
        'Meta rejected the WhatsApp credentials. Check phone number ID and access token.',
      );
    }

    await this.assertPhoneNumberIdAvailable(
      businessId,
      dto.phoneNumberId.trim(),
    );

    const status = validation.ok
      ? WhatsAppConnectionStatus.CONNECTED
      : WhatsAppConnectionStatus.ERROR;

    const validatedDisplay =
      validation.ok ? validation.displayPhoneNumber : undefined;
    const encrypted = encryptSecret(
      dto.accessToken,
      encryptionSecret(this.config),
    );

    const account = await this.prisma.whatsAppAccount.upsert({
      where: { businessId },
      create: {
        businessId,
        phoneNumberId: dto.phoneNumberId.trim(),
        wabaId: dto.wabaId?.trim(),
        displayPhoneNumber:
          dto.displayPhoneNumber?.trim() || validatedDisplay || null,
        accessTokenEncrypted: encrypted,
        status,
        lastError: validation.ok ? null : 'Meta credential validation failed',
        connectedAt: validation.ok ? new Date() : null,
      },
      update: {
        phoneNumberId: dto.phoneNumberId.trim(),
        wabaId: dto.wabaId?.trim(),
        displayPhoneNumber:
          dto.displayPhoneNumber?.trim() || validatedDisplay || undefined,
        accessTokenEncrypted: encrypted,
        status,
        lastError: validation.ok ? null : 'Meta credential validation failed',
        connectedAt: validation.ok ? new Date() : null,
      },
    });

    await this.syncIntegrationAndBusiness(
      businessId,
      account,
      account.displayPhoneNumber,
    );

    return {
      message: validation.ok ? 'WhatsApp connected' : 'WhatsApp connection failed validation',
      data: this.sanitizeAccount(account),
    };
  }

  /**
   * Dev-only: attach platform env credentials when WHATSAPP_PLATFORM_FALLBACK=true.
   */
  async attachPlatformCredentials(
    businessId: string,
    displayPhoneNumber?: string | null,
  ) {
    if (!isPlatformFallbackEnabled(this.config)) {
      this.logger.debug(
        `Platform WhatsApp fallback disabled; businessId=${businessId} must use Embedded Signup`,
      );
      return null;
    }

    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const wabaId = this.config.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID');

    if (!accessToken?.trim() || !phoneNumberId?.trim()) {
      this.logger.warn(
        `Platform WhatsApp credentials not set for dev fallback. businessId=${businessId}`,
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

  normalizeWhatsAppDigits(phone: string): string {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('92') && digits.length > 3 && digits[2] === '0') {
      digits = `92${digits.slice(3)}`;
    }
    if (digits.startsWith('0')) {
      digits = digits.replace(/^0+/, '');
    }
    return digits;
  }

  async linkMetaPhoneNumberId(
    businessId: string,
    phoneNumberId: string,
    displayPhoneNumber?: string | null,
  ) {
    await this.assertPhoneNumberIdAvailable(businessId, phoneNumberId.trim());
    const id = phoneNumberId.trim();
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
      select: { id: true, businessId: true, status: true },
    });
    if (account) {
      if (account.status === WhatsAppConnectionStatus.DISCONNECTED) {
        return null;
      }
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
        OR: [{ whatsappNumber: { not: null } }, { phone: { not: null } }],
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
          `Ambiguous display_phone_number=${display} matched ${matches.length} businesses`,
        );
      }
      return null;
    }

    const business = matches[0];
    const existing = await this.prisma.whatsAppAccount.findUnique({
      where: { businessId: business.id },
      select: { status: true },
    });
    if (existing?.status === WhatsAppConnectionStatus.DISCONNECTED) {
      return null;
    }
    await this.linkMetaPhoneNumberId(
      business.id,
      phoneNumberId,
      display.startsWith('+') ? display : `+${displayDigits}`,
    );
    this.logger.log(
      `Auto-linked phone_number_id=${phoneNumberId} to businessId=${business.id}`,
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
      encryptionSecret(this.config),
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
        'WhatsApp test failed. Reconnect your WhatsApp Business account.',
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

  async disconnect(businessId: string, userId?: string) {
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
        phoneNumberId: `disconnected:${account.id}`,
        accessTokenEncrypted: encryptSecret(
          'revoked',
          encryptionSecret(this.config),
        ),
        lastError: null,
        connectedAt: null,
        tokenExpiresAt: null,
      },
    });

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        metaPhoneNumberId: null,
        whatsappVerified: false,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        businessId,
        userId: userId ?? null,
        action: 'whatsapp.disconnected',
        entity: 'WhatsAppAccount',
        entityId: account.id,
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
      encryptionSecret(this.config),
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
      this.logger.error(`Failed to send WhatsApp message for businessId=${businessId}`);
      await this.notifications.create(businessId, {
        type: 'WHATSAPP_ISSUE',
        title: 'Failed to send WhatsApp message',
        message: 'An outbound WhatsApp message could not be delivered',
      });
      throw new BadRequestException('Failed to send WhatsApp message');
    }
  }

  async handleAccountUpdate(params: {
    wabaId?: string;
    phoneNumberId?: string;
    event?: string;
  }) {
    const phoneNumberId = params.phoneNumberId?.trim();
    if (!phoneNumberId) return;

    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { phoneNumberId },
    });
    if (!account) return;

    const event = params.event?.toUpperCase() ?? '';
    if (
      event.includes('DISABLE') ||
      event.includes('DISCONNECT') ||
      event.includes('REVOK')
    ) {
      await this.prisma.whatsAppAccount.update({
        where: { id: account.id },
        data: {
          status: WhatsAppConnectionStatus.DISCONNECTED,
          lastError: 'Meta reported account disconnection',
        },
      });
      await this.prisma.business.update({
        where: { id: account.businessId },
        data: { metaPhoneNumberId: null, whatsappVerified: false },
      });
    }
  }

  private async assertPhoneNumberIdAvailable(
    businessId: string,
    phoneNumberId: string,
  ) {
    const conflictBusiness = await this.prisma.business.findFirst({
      where: {
        metaPhoneNumberId: phoneNumberId,
        NOT: { id: businessId },
      },
      select: { id: true },
    });
    if (conflictBusiness) {
      throw whatsappError(WhatsAppErrorCode.PHONE_ALREADY_CONNECTED);
    }

    const conflictAccount = await this.prisma.whatsAppAccount.findFirst({
      where: {
        phoneNumberId,
        NOT: { businessId },
      },
      select: { id: true },
    });
    if (conflictAccount) {
      throw whatsappError(WhatsAppErrorCode.PHONE_ALREADY_CONNECTED);
    }
  }

  private async syncIntegrationAndBusiness(
    businessId: string,
    account: {
      phoneNumberId: string;
      wabaId: string | null;
      displayPhoneNumber: string | null;
    },
    displayPhoneNumber?: string | null,
  ) {
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

    const normalizedDisplay = displayPhoneNumber?.trim();
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        metaPhoneNumberId: account.phoneNumberId,
        wabaId: account.wabaId,
        whatsappVerified: true,
        onboardingCompleted: true,
        whatsappNumber: normalizedDisplay || undefined,
        phone: normalizedDisplay || undefined,
      },
    });
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
    connectionMetadata?: Prisma.JsonValue | null;
  }) {
    const metadata =
      account.connectionMetadata &&
      typeof account.connectionMetadata === 'object' &&
      !Array.isArray(account.connectionMetadata)
        ? (account.connectionMetadata as Record<string, unknown>)
        : {};
    const customerChatUrl = this.toCustomerChatUrl(account.displayPhoneNumber);
    const onboardingPath =
      typeof metadata.onboardingPath === 'string' ? metadata.onboardingPath : null;
    const isOnWhatsAppBusinessApp = metadata.isOnBizApp === true;

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
      customerChatUrl,
      onboardingPath,
      isOnWhatsAppBusinessApp,
    };
  }

  toCustomerChatUrl(phone?: string | null): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) return null;
    return `https://wa.me/${digits}`;
  }

  private mapMetaError(
    error: unknown,
    fallback: (typeof WhatsAppErrorCode)[keyof typeof WhatsAppErrorCode],
  ) {
    if (error instanceof HttpException) return error;
    if (error instanceof MetaApiError) {
      if (error.kind === 'timeout') {
        return whatsappError(WhatsAppErrorCode.META_API_TIMEOUT);
      }
      if (error.kind === 'not_found') {
        return whatsappError(
          fallback === WhatsAppErrorCode.WABA_NOT_FOUND
            ? WhatsAppErrorCode.WABA_NOT_FOUND
            : WhatsAppErrorCode.PHONE_NUMBER_NOT_FOUND,
        );
      }
      if (error.kind === 'auth') {
        return whatsappError(WhatsAppErrorCode.INVALID_META_TOKEN);
      }
    }
    return whatsappError(fallback);
  }

  private async resolveAuthorizedPhone(params: {
    wabaId: string;
    accessToken: string;
    sessionPhoneNumberId?: string;
  }) {
    const phones = await this.meta.listWabaPhoneNumbers(
      params.wabaId,
      params.accessToken,
    );
    if (!phones.length) {
      throw whatsappError(WhatsAppErrorCode.PHONE_NUMBER_NOT_FOUND);
    }

    if (params.sessionPhoneNumberId) {
      const match = phones.find((phone) => phone.id === params.sessionPhoneNumberId);
      if (!match) {
        throw whatsappError(
          WhatsAppErrorCode.UNSUPPORTED_NUMBER,
          'The selected WhatsApp number does not belong to the authorized WhatsApp Business Account.',
        );
      }
      return {
        phoneNumberId: match.id,
        displayPhoneNumber: match.displayPhoneNumber ?? null,
      };
    }

    if (phones.length === 1) {
      return {
        phoneNumberId: phones[0].id,
        displayPhoneNumber: phones[0].displayPhoneNumber ?? null,
      };
    }

    throw whatsappError(
      WhatsAppErrorCode.PHONE_NUMBER_NOT_FOUND,
      'Multiple WhatsApp numbers were found. Complete Meta onboarding again and select one number.',
    );
  }

  private async recordConnectionError(
    businessId: string,
    userId: string,
    lastError: string,
  ) {
    const existing = await this.prisma.whatsAppAccount.findUnique({
      where: { businessId },
    });
    if (!existing) return;
    await this.prisma.whatsAppAccount.update({
      where: { businessId },
      data: {
        status: WhatsAppConnectionStatus.ERROR,
        lastError,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'whatsapp.embedded_signup.failed',
        entity: 'WhatsAppAccount',
        entityId: existing.id,
        metadata: { lastError },
      },
    }).catch(() => undefined);
  }

  private async persistErrorAccount(params: {
    businessId: string;
    userId: string;
    phoneNumberId: string;
    wabaId: string;
    displayPhoneNumber: string | null;
    accessToken: string;
    tokenExpiresAt: Date | null;
    onboardingPath: string;
    lastError: string;
    isOnBizApp?: boolean;
    platformType?: string;
    verifiedName?: string;
  }) {
    const encrypted = encryptSecret(
      params.accessToken,
      encryptionSecret(this.config),
    );
    try {
      await this.assertPhoneNumberIdAvailable(
        params.businessId,
        params.phoneNumberId,
      );
    } catch {
      await this.recordConnectionError(
        params.businessId,
        params.userId,
        params.lastError,
      );
      return;
    }

    await this.prisma.whatsAppAccount.upsert({
      where: { businessId: params.businessId },
      create: {
        businessId: params.businessId,
        phoneNumberId: params.phoneNumberId,
        wabaId: params.wabaId,
        displayPhoneNumber: params.displayPhoneNumber,
        accessTokenEncrypted: encrypted,
        status: WhatsAppConnectionStatus.ERROR,
        lastError: params.lastError,
        connectedAt: null,
        connectedByUserId: params.userId,
        tokenExpiresAt: params.tokenExpiresAt,
        connectionMetadata: {
          onboardingPath: params.onboardingPath,
          verifiedName: params.verifiedName ?? null,
        } as Prisma.InputJsonValue,
      },
      update: {
        phoneNumberId: params.phoneNumberId,
        wabaId: params.wabaId,
        displayPhoneNumber: params.displayPhoneNumber || undefined,
        accessTokenEncrypted: encrypted,
        status: WhatsAppConnectionStatus.ERROR,
        lastError: params.lastError,
        connectedAt: null,
        connectedByUserId: params.userId,
        tokenExpiresAt: params.tokenExpiresAt,
      },
    });
  }

  private async requireAccount(businessId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { businessId },
    });
    if (!account) {
      throw new NotFoundException('WhatsApp is not connected for this business');
    }
    if (account.status === WhatsAppConnectionStatus.DISCONNECTED) {
      throw new BadRequestException('WhatsApp is disconnected for this business');
    }
    return account;
  }
}
