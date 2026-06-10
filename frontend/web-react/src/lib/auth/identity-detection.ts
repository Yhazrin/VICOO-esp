/**
 * Identity Detection Utility (ADFS-inspired)
 *
 * Provides client-side detection of identity type based on identifier input.
 * Used for UI guidance and redirect decisions.
 *
 * Detection Rules:
 * 1. domain - @vicoo.org, @tonghua.org
 * 2. keyword - contains 'admin', 'staff', 'system'
 * 3. demo - specific demo account emails
 */

export type LoginMode = 'user' | 'admin';
export type Confidence = 'low' | 'medium' | 'high';
export type DetectionReason = 'domain' | 'keyword' | 'demo' | null;

// Admin domains for staff/organizational accounts
const ADMIN_DOMAINS = ['vicoo.org', 'tonghua.org'];

// Keywords that suggest admin/staff identity
const ADMIN_KEYWORDS = ['admin', 'staff', 'system', 'root', 'super', 'manager', 'operator'];

// Demo admin accounts
const DEMO_ADMIN_EMAILS = [
  'admin@vicoo.org',
  'admin@tonghua.org',
];

export interface IdentityDetectionResult {
  mode: LoginMode;
  confidence: Confidence;
  reason: DetectionReason;
}

/**
 * Detect identity mode from identifier (email or username)
 */
export function detectIdentityMode(identifier: string): IdentityDetectionResult {
  const normalized = identifier.toLowerCase().trim();

  if (!normalized) {
    return { mode: 'user', confidence: 'low', reason: null };
  }

  // 1. Check for demo admin emails (highest confidence)
  if (DEMO_ADMIN_EMAILS.some(email => normalized.includes(email))) {
    return { mode: 'admin', confidence: 'high', reason: 'demo' };
  }

  // 2. Check domain-based detection
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex !== -1) {
    const domain = normalized.slice(atIndex + 1);
    if (ADMIN_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) {
      return { mode: 'admin', confidence: 'high', reason: 'domain' };
    }
  }

  // 3. Check keyword-based detection
  if (ADMIN_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return { mode: 'admin', confidence: 'medium', reason: 'keyword' };
  }

  return { mode: 'user', confidence: 'low', reason: null };
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
    { email: 'xiaoming@example.com', password: 'vicoo-user', role: 'User' },
  ];
}

/**
 * Check if user has admin access based on email
 */
export function hasAdminAccess(email: string): boolean {
  const result = detectIdentityMode(email);
  return result.mode === 'admin';
}

/**
 * Get redirect path based on identity mode
 */
export function getRedirectPath(mode: LoginMode): string {
  if (mode === 'admin') {
    return '/admin';
  }
  return '/';
}
