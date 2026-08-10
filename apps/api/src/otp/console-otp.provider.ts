import { Injectable, Logger } from '@nestjs/common';
import { OtpProvider, SendOtpInput } from './otp.types';

@Injectable()
export class ConsoleOtpProvider implements OtpProvider {
  readonly name = 'console';
  readonly configured = true;
  private readonly logger = new Logger(ConsoleOtpProvider.name);

  async send(input: SendOtpInput) {
    this.logger.log(
      `[DEV OTP] purpose=${input.purpose} phone=${input.phoneNumber} code=${input.code}`,
    );
    return { channel: 'console' as const, delivered: true };
  }
}
