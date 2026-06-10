import type { TFunction, i18n as I18nType } from 'i18next';
import type { Campaign } from '@/types';

/** Matches the title literals in seed / add_campaigns_demo; does not rely on auto-increment IDs */
export const CAMPAIGN_TITLE_TO_KEY: Record<string, string> = {
  '春天的色彩 — 乡村儿童画展': 'springExhibition',
  '我的家乡 — 故土记忆': 'hometownMemories',
  '画出未来 — 科技与梦想': 'futureAndDreams',
  '童心织梦 — 可持续材料工作坊': 'sustainableWorkshop',
  '云岭之声 — 乡村儿童合唱团': 'mountainChoir',
};

function excerptText(text: string, max: number): string {
  if (!text?.trim()) return '';
  const one = text.replace(/\s+/g, ' ').trim();
  return one.length <= max ? one : `${one.slice(0, max)}…`;
}

/**
 * English locale uses campaigns.items.<key> from en.json; other languages use the raw API text.
 * Campaigns without a mapping always use the API title/description;
 * when subtitle is missing, a truncated description is used.
 */
export function getLocalizedCampaignCopy(
  campaign: Campaign,
  t: TFunction,
  i18n: I18nType
): { title: string; subtitle: string; description: string } {
  const key = CAMPAIGN_TITLE_TO_KEY[campaign.title];
  const fromApi: { title: string; subtitle: string; description: string } = {
    title: campaign.title,
    subtitle: (campaign.subtitle || '').trim() || excerptText(campaign.description, 100),
    description: campaign.description,
  };
  if (!key) {
    return fromApi;
  }
  const base = `campaigns.items.${key}`;
  const isEn = (i18n.language || '').toLowerCase().startsWith('en');
  if (isEn) {
    return {
      title: t(`${base}.title`, { defaultValue: campaign.title }),
      subtitle: t(`${base}.subtitle`, { defaultValue: fromApi.subtitle }),
      description: t(`${base}.description`, { defaultValue: campaign.description }),
    };
  }
  return fromApi;
}
