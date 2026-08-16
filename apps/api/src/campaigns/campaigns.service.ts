import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CampaignPostingType,
  CampaignStatus,
  PostStatus,
  Prisma,
  PublishingJobStatus,
  SocialConnectionStatus,
  SocialPlatform,
} from '@prisma/client';
import { AiContentService } from '../ai/ai-content.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmCampaignDto, CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiContentService,
  ) {}

  list(businessId: string) {
    return this.prisma.campaign.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { media: true, posts: true } } },
    });
  }

  async get(businessId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, businessId },
      include: {
        media: true,
        posts: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found.');
    return {
      ...campaign,
      media: campaign.media.map((item) => ({
        id: item.id,
        filename: item.filename,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        publicUrl: item.publicUrl,
        status: item.status,
        createdAt: item.createdAt,
      })),
      posts: campaign.posts.map((post) => ({
        id: post.id,
        platform: post.platform,
        caption: post.caption,
        hashtags: post.hashtags,
        status: post.status,
        scheduledAt: post.scheduledAt,
        publishedAt: post.publishedAt,
        externalPostId: post.externalPostId,
        errorMessage: post.errorMessage,
      })),
    };
  }

  create(businessId: string, userId: string, dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        businessId,
        createdByUserId: userId,
        name: dto.name,
        description: dto.description,
        platforms: dto.platforms ?? [],
      },
    });
  }

  async update(businessId: string, id: string, dto: UpdateCampaignDto) {
    await this.require(businessId, id);
    return this.prisma.campaign.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(businessId: string, id: string) {
    await this.require(businessId, id);
    await this.prisma.campaign.delete({ where: { id } });
    return { deleted: true };
  }

  async generateContent(businessId: string, id: string) {
    const campaign = await this.require(businessId, id);
    const media = await this.prisma.campaignMedia.findFirst({
      where: { campaignId: id, businessId },
      orderBy: { createdAt: 'desc' },
    });
    const content = await this.ai.generateCaption({
      campaignName: campaign.name,
      description: campaign.description,
      platforms: campaign.platforms,
      filename: media?.filename,
    });
    await this.prisma.campaign.update({
      where: { id },
      data: { aiContent: content as unknown as Prisma.InputJsonValue },
    });
    return content;
  }

  async confirm(businessId: string, id: string, dto: ConfirmCampaignDto) {
    const campaign = await this.require(businessId, id);
    const media = await this.prisma.campaignMedia.findFirst({
      where: { campaignId: id, businessId },
      orderBy: { createdAt: 'desc' },
    });
    if (!media) {
      throw new BadRequestException('Upload at least one image or video before confirming.');
    }
    if (dto.postingType === CampaignPostingType.SCHEDULE && !dto.scheduledAt) {
      throw new BadRequestException('scheduledAt is required for scheduled campaigns.');
    }

    const scheduledAt =
      dto.postingType === CampaignPostingType.SCHEDULE ? new Date(dto.scheduledAt!) : null;
    const status =
      dto.postingType === CampaignPostingType.DRAFT
        ? CampaignStatus.DRAFT
        : dto.postingType === CampaignPostingType.SCHEDULE
          ? CampaignStatus.SCHEDULED
          : CampaignStatus.ACTIVE;

    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        postingType: dto.postingType,
        platforms: dto.platforms,
        scheduledAt,
        timezone: dto.timezone || campaign.timezone,
        status,
      },
    });

    const posts = [];
    for (const platform of dto.platforms) {
      const account = await this.prisma.socialAccount.findFirst({
        where: { businessId, platform, status: SocialConnectionStatus.CONNECTED },
      });
      const copy = dto.captions?.[platform] ?? {};
      const idempotencyKey = `${campaign.id}:${platform}:${media.id}:${dto.postingType}:${scheduledAt?.toISOString() ?? 'now'}`;
      const existing = await this.prisma.campaignPost.findUnique({ where: { idempotencyKey } });
      if (existing) {
        posts.push(existing);
        continue;
      }

      const postStatus =
        dto.postingType === CampaignPostingType.DRAFT
          ? PostStatus.DRAFT
          : dto.postingType === CampaignPostingType.SCHEDULE
            ? PostStatus.SCHEDULED
            : PostStatus.PENDING;

      const post = await this.prisma.campaignPost.create({
        data: {
          businessId,
          campaignId: campaign.id,
          socialAccountId: account?.id,
          mediaId: media.id,
          platform,
          caption: copy.caption ?? '',
          hashtags: copy.hashtags ?? '',
          scheduledAt,
          status: postStatus,
          idempotencyKey,
          errorMessage: account ? null : `No connected ${platform} account.`,
        },
      });

      if (dto.postingType !== CampaignPostingType.DRAFT) {
        await this.prisma.publishingJob.create({
          data: {
            postId: post.id,
            status: PublishingJobStatus.PENDING,
            nextRunAt: scheduledAt ?? new Date(),
          },
        });
      }
      posts.push(post);
    }

    return { campaignId: campaign.id, posts: posts.map((post) => ({ id: post.id, platform: post.platform, status: post.status })) };
  }

  private async require(businessId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id, businessId } });
    if (!campaign) throw new NotFoundException('Campaign not found.');
    return campaign;
  }
}
