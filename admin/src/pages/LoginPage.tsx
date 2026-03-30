import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const API_BASE = '/api/v1';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('请输入用户名和密码');
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
        throw new Error(data.message || '用户名或密码错误');
      }
      const data = await response.json();
      const userData = data.data?.user || data.user;
      const tokenData = data.data?.token || data.token || data;
      const accessToken = tokenData.access_token || tokenData.accessToken;
      const refreshToken = tokenData.refresh_token || tokenData.refreshToken;
      login(userData, accessToken);
      toast.success('登录成功');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败，请重试';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      backgroundColor: 'var(--color-paper)',
      overflow: 'hidden',
    }}>
      {/* Editorial Cover Section (Left) */}
      <div style={{
        flex: '0 0 62%',
        position: 'relative',
        backgroundColor: 'var(--color-aged-stock)',
        borderRight: '2px solid var(--color-ink)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px',
      }}>
        <div style={{
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'var(--color-sepia-mid)',
          borderBottom: '1px solid var(--color-warm-gray)',
          paddingBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Vol. 1 — Issue 01</span>
          <span>Security & Authorization</span>
        </div>

        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(80px, 12vw, 160px)',
            lineHeight: 0.85,
            margin: 0,
            letterSpacing: '-0.04em',
            color: 'var(--color-ink)',
            marginLeft: '-0.05em'
          }}>
            VICOO
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            marginTop: '20px',
            color: 'var(--color-archive-brown)',
            maxWidth: '400px',
            lineHeight: 1.8
          }}>
            "Internal Access Portal. Authorized personnel only. Please verify your cryptographic credentials to proceed."
          </p>
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-sepia-mid)',
          display: 'flex',
          gap: '40px'
        }}>
          <div>EST. 2026</div>
          <div>ADMIN v1.0.4</div>
          <div style={{ marginLeft: 'auto' }}>SECURE_LAYER_ID: 0x7A2</div>
        </div>
      </div>

      {/* Login Form Section (Right) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
      }}>
        <div style={{ maxWidth: '340px', width: '100%' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontStyle: 'italic',
            marginBottom: '40px',
            color: 'var(--color-ink)'
          }}>
            Identify Yourself.
          </h2>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '8px',
                color: 'var(--color-sepia-mid)'
              }}>
                Identification / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@tonghua.org"
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--color-ink)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  borderRadius: 0,
                }}
              />
            </div>

            <div style={{ marginBottom: '40px', position: 'relative' }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '8px',
                color: 'var(--color-sepia-mid)'
              }}>
                Security Key / Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--color-ink)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  borderRadius: 0,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: '12px',
                  color: 'var(--color-ink-faded)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                borderRadius: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-archive-brown)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-ink)'; }}
            >
              {loading ? 'Authenticating...' : 'Authorize Access'}
            </button>
          </form>

          {/* <div style={{
            marginTop: '40px',
            padding: '20px',
            border: '1px dashed var(--color-warm-gray)',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '10px', 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--color-sepia-mid)', 
              margin: 0,
              lineHeight: 1.6
            }}>
              NOTICE: This terminal is monitored. <br/>
              Attempts to use unauthorized OAuth methods are logged.
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
