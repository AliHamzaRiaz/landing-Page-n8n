import { Controller, Get } from '@nestjs/common';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async summary(@CurrentBusiness() businessId: string) {
    const [campaigns, posts, accounts] = await Promise.all([
      this.prisma.campaign.groupBy({ by: ['status'], where: { businessId }, _count: { _all: true } }),
      this.prisma.campaignPost.groupBy({
        by: ['status', 'platform'],
        where: { businessId },
        _count: { _all: true },
      }),
      this.prisma.socialAccount.count({ where: { businessId, status: 'CONNECTED' } }),
    ]);

    const postStatus: Record<string, number> = {};
    const platformBreakdown: Record<string, number> = {};
    for (const row of posts) {
      postStatus[row.status] = (postStatus[row.status] || 0) + row._count._all;
      platformBreakdown[row.platform] = (platformBreakdown[row.platform] || 0) + row._count._all;
    }

    const campaignStatus: Record<string, number> = {};
    for (const row of campaigns) {
      campaignStatus[row.status] = row._count._all;
    }

    const recent = await this.prisma.campaignPost.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        platform: true,
        status: true,
        publishedAt: true,
        scheduledAt: true,
        errorMessage: true,
        campaign: { select: { name: true } },
      },
    });

    return {
      totals: {
        campaigns: Object.values(campaignStatus).reduce((sum, n) => sum + n, 0),
        activeCampaigns: campaignStatus.ACTIVE || 0,
        scheduledPosts: postStatus.SCHEDULED || 0,
        publishedPosts: postStatus.PUBLISHED || 0,
        failedPosts: postStatus.FAILED || 0,
        connectedAccounts: accounts,
      },
      campaignStatus,
      postStatus,
      platformBreakdown,
      history: recent,
    };
  }
}
