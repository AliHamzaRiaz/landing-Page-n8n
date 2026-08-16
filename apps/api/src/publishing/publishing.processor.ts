import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationType,
  PostStatus,
  PublishingJobStatus,
  SocialConnectionStatus,
} from '@prisma/client';
import { AxiosError } from 'axios';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { PublishBlockedError } from '../social/publishers/publisher.types';
import { SocialAccountsService } from '../social/social-accounts.service';

@Injectable()
export class PublishingProcessor {
  private readonly logger = new Logger(PublishingProcessor.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly social: SocialAccountsService,
    private readonly notifications: NotificationsService,
  ) {}

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, 15_000);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const due = await this.prisma.publishingJob.findMany({
        where: {
          status: { in: [PublishingJobStatus.PENDING, PublishingJobStatus.RETRYING] },
          nextRunAt: { lte: new Date() },
        },
        orderBy: { nextRunAt: 'asc' },
        take: 5,
        include: {
          post: {
            include: { media: true, socialAccount: true },
          },
        },
      });
      for (const job of due) {
        await this.process(job.id);
      }
    } catch (err) {
      this.logger.error(err instanceof Error ? err.message : err);
    } finally {
      this.running = false;
    }
  }

  async enqueueNow(postId: string) {
    const existing = await this.prisma.publishingJob.findFirst({
      where: {
        postId,
        status: { in: [PublishingJobStatus.PENDING, PublishingJobStatus.RETRYING, PublishingJobStatus.PROCESSING] },
      },
    });
    if (existing) {
      return this.prisma.publishingJob.update({
        where: { id: existing.id },
        data: { nextRunAt: new Date(), status: PublishingJobStatus.PENDING },
      });
    }
    return this.prisma.publishingJob.create({
      data: { postId, nextRunAt: new Date(), status: PublishingJobStatus.PENDING },
    });
  }

  private async process(jobId: string) {
    const locked = await this.prisma.publishingJob.updateMany({
      where: {
        id: jobId,
        status: { in: [PublishingJobStatus.PENDING, PublishingJobStatus.RETRYING] },
      },
      data: { status: PublishingJobStatus.PROCESSING, lockedAt: new Date() },
    });
    if (locked.count !== 1) return;

    const job = await this.prisma.publishingJob.findUnique({
      where: { id: jobId },
      include: { post: { include: { media: true, socialAccount: true, campaign: true } } },
    });
    if (!job) return;
    const post = job.post;

    if (post.status === PostStatus.PUBLISHED && post.externalPostId) {
      await this.prisma.publishingJob.update({
        where: { id: job.id },
        data: { status: PublishingJobStatus.SUCCEEDED, lastError: null },
      });
      return;
    }

    try {
      if (!post.socialAccount || post.socialAccount.status !== SocialConnectionStatus.CONNECTED) {
        throw new PublishBlockedError(`No connected ${post.platform} account.`);
      }
      const token = this.social.decryptAccessToken(post.socialAccount);
      const result = await this.social.publisherFor(post.platform).publish({
        platform: post.platform,
        accountId: post.socialAccount.accountId,
        accountName: post.socialAccount.accountName,
        accessToken: token,
        caption: post.caption,
        hashtags: post.hashtags,
        publicMediaUrl: post.media?.publicUrl ?? null,
        mimeType: post.media?.mimeType ?? null,
      });

      await this.prisma.campaignPost.update({
        where: { id: post.id },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
          externalPostId: result.externalPostId,
          errorMessage: null,
        },
      });
      await this.prisma.publishingJob.update({
        where: { id: job.id },
        data: { status: PublishingJobStatus.SUCCEEDED, lastError: null, attempts: job.attempts + 1 },
      });
      await this.notifications.create(post.businessId, {
        type: NotificationType.CAMPAIGN_PUBLISHED,
        title: 'Post published',
        message: `${post.platform} post for ${post.campaign.name} is live.`,
        metadata: { postId: post.id, platform: post.platform },
      });
    } catch (err) {
      const message = errorMessage(err);
      const permanent = err instanceof PublishBlockedError || isAuthError(err);
      const attempts = job.attempts + 1;
      const exhausted = permanent || attempts >= job.maxAttempts;

      await this.prisma.campaignPost.update({
        where: { id: post.id },
        data: {
          status: exhausted ? PostStatus.FAILED : PostStatus.PENDING,
          errorMessage: message,
        },
      });
      await this.prisma.publishingJob.update({
        where: { id: job.id },
        data: {
          attempts,
          lastError: message,
          status: exhausted ? PublishingJobStatus.FAILED : PublishingJobStatus.RETRYING,
          nextRunAt: exhausted ? new Date() : new Date(Date.now() + 2 ** attempts * 30_000),
        },
      });
      if (isAuthError(err) && post.socialAccountId) {
        await this.prisma.socialAccount.update({
          where: { id: post.socialAccountId },
          data: { status: SocialConnectionStatus.EXPIRED, lastError: message.slice(0, 240) },
        });
        await this.notifications.create(post.businessId, {
          type: NotificationType.SOCIAL_EXPIRED,
          title: 'Social account expired',
          message: `Reconnect ${post.platform} to keep publishing.`,
          metadata: { accountId: post.socialAccountId, platform: post.platform },
        });
      }
      if (exhausted) {
        await this.notifications.create(post.businessId, {
          type: NotificationType.POST_FAILED,
          title: 'Post failed',
          message: `${post.platform}: ${message}`,
          metadata: { postId: post.id },
        });
      }
    }
  }
}

function errorMessage(err: unknown) {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message || err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Publishing failed.';
}

function isAuthError(err: unknown) {
  if (err instanceof AxiosError) {
    return err.response?.status === 401 || err.response?.status === 403;
  }
  return false;
}
