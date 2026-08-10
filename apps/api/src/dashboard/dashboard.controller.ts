import { Controller, Get } from '@nestjs/common';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@CurrentBusiness() businessId: string) {
    return this.dashboardService.getStats(businessId);
  }
}
