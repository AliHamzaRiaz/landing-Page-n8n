import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { N8nModule } from '../n8n/n8n.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    CustomersModule,
    N8nModule,
    WhatsAppModule,
    NotificationsModule,
    OrdersModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
