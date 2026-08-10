import { Controller, Get, Param } from '@nestjs/common';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@CurrentBusiness() businessId: string) {
    return this.usersService.listForBusiness(businessId);
  }

  @Get(':id')
  getOne(
    @Param('id') id: string,
    @CurrentBusiness() businessId: string,
  ) {
    return this.usersService.findById(id, businessId);
  }
}
