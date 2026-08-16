import type { SocialPlatform } from '@prisma/client';

export type PublishInput = {
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  accessToken: string;
  caption: string;
  hashtags: string;
  publicMediaUrl: string | null;
  mimeType: string | null;
};

export type PublishResult = {
  externalPostId: string;
};

export interface SocialPublisher {
  publish(input: PublishInput): Promise<PublishResult>;
}

export class PublishBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishBlockedError';
  }
}
