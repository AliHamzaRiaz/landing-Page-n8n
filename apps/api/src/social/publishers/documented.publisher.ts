import { PublishBlockedError, type PublishInput, type PublishResult, type SocialPublisher } from './publisher.types';

export class DocumentedPublisher implements SocialPublisher {
  constructor(private readonly platformLabel: string) {}

  async publish(_input: PublishInput): Promise<PublishResult> {
    throw new PublishBlockedError(
      `${this.platformLabel} publishing is wired through official APIs only. Connect the account after the platform app is approved, and ensure STORAGE_PUBLIC_BASE_URL is set. This job was not marked published.`,
    );
  }
}
