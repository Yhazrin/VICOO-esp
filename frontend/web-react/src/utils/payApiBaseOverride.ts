/**
 * 本地 Docker 下单、手机打开「仅部署在虚拟机上的 /payment/confirm」时，
 * 通过链接参数 apiBase= 指定真实处理支付的 API 根路径与本机后端一致。
 *
 * 安全：生产构建须配置 VITE_PAY_API_BASE_ALLOW_HOSTS（逗号分隔），否则忽略 apiBase。
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
 * 结账页生成二维码时使用：本机后端 API 根（供写入链接 query apiBase）。
 */
export function getPayApiBaseForQr(): string {
  return import.meta.env.VITE_PAY_API_BASE_FOR_QR?.trim().replace(/\/+$/, '') || '';
}

/**
 * 解析并校验支付确认页上的 apiBase 查询参数；不合法则返回 null（走默认同源 API）。
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
