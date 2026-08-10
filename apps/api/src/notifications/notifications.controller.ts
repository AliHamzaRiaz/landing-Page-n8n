import { Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentBusiness() businessId: string) {
    return this.notificationsService.list(businessId);
  }

  @Patch('read-all')
  markAllRead(@CurrentBusiness() businessId: string) {
    return this.notificationsService.markAllRead(businessId);
  }

  @Patch(':id/read')
  markRead(
    @Param('id') id: string,
    @CurrentBusiness() businessId: string,
  ) {
    return this.notificationsService.markRead(id, businessId);
  }
}
