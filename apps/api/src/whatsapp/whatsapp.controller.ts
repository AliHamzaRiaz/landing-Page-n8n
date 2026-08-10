import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('connect')
  connect(
    @CurrentBusiness() businessId: string,
    @Body() dto: ConnectWhatsAppDto,
  ) {
    return this.whatsappService.connect(businessId, dto);
  }

  @Get('status')
  status(@CurrentBusiness() businessId: string) {
    return this.whatsappService.status(businessId);
  }

  @Post('test')
  test(@CurrentBusiness() businessId: string) {
    return this.whatsappService.test(businessId);
  }

  @Post('disconnect')
  disconnect(@CurrentBusiness() businessId: string) {
    return this.whatsappService.disconnect(businessId);
  }
}
