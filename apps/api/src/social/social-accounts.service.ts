import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SocialConnectionStatus,
  SocialPlatform,
  type SocialAccount,
} from '@prisma/client';
import axios from 'axios';
import { encryptionSecret } from '../common/env/production-guards';
import { decryptSecret, encryptSecret } from '../common/crypto/token-crypto';
import { PrismaService } from '../prisma/prisma.service';
import { parsePlatform, signOAuthState, verifyOAuthState } from './oauth-state';
import { DocumentedPublisher } from './publishers/documented.publisher';
import { MetaGraphPublisher } from './publishers/meta-graph.publisher';
import type { SocialPublisher } from './publishers/publisher.types';
import { sanitizeSocialAccount } from './social-account.sanitize';

const META_SCOPES: Record<'FACEBOOK' | 'INSTAGRAM', string> = {
  FACEBOOK: 'pages_show_list,pages_manage_posts,pages_read_engagement',
  INSTAGRAM:
    'pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish',
};

@Injectable()
export class SocialAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async list(businessId: string) {
    const rows = await this.prisma.socialAccount.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: rows.map(sanitizeSocialAccount) };
  }

  async startConnect(businessId: string, userId: string, platformRaw: string) {
    let platform: SocialPlatform;
    try {
      platform = parsePlatform(platformRaw);
    } catch {
      throw new BadRequestException('Unsupported platform.');
    }
    const frontend = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const apiBase = (
      this.config.get<string>('PUBLIC_API_URL') ||
      `http://localhost:${this.config.get('API_PORT') || 3001}/api`
    ).replace(/\/+$/, '');
    const redirectUri = `${apiBase}/social-accounts/${platform.toLowerCase()}/callback`;
    const state = signOAuthState(this.config.getOrThrow('JWT_SECRET'), {
      businessId,
      userId,
      platform,
      exp: String(Date.now() + 15 * 60_000),
    });

    if (platform === 'FACEBOOK' || platform === 'INSTAGRAM') {
      const appId = this.config.get<string>('META_APP_ID')?.trim();
      if (!appId) {
        throw new BadRequestException(
          'META_APP_ID is required for Facebook/Instagram OAuth. Add the Facebook Login product to the Meta app (separate from WhatsApp Embedded Signup).',
        );
      }
      const url = new URL('https://www.facebook.com/v21.0/dialog/oauth');
      url.searchParams.set('client_id', appId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('state', state);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', META_SCOPES[platform]);
      return { authorizationUrl: url.toString() };
    }

    throw new BadRequestException(missingOauthMessage(platform, frontend));
  }

  async handleCallback(platformRaw: string, query: { code?: string; state?: string; error?: string }) {
    const frontend = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173').replace(
      /\/+$/,
      '',
    );
    if (query.error || !query.code || !query.state) {
      return `${frontend}/social-accounts?error=${encodeURIComponent(query.error || 'oauth_denied')}`;
    }

    let payload: Record<string, string>;
    try {
      payload = verifyOAuthState(this.config.getOrThrow('JWT_SECRET'), query.state);
    } catch {
      return `${frontend}/social-accounts?error=invalid_state`;
    }
    if (Number(payload.exp) < Date.now()) {
      return `${frontend}/social-accounts?error=state_expired`;
    }

    let platform: SocialPlatform;
    try {
      platform = parsePlatform(platformRaw);
    } catch {
      return `${frontend}/social-accounts?error=unsupported_platform`;
    }
    try {
      if (platform === 'FACEBOOK' || platform === 'INSTAGRAM') {
        await this.completeMetaOAuth(payload.businessId, platform, query.code);
      } else {
        throw new BadRequestException(missingOauthMessage(platform, frontend));
      }
      return `${frontend}/social-accounts?connected=${platform.toLowerCase()}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'oauth_failed';
      return `${frontend}/social-accounts?error=${encodeURIComponent(message.slice(0, 120))}`;
    }
  }

  async disconnect(businessId: string, id: string) {
    const row = await this.requireAccount(businessId, id);
    await this.prisma.socialAccount.update({
      where: { id: row.id },
      data: {
        status: SocialConnectionStatus.DISCONNECTED,
        accessTokenEncrypted: encryptSecret('revoked', encryptionSecret(this.config)),
        refreshTokenEncrypted: null,
        lastError: 'Disconnected by user',
      },
    });
    return { disconnected: true };
  }

  async reconnect(businessId: string, userId: string, id: string) {
    const row = await this.requireAccount(businessId, id);
    return this.startConnect(businessId, userId, row.platform.toLowerCase());
  }

  async test(businessId: string, id: string) {
    const row = await this.requireAccount(businessId, id);
    if (row.status === SocialConnectionStatus.DISCONNECTED) {
      throw new BadRequestException('Account is disconnected. Reconnect first.');
    }
    try {
      if (row.platform === 'FACEBOOK' || row.platform === 'INSTAGRAM') {
        const token = this.decryptAccessToken(row);
        const version = this.config.get('META_GRAPH_API_VERSION') || 'v21.0';
        await axios.get(`https://graph.facebook.com/${version}/${row.accountId}`, {
          params: { fields: 'id,name', access_token: token },
          timeout: 15_000,
        });
      } else {
        throw new BadRequestException(
          `Live connection test for ${row.platform} requires that platform’s official app. Reconnect after approval.`,
        );
      }
      await this.prisma.socialAccount.update({
        where: { id: row.id },
        data: {
          lastTestedAt: new Date(),
          lastError: null,
          status: SocialConnectionStatus.CONNECTED,
        },
      });
      return { ok: true };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      const message = err instanceof Error ? err.message : 'Connection test failed.';
      await this.prisma.socialAccount.update({
        where: { id: row.id },
        data: {
          lastTestedAt: new Date(),
          lastError: message.slice(0, 240),
          status: SocialConnectionStatus.EXPIRED,
        },
      });
      throw new BadRequestException('Connection expired. Reconnect the account.');
    }
  }

  publisherFor(platform: SocialPlatform): SocialPublisher {
    if (platform === 'FACEBOOK' || platform === 'INSTAGRAM') {
      return new MetaGraphPublisher(this.config.get('META_GRAPH_API_VERSION') || 'v21.0');
    }
    return new DocumentedPublisher(platform);
  }

  decryptAccessToken(account: SocialAccount) {
    return decryptSecret(account.accessTokenEncrypted, encryptionSecret(this.config));
  }

  private async requireAccount(businessId: string, id: string) {
    const row = await this.prisma.socialAccount.findFirst({ where: { id, businessId } });
    if (!row) throw new NotFoundException('Social account not found.');
    return row;
  }

  private async completeMetaOAuth(
    businessId: string,
    platform: 'FACEBOOK' | 'INSTAGRAM',
    code: string,
  ) {
    const appId = this.config.getOrThrow('META_APP_ID');
    const secret = this.config.getOrThrow('META_APP_SECRET');
    const apiBase = (
      this.config.get<string>('PUBLIC_API_URL') ||
      `http://localhost:${this.config.get('API_PORT') || 3001}/api`
    ).replace(/\/+$/, '');
    const redirectUri = `${apiBase}/social-accounts/${platform.toLowerCase()}/callback`;
    const version = this.config.get('META_GRAPH_API_VERSION') || 'v21.0';
    const tokenRes = await axios.get(`https://graph.facebook.com/${version}/oauth/access_token`, {
      params: {
        client_id: appId,
        client_secret: secret,
        redirect_uri: redirectUri,
        code,
      },
      timeout: 20_000,
    });
    const userToken = tokenRes.data?.access_token as string | undefined;
    if (!userToken) throw new BadRequestException('Meta did not return an access token.');

    const pages = await axios.get(`https://graph.facebook.com/${version}/me/accounts`, {
      params: { access_token: userToken, fields: 'id,name,access_token,instagram_business_account' },
      timeout: 20_000,
    });
    const page = pages.data?.data?.[0] as
      | {
          id: string;
          name: string;
          access_token: string;
          instagram_business_account?: { id: string };
        }
      | undefined;
    if (!page) {
      throw new BadRequestException('No Facebook Page found. Grant Page access during OAuth.');
    }

    const accountId =
      platform === 'INSTAGRAM' ? page.instagram_business_account?.id : page.id;
    const accountName = page.name;
    if (!accountId) {
      throw new BadRequestException(
        'No Instagram professional account is linked to this Page.',
      );
    }

    const encrypted = encryptSecret(page.access_token, encryptionSecret(this.config));
    await this.prisma.socialAccount.upsert({
      where: {
        businessId_platform_accountId: { businessId, platform, accountId },
      },
      update: {
        accountName,
        accessTokenEncrypted: encrypted,
        status: SocialConnectionStatus.CONNECTED,
        lastError: null,
        connectedAt: new Date(),
        tokenExpiresAt: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
      },
      create: {
        businessId,
        platform,
        accountId,
        accountName,
        accessTokenEncrypted: encrypted,
        status: SocialConnectionStatus.CONNECTED,
        tokenExpiresAt: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
      },
    });
  }
}

function missingOauthMessage(platform: SocialPlatform, _frontend: string) {
  if (platform === 'TIKTOK') {
    return 'TikTok Content Posting API requires TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, and TikTok app review. Tokens are not stored until that app is approved.';
  }
  if (platform === 'YOUTUBE') {
    return 'YouTube Data API requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and Google Cloud OAuth consent. Connect is disabled until those are set.';
  }
  return 'LinkedIn Community Management API requires LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LinkedIn app approval.';
}
