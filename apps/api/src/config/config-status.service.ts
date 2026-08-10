import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class ConfigStatusService implements OnModuleInit {
  private readonly logger = new Logger('EnnitantSetup');

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
  ) {}

  async onModuleInit() {
    const status = await this.getStatus();
    this.logger.log(`Database: ${status.database.ok ? 'OK' : 'MISSING/ERROR'}`);
    this.logger.log(
      `WhatsApp/Meta: ${status.whatsapp.configured ? 'configured' : 'not configured'} (${status.whatsapp.hint})`,
    );
    this.logger.log(
      `n8n: ${status.n8n.configured ? 'configured' : 'not configured'} (${status.n8n.hint})`,
    );
    this.logger.log(
      `OTP: provider=${status.otp.provider} devMode=${status.otp.devMode}`,
    );
  }

  async getStatus() {
    let databaseOk = false;
    let databaseError: string | undefined;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseOk = true;
    } catch (error) {
      databaseError =
        error instanceof Error ? error.message : 'Database unreachable';
    }

    const metaToken = Boolean(
      this.config.get('META_VERIFY_TOKEN') ||
        this.config.get('WHATSAPP_ACCESS_TOKEN'),
    );
    const metaSecret = Boolean(this.config.get('META_APP_SECRET'));
    const n8nUrl = Boolean(this.config.get('N8N_BASE_URL'));
    const n8nSecret = Boolean(this.config.get('N8N_WEBHOOK_SECRET'));

    return {
      database: { ok: databaseOk, error: databaseError },
      whatsapp: {
        configured: metaToken,
        signatureVerification: metaSecret,
        hint: metaToken
          ? metaSecret
            ? 'verify token + app secret present'
            : 'verify token present; set META_APP_SECRET for signature checks'
          : 'set META_VERIFY_TOKEN and connect a business WhatsApp number',
      },
      n8n: {
        configured: n8nUrl && n8nSecret,
        hint:
          n8nUrl && n8nSecret
            ? 'base URL + webhook secret present'
            : 'set N8N_BASE_URL and N8N_WEBHOOK_SECRET (local parser fallback active if n8n down)',
      },
      otp: this.otp.status,
    };
  }
}
