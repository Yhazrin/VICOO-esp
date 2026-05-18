/**
 * 扫码支付页完整 URL 的「站点根」。
 * 开发机用 localhost 时，手机无法访问，请在 .env 中设置 VITE_PUBLIC_SITE_ORIGIN
 *（例如本机局域网 http://192.168.1.5:9111 或线上 https://your.domain）。
 */
export function getPublicSiteOrigin(): string {
  const raw = import.meta.env.VITE_PUBLIC_SITE_ORIGIN?.trim();
  if (raw) {
    return raw.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}
