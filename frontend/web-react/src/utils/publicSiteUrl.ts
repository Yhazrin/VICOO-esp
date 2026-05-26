/**
 * "Site root" for the full URL of the QR-code payment page.
 * When using localhost on a dev machine, mobile devices cannot access it.
 * Set VITE_PUBLIC_SITE_ORIGIN in .env (e.g. local LAN http://192.168.1.5:9111
 * or production https://your.domain).
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
