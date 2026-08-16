import axios from 'axios';
import { PublishBlockedError, type PublishInput, type PublishResult, type SocialPublisher } from './publisher.types';

export class MetaGraphPublisher implements SocialPublisher {
  constructor(private readonly graphVersion = 'v21.0') {}

  async publish(input: PublishInput): Promise<PublishResult> {
    if (!input.publicMediaUrl) {
      throw new PublishBlockedError(
        'A public media URL is required for Meta publishing. Configure STORAGE_PUBLIC_BASE_URL (S3) so Facebook/Instagram can fetch the file.',
      );
    }

    const base = `https://graph.facebook.com/${this.graphVersion}`;
    if (input.platform === 'INSTAGRAM') {
      const container = await axios.post(
        `${base}/${input.accountId}/media`,
        {
          caption: `${input.caption}\n${input.hashtags}`.trim(),
          ...(input.mimeType?.startsWith('video/')
            ? { media_type: 'REELS', video_url: input.publicMediaUrl }
            : { image_url: input.publicMediaUrl }),
        },
        { params: { access_token: input.accessToken }, timeout: 30_000 },
      );
      const creationId = container.data?.id as string | undefined;
      if (!creationId) {
        throw new PublishBlockedError('Instagram did not return a media container id.');
      }
      const published = await axios.post(
        `${base}/${input.accountId}/media_publish`,
        { creation_id: creationId },
        { params: { access_token: input.accessToken }, timeout: 30_000 },
      );
      const id = published.data?.id as string | undefined;
      if (!id) throw new PublishBlockedError('Instagram publish did not return a post id.');
      return { externalPostId: id };
    }

    const endpoint = input.mimeType?.startsWith('video/')
      ? `${base}/${input.accountId}/videos`
      : `${base}/${input.accountId}/photos`;
    const body = input.mimeType?.startsWith('video/')
      ? { file_url: input.publicMediaUrl, description: `${input.caption}\n${input.hashtags}`.trim() }
      : { url: input.publicMediaUrl, caption: `${input.caption}\n${input.hashtags}`.trim() };
    const posted = await axios.post(endpoint, body, {
      params: { access_token: input.accessToken },
      timeout: 30_000,
    });
    const id = (posted.data?.id || posted.data?.post_id) as string | undefined;
    if (!id) throw new PublishBlockedError('Facebook did not return a post id.');
    return { externalPostId: id };
  }
}
