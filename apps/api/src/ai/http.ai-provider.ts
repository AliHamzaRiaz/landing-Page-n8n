import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { HeuristicAiProvider } from './heuristic.ai-provider';
import type { AiProvider, GeneratedCampaignContent } from './ai.types';

export class HttpAiProvider implements AiProvider {
  readonly id = 'ai' as const;
  private readonly fallback = new HeuristicAiProvider();

  constructor(private readonly config: ConfigService) {}

  async generate(input: {
    campaignName: string;
    description?: string | null;
    platforms: string[];
    filename?: string;
  }): Promise<GeneratedCampaignContent> {
    const key = this.config.get<string>('AI_API_KEY')?.trim();
    if (!key) {
      return this.fallback.generate(input);
    }

    const base = (this.config.get<string>('AI_BASE_URL') || 'https://api.openai.com/v1').replace(
      /\/+$/,
      '',
    );
    const model = this.config.get<string>('AI_MODEL') || 'gpt-4o-mini';

    try {
      const response = await axios.post(
        `${base}/chat/completions`,
        {
          model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'Return JSON with caption, shortCaption, longCaption, hashtags (string array), callToAction, suggestedPostingTime, platforms: [{platform, caption, hashtags, title?, description?}]. No secrets.',
            },
            {
              role: 'user',
              content: JSON.stringify(input),
            },
          ],
        },
        {
          timeout: 20_000,
          headers: { Authorization: `Bearer ${key}` },
        },
      );

      const raw = response.data?.choices?.[0]?.message?.content;
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as GeneratedCampaignContent) : null;
      if (!parsed?.caption) {
        return this.fallback.generate(input);
      }
      return { ...parsed, provider: 'ai' };
    } catch {
      return this.fallback.generate(input);
    }
  }
}
