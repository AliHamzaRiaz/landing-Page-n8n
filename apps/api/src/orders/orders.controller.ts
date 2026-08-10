import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(
    @CurrentBusiness() businessId: string,
    @Query() query: ListOrdersDto,
  ) {
    return this.ordersService.findAll(businessId, query);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentBusiness() businessId: string,
  ) {
    return this.ordersService.findOne(id, businessId);
  }

  @Post()
  create(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(businessId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentBusiness() businessId: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, businessId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentBusiness() businessId: string,
  ) {
    return this.ordersService.remove(id, businessId);
  }
}
