import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeuristicAiProvider } from './heuristic.ai-provider';
import { HttpAiProvider } from './http.ai-provider';
import type { AiProvider, GeneratedCampaignContent } from './ai.types';

@Injectable()
export class AiContentService {
  private readonly provider: AiProvider;

  constructor(config: ConfigService) {
    this.provider = config.get<string>('AI_API_KEY')?.trim()
      ? new HttpAiProvider(config)
      : new HeuristicAiProvider();
  }

  generateCaption(input: {
    campaignName: string;
    description?: string | null;
    platforms: string[];
    filename?: string;
  }): Promise<GeneratedCampaignContent> {
    return this.provider.generate(input);
  }

  generateHashtags(input: {
    campaignName: string;
    description?: string | null;
    platforms: string[];
    filename?: string;
  }) {
    return this.provider.generate(input).then((result) => result.hashtags);
  }

  generatePlatformContent(input: {
    campaignName: string;
    description?: string | null;
    platforms: string[];
    filename?: string;
  }) {
    return this.provider.generate(input).then((result) => result.platforms);
  }

  suggestPostingTime(input: {
    campaignName: string;
    description?: string | null;
    platforms: string[];
    filename?: string;
  }) {
    return this.provider.generate(input).then((result) => result.suggestedPostingTime);
  }
}
