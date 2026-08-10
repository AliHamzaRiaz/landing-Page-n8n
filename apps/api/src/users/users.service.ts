import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string, businessId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, businessId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        businessId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { data: user };
  }

  async listForBusiness(businessId: string) {
    const users = await this.prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return { data: users };
  }
}
