import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import {
  detectIdentityMode,
  parseLoginParams,
  getDemoAccounts,
  type LoginMode,
} from '../lib/auth/identity-detection';
import type { DemoAccount } from '../components/ui/LoginShell';
import { loginWithAdfs, getAdfsButtonLabel } from '../lib/auth/adfs';
import LoginShell, { LoginModeSwitch, LoginDemoAccounts } from '../components/ui/LoginShell';
import toast from 'react-hot-toast';
import './LoginPage.css';

const API_BASE = '/api/v1';
const DEBOUNCE_MS = 300;

export default function LoginPage() {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const setRedirectPath = useAuthStore((s) => s.setRedirectPath);

  // Mode state
  const [mode, setMode] = useState<LoginMode>('user');
  const [detectedMode, setDetectedMode] = useState<LoginMode>('user');
  const [manualOverride, setManualOverride] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'adfs'>('password');

  // Form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refs
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDetectedRef = useRef<LoginMode>('user');

  // Initialize from URL params
  useEffect(() => {
    const params = parseLoginParams(window.location.search);
    if (params.mode) {
      setMode(params.mode);
      setDetectedMode(params.mode);
      setManualOverride(true);
    }
    if (params.redirect) {
      setRedirectPath(params.redirect);
    }
  }, [setRedirectPath]);

  // Listen for mock ADFS login
  useEffect(() => {
    const handleAdfsMock = (e: CustomEvent) => {
      const { user } = e.detail;
      login(user, 'mock-adfs-token');
    };
    window.addEventListener('adfs-mock-login', handleAdfsMock as EventListener);
    return () => window.removeEventListener('adfs-mock-login', handleAdfsMock as EventListener);
  }, [login]);

  // Debounced identity detection
  const handleIdentifierChange = useCallback((value: string) => {
    setIdentifier(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const result = detectIdentityMode(value);
      setDetectedMode(result.mode);

      // Auto-switch mode if no manual override
      if (!manualOverride) {
        setMode(result.mode);
      }
    }, DEBOUNCE_MS);
  }, [manualOverride]);

  // Manual mode switch
  const handleManualModeSwitch = (newMode: LoginMode) => {
    setMode(newMode);
    setManualOverride(true);
  };

  // Use password instead of ADFS
  const handleUsePasswordInstead = () => {
    setAuthMethod('password');
  };

  // Handle demo account selection
  const handleSelectDemo = (account: DemoAccount) => {
    setIdentifier(account.email);
    setPassword(account.password);

    // Auto-detect mode from account
    const result = detectIdentityMode(account.email);
    setMode(result.mode);
    setDetectedMode(result.mode);
    setManualOverride(true);
  };

  // Handle password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error(t('login.errorRequired'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || t('login.errorInvalidCredentials'));
      }

      const data = await response.json();
      const userData = data.data?.user || data.user;
      const tokenData = data.data?.token || data.token || data;
      const accessToken = tokenData.access_token || tokenData.accessToken;

      if (!accessToken) {
        throw new Error(t('login.errorLoginFailed'));
      }

      login({ ...userData, provider: 'password' }, accessToken);
      toast.success(t('login.toastSuccess'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('login.errorLoginFailed');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle ADFS login
  const handleAdfsLogin = () => {
    loginWithAdfs();
  };

  // Demo accounts
  const demoAccounts = getDemoAccounts(mode);

  // Check if should show admin UI
  const isAdminMode = mode === 'admin';
  const showAdfsButton = isAdminMode && authMethod === 'adfs';

  return (
    <LoginShell
      mode={isAdminMode ? 'admin' : 'user'}
      brandName="VICOO"
      systemName={t('sidebar.systemName', 'admin')}
      title={isAdminMode ? 'Admin Access' : 'Welcome Back'}
      subtitle={
        isAdminMode
          ? 'Use your organizational identity to continue.'
          : 'Sign in to your account'
      }
      showDetectionBadge={detectedMode === 'admin' && !manualOverride}
      bottomAction={
        <LoginModeSwitch
          currentMode={mode}
          onSwitch={handleManualModeSwitch}
        />
      }
    >
      {/* Form Container */}
      <div className="login-form-container">
        {showAdfsButton ? (
          /* ADFS Login */
          <div className="login-adfs-section">
            <button
              className="login-adfs-button"
              onClick={handleAdfsLogin}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {getAdfsButtonLabel()}
            </button>

            <button
              className="login-use-password"
              onClick={handleUsePasswordInstead}
              type="button"
            >
              Use password instead
            </button>
          </div>
        ) : (
          /* Password Login */
          <form className="login-form" onSubmit={handlePasswordLogin}>
            {/* Identifier Input */}
            <div className="login-field">
              <label className="login-label">
                {t('login.emailLabel', 'Email / Username')}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => handleIdentifierChange(e.target.value)}
                placeholder={isAdminMode ? 'admin@vicoo.org' : 'name@example.com'}
                autoComplete="username"
                className="login-input"
                autoFocus
              />
            </div>

            {/* Password Input */}
            <div className="login-field">
              <label className="login-label">
                {t('login.passwordLabel', 'Password')}
              </label>
              <div className="login-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-input login-input--password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="login-actions-row">
              <label className="login-checkbox">
                <input type="checkbox" />
                <span>{t('login.rememberMe', 'Remember me')}</span>
              </label>
              <a href="#" className="login-forgot">
                {t('login.forgotPassword', 'Forgot password?')}
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`login-submit ${isAdminMode ? 'login-submit--admin' : ''}`}
              disabled={loading}
            >
              {loading
                ? t('login.loggingInButton', 'Signing in...')
                : isAdminMode
                  ? 'Sign In'
                  : t('login.loginButton', 'Sign In')}
            </button>

            {/* Switch to ADFS */}
            {isAdminMode && (
              <button
                type="button"
                className="login-switch-method"
                onClick={() => setAuthMethod('adfs')}
              >
                Use ADFS instead
              </button>
            )}
          </form>
        )}
      </div>

      {/* Demo Accounts */}
      <LoginDemoAccounts
        accounts={demoAccounts.map((a) => ({ ...a, password: a.password }))}
        onSelect={handleSelectDemo}
      />
    </LoginShell>
  );
}
