/**
 * When placing an order from local Docker and opening "/payment/confirm" (deployed
 * only on a VM) on a phone, the apiBase= query parameter points to the actual
 * payment API root matching the local backend.
 *
 * Security: production builds must configure VITE_PAY_API_BASE_ALLOW_HOSTS
 * (comma-separated); otherwise apiBase is ignored.
 */

function normalizePayApiBase(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    const path = u.pathname.replace(/\/+$/, '');
    if (!path.endsWith('/api/v1')) return null;
    return `${u.origin}${path}`;
  } catch {
    return null;
  }
}

function isHostAllowed(hostname: string, patterns: string[]): boolean {
  const h = hostname.toLowerCase();
  for (const raw of patterns) {
    const p = raw.trim().toLowerCase();
    if (!p) continue;
    if (p.startsWith('.')) {
      const suf = p.slice(1);
      if (h === suf || h.endsWith(p)) return true;
    } else if (p.endsWith('.')) {
      if (h.startsWith(p)) return true;
    } else if (h === p) return true;
  }
  return false;
}

function allowHostsFromEnv(): string[] {
  const raw = import.meta.env.VITE_PAY_API_BASE_ALLOW_HOSTS?.trim();
  if (!raw) return [];
  return raw.split(',').map((s: string) => s.trim()).filter(Boolean);
}

/**
 * Used when generating the QR code on the checkout page: local backend API root
 * (written into the link query as apiBase).
 */
export function getPayApiBaseForQr(): string {
  return import.meta.env.VITE_PAY_API_BASE_FOR_QR?.trim().replace(/\/+$/, '') || '';
}

/**
 * Parses and validates the apiBase query parameter on the payment confirmation page;
 * returns null if invalid (falls back to the default same-origin API).
 */
export function resolvePayApiBaseFromSearchParam(apiBaseParam: string | null | undefined): string | null {
  const base = normalizePayApiBase(apiBaseParam?.trim() || '');
  if (!base) return null;

  let host: string;
  try {
    host = new URL(base).hostname;
  } catch {
    return null;
  }

  const patterns = allowHostsFromEnv();
  const isDev = import.meta.env.DEV;

  if (patterns.length > 0) {
    if (!isHostAllowed(host, patterns)) return null;
    return base;
  }

  if (isDev) {
    return base;
  }

  return null;
}
