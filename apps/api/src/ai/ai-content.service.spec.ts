import { describe, expect, it } from '@jest/globals';
import { HeuristicAiProvider } from './heuristic.ai-provider';
import { sanitizeSocialAccount } from '../social/social-account.sanitize';
import { SocialConnectionStatus, SocialPlatform } from '@prisma/client';
import { signOAuthState, verifyOAuthState } from '../social/oauth-state';

describe('HeuristicAiProvider', () => {
  it('returns editable copy without pretending a live LLM ran', async () => {
    const provider = new HeuristicAiProvider();
    const result = await provider.generate({
      campaignName: 'Summer sale',
      platforms: ['INSTAGRAM', 'TIKTOK'],
    });
    expect(result.provider).toBe('heuristic');
    expect(result.caption.toLowerCase()).toContain('summer');
    expect(result.platforms).toHaveLength(2);
  });
});

describe('sanitizeSocialAccount', () => {
  it('never returns encrypted tokens', () => {
    const safe = sanitizeSocialAccount({
      id: 'acc_1',
      businessId: 'biz_a',
      platform: SocialPlatform.INSTAGRAM,
      accountId: '1789',
      accountName: 'Shop',
      accessTokenEncrypted: 'SUPER_SECRET',
      refreshTokenEncrypted: 'REFRESH_SECRET',
      tokenExpiresAt: null,
      scopes: null,
      metadata: null,
      status: SocialConnectionStatus.CONNECTED,
      lastError: null,
      lastTestedAt: null,
      connectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(JSON.stringify(safe)).not.toMatch(/SUPER_SECRET|REFRESH_SECRET|accessToken/i);
    expect(safe.accountName).toBe('Shop');
  });
});

describe('oauth state', () => {
  it('rejects tampered state', () => {
    const secret = 'test-secret';
    const state = signOAuthState(secret, { businessId: 'biz_a', platform: 'INSTAGRAM' });
    expect(verifyOAuthState(secret, state).businessId).toBe('biz_a');
    expect(() => verifyOAuthState(secret, state.replace(/.$/, 'x'))).toThrow();
  });
});
