import { Module, forwardRef } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { N8nOrdersService } from './n8n-orders.service';
import { N8nController } from './n8n.controller';
import { N8nService } from './n8n.service';

@Module({
  imports: [
    CustomersModule,
    NotificationsModule,
    OrdersModule,
    forwardRef(() => WhatsAppModule),
  ],
  controllers: [N8nController],
  providers: [N8nService, N8nOrdersService],
  exports: [N8nService],
})
export class N8nModule {}
