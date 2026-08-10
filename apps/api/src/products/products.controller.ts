import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@CurrentBusiness() businessId: string) {
    return this.productsService.findAll(businessId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentBusiness() businessId: string,
  ) {
    return this.productsService.findOne(id, businessId);
  }

  @Post()
  create(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(businessId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentBusiness() businessId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, businessId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentBusiness() businessId: string,
  ) {
    return this.productsService.remove(id, businessId);
  }
}
