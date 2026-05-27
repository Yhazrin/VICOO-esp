import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, hasAdminAccess } from './stores/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
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
function SessionRestorer({ children }: { children: React.ReactNode }) {
  const [restored, setRestored] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const login = useAuthStore((s) => s.login);
  const storeIsAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Try to restore session from server using cookie
    fetch('/api/v1/auth/me', {
      credentials: 'include',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then((data) => {
        const userData = data.data?.user || data.user;
        if (userData && hasAdminAccess(userData.role)) {
          // Restore session
          const token = data.data?.token?.access_token || data.token?.access_token || data.access_token;
          login(userData, token || 'restored-session');
          setIsAuthenticated(true);
          setIsAdmin(true);
        } else if (userData) {
          // User is authenticated but not admin
          setIsAuthenticated(true);
          setIsAdmin(false);
        }
      })
      .catch(() => {
        // Not authenticated - clear any stale state
        setIsAuthenticated(false);
        setIsAdmin(false);
      })
      .finally(() => {
        setRestored(true);
      });
  }, [login]);

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
    window.location.href = 'access-denied';
    return null;
  }

  // User is not authenticated - redirect to login
  if (!isAuthenticated) {
    window.location.href = 'login';
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
        {/* Legacy redirect: /dashboard → /admin */}
        <Route path="/dashboard" element={<Navigate to="" replace />} />

        {/* Access Denied page */}
        <Route path="/access-denied" element={<AccessDeniedPage />} />

        {/* Login page - unified entry */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin routes - all under /admin prefix */}
        <Route
          path="/admin/*"
          element={
            <AdminGuard>
              <Layout>
                <Routes>
                  {/* Dashboard: /admin (not /admin/dashboard) */}
                  <Route path="" element={<DashboardPage />} />
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
                  <Route path="*" element={<Navigate to="" replace />} />
                </Routes>
              </Layout>
            </AdminGuard>
          }
        />

        {/*
         * Admin-only fallback routes:
         * These only match if the admin SPA is accessed directly (not behind /admin/ prefix).
         * In normal deployment, nginx forwards /admin/* to this SPA, so these never match.
         */}
        {/* Root: → dashboard (empty path = /admin/) */}
        <Route path="/" element={<Navigate to="" replace />} />

        {/* Catch-all: → dashboard */}
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </SessionRestorer>
  );
}
