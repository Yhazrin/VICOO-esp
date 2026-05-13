/**
 * 将 API 返回的相对资源路径补全为可加载的绝对 URL。
 * 例：库存 cover_image 为 /static/campaigns/x.jpg 时，若前端与 API 不同源，
 * 浏览器用相对路径会请求到 **站点域名** 而非 API，导致 404。生产环境常见。
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
