import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isProduction } from '../common/env/production-guards';
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

    const metaVerify = Boolean(this.config.get('META_VERIFY_TOKEN'));
    const metaSecret = Boolean(this.config.get('META_APP_SECRET'));
    const metaAppId = Boolean(this.config.get('META_APP_ID'));
    const embeddedConfig = Boolean(
      this.config.get('META_EMBEDDED_SIGNUP_CONFIG_ID'),
    );
    const n8nUrl = Boolean(this.config.get('N8N_BASE_URL'));
    const n8nSecret = Boolean(this.config.get('N8N_WEBHOOK_SECRET'));

    return {
      database: { ok: databaseOk, error: databaseError },
      whatsapp: {
        configured: metaVerify && metaAppId && embeddedConfig,
        signatureVerification: metaSecret,
        embeddedSignup: embeddedConfig,
        hint: metaVerify
          ? metaSecret
            ? metaAppId && embeddedConfig
              ? 'Embedded Signup ready'
              : 'set META_APP_ID + META_EMBEDDED_SIGNUP_CONFIG_ID'
            : isProduction(this.config)
              ? 'META_APP_SECRET required in production'
              : 'set META_APP_SECRET for signature checks'
          : 'set META_VERIFY_TOKEN',
      },
      n8n: {
        configured: n8nUrl && n8nSecret,
        hint:
          n8nUrl && n8nSecret
            ? 'base URL + webhook secret present'
            : 'set N8N_BASE_URL and N8N_WEBHOOK_SECRET',
      },
      otp: this.otp.status,
    };
  }
}
