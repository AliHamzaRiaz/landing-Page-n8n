export type PlatformCopy = {
  platform: string;
  caption: string;
  hashtags: string;
  title?: string;
  description?: string;
};

export type GeneratedCampaignContent = {
  provider: 'heuristic' | 'ai';
  caption: string;
  shortCaption: string;
  longCaption: string;
  hashtags: string[];
  callToAction: string;
  suggestedPostingTime: string;
  platforms: PlatformCopy[];
};

export interface AiProvider {
  readonly id: 'heuristic' | 'ai';
  generate(input: {
    campaignName: string;
    description?: string | null;
    platforms: string[];
    filename?: string;
  }): Promise<GeneratedCampaignContent>;
}
