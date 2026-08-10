import { Global, Module } from '@nestjs/common';
import { ConsoleOtpProvider } from './console-otp.provider';
import { OtpService } from './otp.service';

@Global()
@Module({
  providers: [ConsoleOtpProvider, OtpService],
  exports: [OtpService],
})
export class OtpModule {}
