/** Normalize i18n language to API locale (`zh` | `en`). */
export function normalizeApiLocale(lang: string | undefined): 'zh' | 'en' {
  if (!lang) return 'zh';
  return lang.toLowerCase().startsWith('en') ? 'en' : 'zh';
}
