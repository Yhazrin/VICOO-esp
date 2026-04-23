import type { Product } from '@/types';

/** True when the UI should prefer English product copy from the API. */
export function isEnglishProductLocale(lang: string | undefined): boolean {
  if (!lang || typeof lang !== 'string') return false;
  const b = lang.toLowerCase();
  return b === 'en' || b.startsWith('en-');
}

/**
 * Resolves name / description / trace story for the current language.
 * When English is active and a field has `*_en`, it wins; else falls back to primary DB fields.
 */
export function resolveProductLocale(product: Product, lang: string | undefined): {
  name: string;
  description: string;
  traceStoryTitle: string;
  traceStoryContent: string;
} {
  const en = isEnglishProductLocale(lang);
  const name = (en && product.nameEn?.trim()) || product.name || '';
  const description = (en && product.descriptionEn?.trim()) || product.description || '';
  const traceStoryTitle = (en && product.traceStoryTitleEn?.trim()) || (product.traceStoryTitle ?? '') || '';
  const traceStoryContent = (en && product.traceStoryContentEn?.trim()) || (product.traceStoryContent ?? '') || '';
  return { name, description, traceStoryTitle, traceStoryContent };
}
