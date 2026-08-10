import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Get('whatsapp')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.webhooksService.verifyChallenge(
      mode,
      token,
      challenge,
    );
    return res.status(200).send(result);
  }

  @Public()
  @Post('whatsapp')
  @HttpCode(200)
  async receive(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() body: unknown,
  ) {
    const raw =
      req.rawBody ||
      Buffer.from(
        typeof body === 'string' ? body : JSON.stringify(body ?? {}),
      );
    this.webhooksService.verifySignature(raw, signature);

    const result = await this.webhooksService.handleIncoming(
      body as Parameters<WebhooksService['handleIncoming']>[0],
    );
    return { message: 'Webhook received', data: result };
  }
}
