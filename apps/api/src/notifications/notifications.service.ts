import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(businessId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data: notifications };
  }

  async create(
    businessId: string,
    dto: CreateNotificationDto | {
      type: NotificationType | keyof typeof NotificationType;
      title: string;
      message: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        businessId,
        type: dto.type as NotificationType,
        title: dto.title,
        message: dto.message,
        metadata: (dto.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    return notification;
  }

  async markRead(id: string, businessId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, businessId },
    });
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    const notification = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return { message: 'Notification marked as read', data: notification };
  }

  async markAllRead(businessId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { businessId, isRead: false },
      data: { isRead: true },
    });

    return {
      message: 'All notifications marked as read',
      data: { count: result.count },
    };
  }
}
