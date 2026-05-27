/**
 * Identity Detection Utility
 *
 * Provides client-side detection of identity type based on identifier input.
 * This is for UI guidance only - actual authorization still requires server validation.
 *
 * Detection Rules:
 * 1. domain - @vicoo.org, @tonghua.org
 * 2. keyword - contains 'admin', 'staff', 'system'
 * 3. demo-admin - specific demo account emails
 * 4. query-param - forced via URL parameter
 */

export type LoginMode = 'user' | 'admin';
export type Confidence = 'low' | 'medium' | 'high';
export type DetectionReason = 'domain' | 'keyword' | 'demo-admin' | 'query-param' | null;

// Admin domains for staff/organizational accounts
const ADMIN_DOMAINS = ['vicoo.org', 'tonghua.org'];

// Keywords that suggest admin/staff identity
const ADMIN_KEYWORDS = ['admin', 'staff', 'system', 'root', 'super', 'manager', 'operator'];

// Demo admin accounts
const DEMO_ADMIN_EMAILS = [
  'admin@vicoo.org',
  'admin@tonghua.org',
];

// Demo user accounts (for reference)
const DEMO_USER_EMAILS = [
  'lihua@example.com',
  'xiaoming@example.com',
  'test@example.com',
];

export interface IdentityDetectionResult {
  mode: LoginMode;
  confidence: Confidence;
  reason: DetectionReason;
}

export interface AuthConfig {
  adminDomains: string[];
  adminKeywords: string[];
  demoAdminEmails: string[];
  demoUserEmails: string[];
}

/**
 * Default auth configuration
 */
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  adminDomains: ADMIN_DOMAINS,
  adminKeywords: ADMIN_KEYWORDS,
  demoAdminEmails: DEMO_ADMIN_EMAILS,
  demoUserEmails: DEMO_USER_EMAILS,
};

/**
 * Detect identity mode from identifier (email or username)
 *
 * @param identifier - The email or username to analyze
 * @param config - Optional auth configuration
 * @returns Detection result with mode, confidence, and reason
 */
export function detectIdentityMode(
  identifier: string,
  config: Partial<AuthConfig> = {}
): IdentityDetectionResult {
  const cfg = { ...DEFAULT_AUTH_CONFIG, ...config };
  const normalized = identifier.toLowerCase().trim();

  if (!normalized) {
    return { mode: 'user', confidence: 'low', reason: null };
  }

  // 1. Check for demo admin emails (highest confidence)
  if (cfg.demoAdminEmails.some(email => normalized.includes(email.toLowerCase()))) {
    return { mode: 'admin', confidence: 'high', reason: 'demo-admin' };
  }

  // 2. Check domain-based detection
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex !== -1) {
    const domain = normalized.slice(atIndex + 1);
    if (cfg.adminDomains.some(d => domain === d || domain.endsWith('.' + d))) {
      return { mode: 'admin', confidence: 'high', reason: 'domain' };
    }
  }

  // 3. Check keyword-based detection
  if (cfg.adminKeywords.some(keyword => normalized.includes(keyword))) {
    return { mode: 'admin', confidence: 'medium', reason: 'keyword' };
  }

  // Default to user mode
  return { mode: 'user', confidence: 'low', reason: null };
}

/**
 * Check if identifier is a known demo user account
 */
export function isDemoUser(identifier: string): boolean {
  const normalized = identifier.toLowerCase().trim();
  return DEFAULT_AUTH_CONFIG.demoUserEmails.some(
    email => normalized.includes(email.toLowerCase())
  );
}

/**
 * Check if identifier is a known demo admin account
 */
export function isDemoAdmin(identifier: string): boolean {
  const normalized = identifier.toLowerCase().trim();
  return DEFAULT_AUTH_CONFIG.demoAdminEmails.some(
    email => normalized.includes(email.toLowerCase())
  );
}

/**
 * Get demo accounts for display
 */
export function getDemoAccounts(mode: LoginMode) {
  if (mode === 'admin') {
    return [
      { email: 'admin@vicoo.org', password: 'vicoo-admin', role: 'Admin' },
      { email: 'admin@tonghua.org', password: 'vicoo-admin', role: 'Admin' },
    ];
  }
  return [
    { email: 'lihua@example.com', password: 'vicoo-user', role: 'User' },
  ];
}

/**
 * Parse login URL parameters
 */
export interface LoginParams {
  mode?: LoginMode;
  redirect?: string;
}

export function parseLoginParams(search: string): LoginParams {
  const params = new URLSearchParams(search);
  const mode = params.get('mode') as LoginMode | null;
  const redirect = params.get('redirect');

  return {
    mode: mode === 'admin' || mode === 'user' ? mode : undefined,
    redirect: redirect || undefined,
  };
}

/**
 * Build login URL with parameters
 */
export function buildLoginUrl(params: LoginParams): string {
  const searchParams = new URLSearchParams();
  if (params.mode) {
    searchParams.set('mode', params.mode);
  }
  if (params.redirect) {
    searchParams.set('redirect', params.redirect);
  }
  const query = searchParams.toString();
  return query ? `/login?${query}` : '/login';
}
