import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SocialAccountsModule } from '../social/social-accounts.module';
import { PostsController } from './posts.controller';
import { PublishingProcessor } from './publishing.processor';
import { PublishingScheduler } from './publishing.scheduler';

@Module({
  imports: [SocialAccountsModule, NotificationsModule],
  controllers: [PostsController],
  providers: [PublishingProcessor, PublishingScheduler],
  exports: [PublishingProcessor],
})
export class PublishingModule {}
