import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class N8nUpdateStatusDto {
  @IsEnum(OrderStatus, {
    message:
      'status must be one of PENDING, CONFIRMED, PROCESSING, DISPATCHED, SHIPPED, DELIVERED, CANCELLED',
  })
  status!: OrderStatus;
}
