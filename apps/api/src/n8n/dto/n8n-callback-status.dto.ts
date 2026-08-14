import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * n8n "Confirm/Cancel Order in Backend" body for PATCH /api/n8n/callback.
 */
export class N8nCallbackStatusDto {
  @IsString()
  orderId!: string;

  @IsEnum(OrderStatus, {
    message:
      'status must be one of PENDING, CONFIRMED, PROCESSING, DISPATCHED, SHIPPED, DELIVERED, CANCELLED',
  })
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @IsOptional()
  @IsString()
  businessId?: string;
}
