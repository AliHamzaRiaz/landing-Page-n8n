import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(businessId: string) {
    const products = await this.prisma.product.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: products };
  }

  async findOne(id: string, businessId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return { data: product };
  }

  async create(businessId: string, dto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          businessId,
          name: dto.name.trim(),
          description: dto.description?.trim(),
          sku: dto.sku?.trim() || null,
          price: new Prisma.Decimal(dto.price),
          currency: dto.currency?.trim() || 'USD',
          stock: dto.stock ?? 0,
          imageUrl: dto.imageUrl?.trim() || null,
          isActive: dto.isActive ?? true,
        },
      });
      return { message: 'Product created', data: product };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A product with this SKU already exists for your business',
        );
      }
      throw error;
    }
  }

  async update(id: string, businessId: string, dto: UpdateProductDto) {
    await this.ensureOwned(id, businessId);

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          description: dto.description?.trim(),
          sku: dto.sku === undefined ? undefined : dto.sku?.trim() || null,
          price:
            dto.price === undefined
              ? undefined
              : new Prisma.Decimal(dto.price),
          currency: dto.currency?.trim(),
          stock: dto.stock,
          imageUrl:
            dto.imageUrl === undefined
              ? undefined
              : dto.imageUrl?.trim() || null,
          isActive: dto.isActive,
        },
      });
      return { message: 'Product updated', data: product };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A product with this SKU already exists for your business',
        );
      }
      throw error;
    }
  }

  async remove(id: string, businessId: string) {
    await this.ensureOwned(id, businessId);
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted', data: null };
  }

  private async ensureOwned(id: string, businessId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }
}
