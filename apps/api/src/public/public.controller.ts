import { Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';

@Controller()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Get('public/order/:businessSlug')
  orderPage(@Param('businessSlug') businessSlug: string) {
    return this.publicService.getBusinessOrderPage(businessSlug);
  }

  @Public()
  @Get('public/vendor/:token')
  vendorPortal(@Param('token') token: string) {
    return this.publicService.getVendorPortal(token);
  }

  @Public()
  @Post('public/vendor/:token/orders/:orderId/dispatch')
  dispatch(
    @Param('token') token: string,
    @Param('orderId') orderId: string,
  ) {
    return this.publicService.markDispatched(token, orderId);
  }
}
