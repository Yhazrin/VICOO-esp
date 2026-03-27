import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

export default function TopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const notificationCount = useUIStore((s) => s.notificationCount);

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--color-bg-card)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={toggleSidebar}
          style={{
            width: 36, height: 36,
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-secondary)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#f3f4f6'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
          title="切换侧边栏"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Notifications */}
        <button style={{
          position: 'relative',
          width: 36, height: 36,
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-secondary)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          {notificationCount > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 18, height: 18,
              borderRadius: '50%',
              background: 'var(--color-danger)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {notificationCount}
            </span>
          )}
        </button>

        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{
            width: 30, height: 30,
            borderRadius: '50%',
            background: 'var(--color-accent-light)',
            color: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600,
          }}>
            {(user?.username || '管')[0]}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.username || '管理员'}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-light)' }}>{user?.role || 'admin'}</div>
          </div>
          <button
            onClick={logout}
            title="退出登录"
            style={{
              marginLeft: 8,
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
          >
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
