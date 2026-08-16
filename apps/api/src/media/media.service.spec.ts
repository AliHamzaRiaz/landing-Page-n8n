import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';

describe('MediaService ownership', () => {
  it('rejects unknown MIME types', async () => {
    const service = new MediaService(
      { campaign: { findFirst: jest.fn() }, campaignMedia: { create: jest.fn() } } as never,
      { save: jest.fn() } as never,
      { get: jest.fn().mockReturnValue('104857600') } as never,
    );
    await expect(
      service.upload('biz_a', 'user_a', {
        originalname: 'note.txt',
        mimetype: 'text/plain',
        size: 12,
        buffer: Buffer.from('hi'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not return another tenant media', async () => {
    const prisma = {
      campaignMedia: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new MediaService(
      prisma as never,
      { save: jest.fn() } as never,
      { get: jest.fn() } as never,
    );
    await expect(service.getOwned('biz_a', 'media_from_b')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.campaignMedia.findFirst).toHaveBeenCalledWith({
      where: { id: 'media_from_b', businessId: 'biz_a' },
    });
  });
});
