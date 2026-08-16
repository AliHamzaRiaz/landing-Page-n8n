import { BadRequestException, Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PostStatus, PublishingJobStatus } from '@prisma/client';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PublishingProcessor } from './publishing.processor';

class SchedulePostDto {
  @IsDateString()
  scheduledAt!: string;
}

class ListPostsDto {
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}

@Controller('posts')
export class PostsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: PublishingProcessor,
  ) {}

  @Get()
  async list(@CurrentBusiness() businessId: string, @Query() query: ListPostsDto) {
    const rows = await this.prisma.campaignPost.findMany({
      where: { businessId, ...(query.status ? { status: query.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        campaignId: row.campaignId,
        platform: row.platform,
        status: row.status,
        scheduledAt: row.scheduledAt,
        publishedAt: row.publishedAt,
        errorMessage: row.errorMessage,
        caption: row.caption,
        hashtags: row.hashtags,
      })),
    };
  }

  @Post(':id/publish')
  async publishNow(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    const post = await this.prisma.campaignPost.findFirst({ where: { id, businessId } });
    if (!post) throw new BadRequestException('Post not found.');
    await this.prisma.campaignPost.update({
      where: { id },
      data: { status: PostStatus.PENDING, scheduledAt: null },
    });
    await this.processor.enqueueNow(id);
    return { queued: true };
  }

  @Post(':id/schedule')
  async schedule(
    @CurrentBusiness() businessId: string,
    @Param('id') id: string,
    @Body() dto: SchedulePostDto,
  ) {
    const post = await this.prisma.campaignPost.findFirst({ where: { id, businessId } });
    if (!post) throw new BadRequestException('Post not found.');
    const when = new Date(dto.scheduledAt);
    await this.prisma.campaignPost.update({
      where: { id },
      data: { status: PostStatus.SCHEDULED, scheduledAt: when },
    });
    await this.processor.enqueueNow(id);
    await this.prisma.publishingJob.updateMany({
      where: { postId: id, status: { in: [PublishingJobStatus.PENDING, PublishingJobStatus.RETRYING] } },
      data: { nextRunAt: when },
    });
    return { scheduled: true, scheduledAt: when };
  }
}
