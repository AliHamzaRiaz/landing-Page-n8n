import type { SocialAccount } from '@prisma/client';

export function sanitizeSocialAccount(account: SocialAccount) {
  return {
    id: account.id,
    platform: account.platform,
    accountId: account.accountId,
    accountName: account.accountName,
    status: account.status,
    tokenExpiresAt: account.tokenExpiresAt,
    lastError: account.lastError,
    lastTestedAt: account.lastTestedAt,
    connectedAt: account.connectedAt,
    createdAt: account.createdAt,
  };
}
