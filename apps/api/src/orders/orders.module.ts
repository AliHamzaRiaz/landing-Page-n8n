import { Module, forwardRef } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { OrderIntakeService } from './order-intake.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    CustomersModule,
    forwardRef(() => WhatsAppModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderIntakeService],
  exports: [OrdersService, OrderIntakeService],
})
export class OrdersModule {}
