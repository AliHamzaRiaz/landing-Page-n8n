import { NotificationType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
