import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, hasAdminAccess, type AuthUser } from './stores/authStore';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ArtworkPage from './pages/ArtworkPage';
import CampaignPage from './pages/CampaignPage';
import DonationPage from './pages/DonationPage';
import OrderPage from './pages/OrderPage';
import UserPage from './pages/UserPage';
import ProductPage from './pages/ProductPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogPage from './pages/AuditLogPage';
import ClothingDonationPage from './pages/ClothingDonationPage';
import AfterSalesPage from './pages/AfterSalesPage';
import { useEffect, useState } from 'react';

/**
 * Restore session from server on app load
 * Always wraps admin routes to restore session from cookie
 */
function normalizeAdminUser(user: any): AuthUser {
  return {
    id: String(user.id ?? ''),
    username: user.username ?? user.nickname ?? user.email ?? '',
    email: user.email ?? '',
    role: user.role,
    avatar: user.avatar ?? user.avatarUrl,
    provider: user.provider ?? 'password',
    permissions: user.permissions,
  };
}

let adminSessionRestorePromise: Promise<{ userData: any; accessToken: string } | null> | null = null;

function loadAdminSession() {
  if (!adminSessionRestorePromise) {
    adminSessionRestorePromise = (async () => {
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        signal: AbortSignal.timeout(5000),
      });
      if (!refreshRes.ok) {
        throw new Error('Not authenticated');
      }

      const refreshData = await refreshRes.json();
      const accessToken = refreshData.data?.access_token;
      if (!accessToken) {
        throw new Error('Missing access token');
      }

      const profileRes = await fetch('/api/v1/users/me', {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!profileRes.ok) {
        throw new Error('Profile unavailable');
      }

      const profileData = await profileRes.json();
      const userData = profileData.data?.user || profileData.data || profileData.user;
      if (!userData) {
        throw new Error('Missing user');
      }

      return { userData, accessToken };
    })().catch((error) => {
      adminSessionRestorePromise = null;
      throw error;
    });
  }

  return adminSessionRestorePromise;
}

function SessionRestorer({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [restored, setRestored] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    let cancelled = false;

    async function restoreFromCookie() {
      try {
        const session = await loadAdminSession();
        if (!session) return;
        const { userData, accessToken } = session;

        if (cancelled) return;

        if (hasAdminAccess(userData.role)) {
          restoreSession(normalizeAdminUser(userData), accessToken);
          setIsAuthenticated(true);
          setIsAdmin(true);
        } else {
          clearSession();
          setIsAuthenticated(true);
          setIsAdmin(false);
        }
      } catch {
        if (cancelled) return;
        // Not authenticated - clear any stale state
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        if (cancelled) return;
        setRestored(true);
      }
    }

    restoreFromCookie();
    return () => { cancelled = true; };
  }, [restoreSession, clearSession]);

  // Still restoring session
  if (!restored) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
      }}>
        <div style={{ fontSize: '14px', color: 'var(--color-text-3)' }}>
          Loading...
        </div>
      </div>
    );
  }

  // User is authenticated but not admin - redirect
  if (isAuthenticated && !isAdmin) {
    if (location.pathname !== '/access-denied') {
      window.location.replace('/admin/access-denied');
      return null;
    }
    return <>{children}</>;
  }

  if (location.pathname === '/access-denied') {
    return <>{children}</>;
  }

  // User is not authenticated - redirect to web-react login page
  if (!isAuthenticated) {
    window.location.href = '/login?redirect=/admin/';
    return null;
  }

  // User is authenticated and is admin
  return <>{children}</>;
}

/**
 * Access Denied Page
 */
function AccessDeniedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg)',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '400px',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--color-error-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '8px',
        }}>
          Access Denied
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--color-text-2)',
          marginBottom: '24px',
        }}>
          You don't have permission to access this area.
          Please contact an administrator if you believe this is an error.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius-pill)',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Go to Homepage
        </a>
      </div>
    </div>
  );
}

/**
 * Admin Route Guard - Just a passthrough since SessionRestorer handles auth
 */
function AdminGuard({ children }: { children: React.ReactNode }) {
  // SessionRestorer already validated admin access
  return <>{children}</>;
}

export default function App() {
  return (
    <SessionRestorer>
      <Routes>
        {/* Legacy redirect: /admin/dashboard → /admin/ */}
        <Route path="dashboard" element={<Navigate to="/" replace />} />

        {/* Access Denied page */}
        <Route path="access-denied" element={<AccessDeniedPage />} />

        {/* Admin routes - BrowserRouter basename is /admin */}
        <Route
          path="/*"
          element={
            <AdminGuard>
              <Layout>
                <Routes>
                  {/* Dashboard: /admin/ */}
                  <Route index element={<DashboardPage />} />
                  <Route path="artworks" element={<ArtworkPage />} />
                  <Route path="campaigns" element={<CampaignPage />} />
                  <Route path="donations" element={<DonationPage />} />
                  <Route path="orders" element={<OrderPage />} />
                  <Route path="clothing-donations" element={<ClothingDonationPage />} />
                  <Route path="after-sales" element={<AfterSalesPage />} />
                  <Route path="users" element={<UserPage />} />
                  <Route path="products" element={<ProductPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="audit-log" element={<AuditLogPage />} />
                  {/* Unknown /admin/* paths → /admin */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </AdminGuard>
          }
        />
      </Routes>
    </SessionRestorer>
  );
}
