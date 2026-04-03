import { useAuthStore } from '../../stores/authStore';

export default function TopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header style={{
      height: 'var(--topbar-height)',
      backgroundColor: 'var(--color-paper)',
      borderBottom: '1px solid var(--color-ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end', // Align items to the right
      padding: '0 40px',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {/* Editorial Status Tag */}
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'var(--color-sepia-mid)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }}></span>
          System Online
        </div>

        {/* User Identity Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          borderLeft: '1px solid var(--color-warm-gray)',
          paddingLeft: 32
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '13px', 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700,
              fontStyle: 'italic',
              lineHeight: 1
            }}>
              {user?.username || 'Administrator'}
            </div>
            <div style={{ 
              fontSize: '9px', 
              color: 'var(--color-sepia-mid)', 
              fontFamily: 'var(--font-body)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: '4px'
            }}>
              {user?.role || 'authorized_user'}
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--color-ink)',
              fontSize: '10px',
              fontFamily: 'var(--font-body)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'all 0.2s',
              cursor: 'pointer',
              background: 'transparent'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ink)'; e.currentTarget.style.color = 'var(--color-paper)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-ink)'; }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
