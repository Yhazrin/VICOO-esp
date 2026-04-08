const mode = import.meta.env.MODE;

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Controlled fallback boundary:
 * - production: fallback disabled by default
 * - non-production: fallback enabled by default
 * - override via VITE_WEB_ALLOW_MOCK_FALLBACK=true|false
 */
export const allowWebMockFallback = (() => {
  const flag = import.meta.env.VITE_WEB_ALLOW_MOCK_FALLBACK;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return mode !== 'production';
})();
