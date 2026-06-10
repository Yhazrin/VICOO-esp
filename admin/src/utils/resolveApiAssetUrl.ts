/**
 * Resolve API-relative asset paths (/static/...) to URLs the browser can load.
 */
export function resolveApiAssetUrl(href: string | undefined | null): string {
  if (href == null) return '';
  const u = String(href).trim();
  if (u === '') return '';
  if (/^https?:\/\//i.test(u) || u.startsWith('//') || u.startsWith('data:')) {
    return u;
  }
  if (!u.startsWith('/')) {
    return u;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${u}`;
  }
  return u;
}
