import { type ReactNode } from 'react';

export interface LoginShellProps {
  /** Current login mode */
  mode: 'user' | 'admin';

  /** Brand logo text */
  brandName?: string;

  /** System subtitle */
  systemName?: string;

  /** Custom brand element (overrides brandName) */
  brandElement?: ReactNode;

  /** Title text */
  title: string;

  /** Subtitle text */
  subtitle: string;

  /** Show detection badge (admin mode) */
  showDetectionBadge?: boolean;

  /** Children: form or other content */
  children: ReactNode;

  /** Footer element */
  footer?: ReactNode;

  /** Bottom action (e.g., mode switch) */
  bottomAction?: ReactNode;

  /** Extra class for card */
  className?: string;
}

/**
 * Unified Login Shell Component
 *
 * Provides consistent login card structure with:
 * - Brand header
 * - Mode-based styling (user/admin)
 * - Smooth transitions
 * - Configurable content areas
 *
 * Usage:
 * ```tsx
 * <LoginShell
 *   mode="admin"
 *   title="Admin Access"
 *   subtitle="Sign in with your organizational identity"
 * >
 *   <form>...</form>
 *   <DemoAccounts />
 * </LoginShell>
 * ```
 */
export default function LoginShell({
  mode,
  brandName = 'VICOO',
  systemName,
  brandElement,
  title,
  subtitle,
  showDetectionBadge = false,
  children,
  footer,
  bottomAction,
  className = '',
}: LoginShellProps) {
  const isAdmin = mode === 'admin';

  return (
    <div className={`login-page ${className}`}>
      <div className={`login-card ${isAdmin ? 'login-card--admin' : ''}`}>
        {/* Brand Header */}
        <div className="login-brand">
          {brandElement ?? (
            <>
              <div className="login-brand__logo">{brandName}</div>
              {systemName && (
                <div className="login-brand__subtitle">{systemName}</div>
              )}
            </>
          )}
        </div>

        {/* Detection Badge - shown via CSS when admin mode detected */}
        {showDetectionBadge && isAdmin && (
          <div className="login-detection-badge login-detection-badge--visible">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Staff detected
          </div>
        )}

        {/* Title */}
        <div className="login-title-container">
          <h1 className={`login-title ${isAdmin ? 'login-title--admin' : ''}`}>
            {title}
          </h1>
          <p className="login-subtitle">{subtitle}</p>
        </div>

        {/* Content */}
        <div className="login-form-container">
          {children}
        </div>

        {/* Bottom Action */}
        {bottomAction && (
          <div className="login-bottom-action">
            {bottomAction}
          </div>
        )}

        {/* Footer */}
        {footer ?? (
          <div className="login-footer">
            VICOO Admin v1.0
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Admin badges for additional context
 */
export function LoginAdminBadges() {
  return (
    <div className="login-admin-badges">
      <span className="login-admin-badge">ADFS</span>
      <span className="login-admin-badge login-admin-badge--internal">Internal</span>
    </div>
  );
}

/**
 * Demo accounts section
 */
export interface DemoAccount {
  email: string;
  password: string;
  role: string;
}

export interface LoginDemoAccountsProps {
  accounts: DemoAccount[];
  onSelect: (account: DemoAccount) => void;
}

export function LoginDemoAccounts({ accounts, onSelect }: LoginDemoAccountsProps) {
  if (accounts.length === 0) return null;

  return (
    <div className="login-demo">
      <div className="login-demo-header">
        <span>Demo Accounts</span>
      </div>
      <div className="login-demo-accounts">
        {accounts.map((account) => (
          <button
            key={account.email}
            className="login-demo-account"
            onClick={() => onSelect(account)}
            type="button"
          >
            <span className="login-demo-account__role">{account.role}</span>
            <span className="login-demo-account__email">{account.email}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Mode switch button component
 */
export interface LoginModeSwitchProps {
  currentMode: 'user' | 'admin';
  onSwitch: (mode: 'user' | 'admin') => void;
  userLabel?: string;
  adminLabel?: string;
}

export function LoginModeSwitch({
  currentMode,
  onSwitch,
  userLabel = 'User Login',
  adminLabel = 'Admin Login',
}: LoginModeSwitchProps) {
  return (
    <div className="login-mode-switch">
      {currentMode === 'admin' ? (
        <button type="button" onClick={() => onSwitch('user')}>
          Switch to {userLabel}
        </button>
      ) : (
        <button type="button" onClick={() => onSwitch('admin')}>
          {adminLabel}
        </button>
      )}
    </div>
  );
}
