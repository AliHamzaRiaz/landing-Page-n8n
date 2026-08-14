import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';
import { EmbeddedSignupCompleteDto } from './dto/embedded-signup-complete.dto';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Get('embedded-signup/config')
  embeddedSignupConfig() {
    return {
      data: this.whatsappService.getEmbeddedSignupConfig(),
    };
  }

  @Post('embedded-signup/complete')
  completeEmbeddedSignup(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: EmbeddedSignupCompleteDto,
  ) {
    return this.whatsappService.completeEmbeddedSignup(
      businessId,
      user.sub,
      dto,
    );
  }

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
  disconnect(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.whatsappService.disconnect(businessId, user.sub);
  }
}
