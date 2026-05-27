import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { useEffect } from 'react';

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
 * Redirect from legacy /dashboard to /admin
 */
function LegacyDashboardRedirect() {
  return <Navigate to="/admin" replace />;
}

/**
 * Admin Route Guard - Requires admin role
 */
function AdminGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with admin mode
      window.location.href = `/login?redirect=${encodeURIComponent(location.pathname)}&mode=admin`;
    } else if (user && !hasAdminAccess(user.role)) {
      // Non-admin users trying to access admin routes
      window.location.href = '/access-denied';
    }
  }, [isAuthenticated, user, location.pathname]);

  if (!isAuthenticated || !user || !hasAdminAccess(user.role)) {
    return null;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Legacy redirect: /dashboard → /admin */}
      <Route path="/dashboard" element={<LegacyDashboardRedirect />} />

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
                <Route path="*" element={<Navigate to="/admin" replace />} />
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
      {/* Root: → /admin (admin-only fallback) */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Catch-all: → /admin (admin-only fallback) */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
