import { NotFoundException } from '@nestjs/common';
import { SocialAccountsService } from './social-accounts.service';

describe('SocialAccountsService tenancy', () => {
  it('does not let business A disconnect business B accounts', async () => {
    const prisma = {
      socialAccount: { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() },
    };
    const service = new SocialAccountsService(prisma as never, {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    } as never);
    await expect(service.disconnect('biz_a', 'acc_from_b')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.socialAccount.update).not.toHaveBeenCalled();
  });
});
