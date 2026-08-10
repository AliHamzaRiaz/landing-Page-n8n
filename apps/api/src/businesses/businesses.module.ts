import { Module } from '@nestjs/common';
import { OtpModule } from '../otp/otp.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';

@Module({
  imports: [OtpModule, WhatsAppModule],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
