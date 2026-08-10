import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ConfigStatusService } from '../config/config-status.service';

@Controller('health')
export class HealthController {
  constructor(private readonly configStatus: ConfigStatusService) {}

  @Public()
  @Get()
  async check() {
    return {
      data: {
        status: 'ok',
        service: 'ennitant-api',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /** Developer-oriented setup status — not for business UI */
  @Public()
  @Get('setup')
  async setup() {
    const status = await this.configStatus.getStatus();
    return {
      data: status,
      message: 'Developer configuration status',
    };
  }
}
