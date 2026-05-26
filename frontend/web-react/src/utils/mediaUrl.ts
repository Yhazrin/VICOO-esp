/**
 * Converts relative static paths returned by the API (e.g. /static/uploads/...)
 * to URLs the browser can request. Vite proxies /static in development;
 * in production it is typically same-origin or gateway-forwarded.
 */
export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}
