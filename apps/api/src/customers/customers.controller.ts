import { Controller, Get, Param } from '@nestjs/common';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@CurrentBusiness() businessId: string) {
    return this.customersService.findAll(businessId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentBusiness() businessId: string,
  ) {
    return this.customersService.findOne(id, businessId);
  }
}
