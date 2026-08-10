import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { MetaWhatsAppClient } from './meta-whatsapp.client';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, MetaWhatsAppClient],
  exports: [WhatsAppService, MetaWhatsAppClient],
})
export class WhatsAppModule {}
