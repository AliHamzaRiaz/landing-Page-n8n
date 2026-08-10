import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsoleOtpProvider } from './console-otp.provider';
import { OtpProvider, SendOtpInput } from './otp.types';

/**
 * OTP delivery abstraction.
 * - OTP_PROVIDER=console (default): logs code; returns for OTP_DEV_MODE
 * - OTP_PROVIDER=whatsapp|sms: requires OTP_API_KEY (+ provider wiring) — not silently faked
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly provider: OtpProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly consoleProvider: ConsoleOtpProvider,
  ) {
    const selected = (this.config.get<string>('OTP_PROVIDER') || 'console').toLowerCase();
    if (selected === 'console') {
      this.provider = this.consoleProvider;
    } else if (selected === 'whatsapp' || selected === 'sms') {
      const apiKey = this.config.get<string>('OTP_API_KEY');
      if (!apiKey) {
        this.logger.warn(
          `OTP_PROVIDER=${selected} but OTP_API_KEY is missing. Falling back to console provider.`,
        );
        this.provider = this.consoleProvider;
      } else {
        // Provider adapters for Twilio/etc. plug in here when credentials exist.
        this.logger.warn(
          `OTP_PROVIDER=${selected} is selected but the adapter is not fully wired yet. Using console until OTP_API_KEY provider is integrated.`,
        );
        this.provider = this.consoleProvider;
      }
    } else {
      this.logger.warn(`Unknown OTP_PROVIDER=${selected}. Using console.`);
      this.provider = this.consoleProvider;
    }
  }

  get status() {
    return {
      provider: this.provider.name,
      configured: this.provider.configured,
      devMode: this.config.get<string>('OTP_DEV_MODE') === 'true',
    };
  }

  async send(input: SendOtpInput) {
    return this.provider.send(input);
  }

  isDevMode() {
    return this.config.get<string>('OTP_DEV_MODE') === 'true';
  }
}
