import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(businessId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: integrations };
  }

  async upsert(
    businessId: string,
    data: {
      type: string;
      name: string;
      config?: Record<string, unknown>;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.integration.findFirst({
      where: { businessId, type: data.type },
    });

    if (existing) {
      const updated = await this.prisma.integration.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          config: (data.config ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          isActive: data.isActive ?? true,
        },
      });
      return { message: 'Integration updated', data: updated };
    }

    const created = await this.prisma.integration.create({
      data: {
        businessId,
        type: data.type,
        name: data.name,
        config: (data.config ?? undefined) as Prisma.InputJsonValue | undefined,
        isActive: data.isActive ?? true,
      },
    });

    return { message: 'Integration created', data: created };
  }

  async remove(id: string, businessId: string) {
    const existing = await this.prisma.integration.findFirst({
      where: { id, businessId },
    });
    if (!existing) {
      throw new NotFoundException('Integration not found');
    }
    await this.prisma.integration.delete({ where: { id } });
    return { message: 'Integration removed', data: null };
  }
}
