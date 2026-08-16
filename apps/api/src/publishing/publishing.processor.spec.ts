import { PublishingJobStatus } from '@prisma/client';
import { PublishingProcessor } from './publishing.processor';

describe('PublishingProcessor', () => {
  it('does not enqueue a second in-flight job for the same post', async () => {
    const existing = { id: 'job_1', postId: 'post_1' };
    const prisma = {
      publishingJob: {
        findFirst: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue(existing),
        create: jest.fn(),
      },
    };
    const processor = new PublishingProcessor(
      prisma as never,
      {} as never,
      { create: jest.fn() } as never,
    );
    await processor.enqueueNow('post_1');
    expect(prisma.publishingJob.create).not.toHaveBeenCalled();
    expect(prisma.publishingJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job_1' },
        data: expect.objectContaining({ status: PublishingJobStatus.PENDING }),
      }),
    );
  });
});
