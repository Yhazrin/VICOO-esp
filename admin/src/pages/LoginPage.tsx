import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const API_BASE = '/api/v1';

export default function LoginPage() {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error(t('login.errorRequired'));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
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
      login(userData, accessToken);
      toast.success(t('login.toastSuccess'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('login.errorLoginFailed');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    color: 'var(--color-text-3)',
    fontWeight: 500,
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg)',
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--color-surface)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '40px 32px',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--color-text)',
            letterSpacing: '0.12em',
            lineHeight: 1,
          }}>
            VICOO
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            color: 'var(--color-text-3)',
            marginTop: '8px',
          }}>
            {t('sidebar.systemName', 'admin')}
          </div>
        </div>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              {t('login.emailLabel')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin@tonghua.org"
              autoComplete="username"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-border-hi)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '28px', position: 'relative' }}>
            <label style={labelStyle}>
              {t('login.passwordLabel')}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: '40px' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-border-hi)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '10px',
                color: 'var(--color-text-3)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: loading ? 'var(--color-text-3)' : 'var(--color-text)',
              color: 'var(--color-bg)',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.04em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              borderRadius: '8px',
              border: 'none',
            }}
          >
            {loading ? t('login.loggingInButton') : t('login.loginButton')}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '28px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-3)',
          letterSpacing: '0.05em',
        }}>
          VICOO Admin v1.0
        </div>
      </div>
    </div>
  );
}
