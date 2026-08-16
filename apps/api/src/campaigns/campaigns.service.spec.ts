import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';

describe('CampaignsService tenancy', () => {
  it('does not return another business campaign', async () => {
    const prisma = {
      campaign: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new CampaignsService(prisma as never, { generateCaption: jest.fn() } as never);
    await expect(service.get('biz_a', 'camp_from_b')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.campaign.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'camp_from_b', businessId: 'biz_a' } }),
    );
  });

  it('refuses confirm without media', async () => {
    const prisma = {
      campaign: { findFirst: jest.fn().mockResolvedValue({ id: 'c1', timezone: 'UTC' }) },
      campaignMedia: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new CampaignsService(prisma as never, { generateCaption: jest.fn() } as never);
    await expect(
      service.confirm('biz_a', 'c1', {
        postingType: 'NOW',
        platforms: ['INSTAGRAM'],
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
