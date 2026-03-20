import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || '用户名或密码错误');
      }
      const data = await response.json();
      // Handle response structure: { success: true, data: { user: {...}, token: { access_token, refresh_token } } }
      const userData = data.data?.user || data.user;
      const tokenData = data.data?.token || data.token || data;
      const accessToken = tokenData.access_token || tokenData.accessToken;
      const refreshToken = tokenData.refresh_token || tokenData.refreshToken;
      login(userData, accessToken, refreshToken);
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
      background: 'var(--color-bg)',
    }}>
      {/* Left panel - decorative */}
      <div style={{
        flex: 1,
        background: 'var(--color-bg-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
      }}>
        <div style={{
          maxWidth: 400, color: '#fff', textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 28, fontWeight: 700, color: '#fff',
          }}>
            T
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
            童画公益
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-sidebar)', lineHeight: 1.6 }}>
            Tonghua Public Welfare &times; Sustainable Fashion
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 24, fontFamily: 'var(--font-mono)' }}>
            管理后台 v1.0.0
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
      }}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>欢迎回来</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 32 }}>
            登录管理后台以继续操作
          </p>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: 'var(--color-accent)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p style={{
            fontSize: 12, color: 'var(--color-text-light)',
            textAlign: 'center', marginTop: 24,
            fontFamily: 'var(--font-mono)',
          }}>
            Tonghua Public Welfare Admin v1.0.0
          </p>
        </form>
      </div>
    </div>
  );
}
