import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BusinessesService } from './businesses.service';
import { ConfirmWhatsAppDto } from './dto/confirm-whatsapp.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post('onboarding')
  onboarding(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: OnboardingDto,
  ) {
    return this.businessesService.completeOnboarding(
      businessId,
      user.sub,
      dto,
    );
  }

  @Post('whatsapp/confirm')
  confirmWhatsApp(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: ConfirmWhatsAppDto,
  ) {
    return this.businessesService.confirmWhatsApp(businessId, user.sub, dto);
  }

  @Get('me')
  me(@CurrentBusiness() businessId: string) {
    return this.businessesService.getMe(businessId);
  }

  @Patch('me')
  updateMe(
    @CurrentBusiness() businessId: string,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.businessesService.updateMe(businessId, dto);
  }
}
