import type { TFunction, i18n as I18nType } from 'i18next';
import type { Campaign } from '@/types';

/** 与 seed / add_campaigns_demo 中 title 字面值一致，不依赖自增 id */
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
 * 英文界面使用 en.json 中 campaigns.items.<key>；其它语言用接口原文。
 * 无映射的活动始终使用接口 title/description；副标题缺省时用 description 截断。
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
