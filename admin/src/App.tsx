import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ErrorBoundary from './components/ui/ErrorBoundary';
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

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/artworks" element={<ArtworkPage />} />
          <Route path="/campaigns" element={<CampaignPage />} />
          <Route path="/donations" element={<DonationPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/clothing-donations" element={<ClothingDonationPage />} />
          <Route path="/after-sales" element={<AfterSalesPage />} />
          <Route path="/users" element={<UserPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}
