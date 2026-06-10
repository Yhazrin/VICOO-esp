/**
 * Completes relative asset paths returned by the API into loadable absolute URLs.
 * e.g. when a stock cover_image is /static/campaigns/x.jpg and the frontend and API
 * are on different origins, the browser requests the relative path against the site
 * domain instead of the API, causing a 404. Common in production.
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
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (base && (base.startsWith('http://') || base.startsWith('https://'))) {
    return new URL(u, new URL(base).origin).href;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${u}`;
  }
  return u;
}
