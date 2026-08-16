import type { AiProvider, GeneratedCampaignContent, PlatformCopy } from './ai.types';

const DEFAULT_TAGS = ['#smallbusiness', '#whatsapp', '#marketing'];

export class HeuristicAiProvider implements AiProvider {
  readonly id = 'heuristic' as const;

  async generate(input: {
    campaignName: string;
    description?: string | null;
    platforms: string[];
    filename?: string;
  }): Promise<GeneratedCampaignContent> {
    const name = input.campaignName.trim() || 'Campaign';
    const desc = input.description?.trim();
    const caption = desc || `${name} — now on WhatsApp and social.`;
    const tags = [...DEFAULT_TAGS, `#${slug(name)}`].slice(0, 8);
    const platforms: PlatformCopy[] = input.platforms.map((platform) =>
      platformCopy(platform, name, caption, tags),
    );
    return {
      provider: 'heuristic',
      caption,
      shortCaption: caption.slice(0, 80),
      longCaption: desc ? `${caption}\n\n${desc}` : `${caption}\n\nSend us a message to order.`,
      hashtags: tags,
      callToAction: 'Message us on WhatsApp to order.',
      suggestedPostingTime: 'weekday 18:00 in the shop timezone',
      platforms,
    };
  }
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'shop';
}

function platformCopy(
  platform: string,
  name: string,
  caption: string,
  tags: string[],
): PlatformCopy {
  switch (platform) {
    case 'TIKTOK':
      return {
        platform,
        caption: `Watch: ${name}`,
        hashtags: tags.slice(0, 4).join(' '),
      };
    case 'LINKEDIN':
      return {
        platform,
        caption: `${name}: a practical update for our customers.`,
        hashtags: tags.slice(0, 3).join(' '),
      };
    case 'YOUTUBE':
      return {
        platform,
        caption: name,
        hashtags: tags.join(' '),
        title: name.slice(0, 90),
        description: caption,
      };
    case 'FACEBOOK':
      return {
        platform,
        caption: `${caption}\n\nTap to learn more.`,
        hashtags: tags.join(' '),
      };
    default:
      return { platform, caption, hashtags: tags.join(' ') };
  }
}
