import { Controller, Delete, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { SocialAccountsService } from './social-accounts.service';

@Controller('social-accounts')
export class SocialAccountsController {
  constructor(private readonly socialAccounts: SocialAccountsService) {}

  @Get()
  list(@CurrentBusiness() businessId: string) {
    return this.socialAccounts.list(businessId);
  }

  @Post(':platform/connect')
  connect(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: JwtPayload,
    @Param('platform') platform: string,
  ) {
    return this.socialAccounts.startConnect(businessId, user.sub, platform);
  }

  @Public()
  @Get(':platform/callback')
  async callback(
    @Param('platform') platform: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const url = await this.socialAccounts.handleCallback(platform, { code, state, error });
    return res.redirect(url);
  }

  @Post(':id/test')
  test(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    return this.socialAccounts.test(businessId, id);
  }

  @Post(':id/reconnect')
  reconnect(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.socialAccounts.reconnect(businessId, user.sub, id);
  }

  @Delete(':id')
  disconnect(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    return this.socialAccounts.disconnect(businessId, id);
  }
}
