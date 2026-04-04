import { Routes, Route, useLocation } from 'react-router-dom';
import Layout, { FullHeightLayout } from '@/components/layout/Layout';
import SmoothTransition from '@/components/transitions/SmoothTransition';
import ErrorBoundary from '@/components/editorial/ErrorBoundary';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Campaigns from '@/pages/Campaigns';
import CampaignDetail from '@/pages/CampaignDetail';
import Stories from '@/pages/Stories';
import ArtworkDetail from '@/pages/ArtworkDetail';
import Donate from '@/pages/Donate';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Traceability from '@/pages/Traceability';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AuthCallback from '@/pages/AuthCallback';
import ForgotPassword from '@/pages/ForgotPassword';
import Profile from '@/pages/Profile';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import ChildrenSafety from '@/pages/ChildrenSafety';
import NotFound from '@/pages/NotFound';
import OrderDetail from '@/pages/OrderDetail';
import DonateClothing from '@/pages/DonateClothing';
import Support from '@/pages/Support';
import AiAssistant from '@/pages/AiAssistant';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';

function AppLocaleSync() {
  const { i18n } = useTranslation();
  const currentLocale = useUIStore((state) => state.currentLocale);

  useEffect(() => {
    if (i18n.language !== currentLocale) {
      void i18n.changeLanguage(currentLocale);
    }
    document.documentElement.lang = currentLocale;
  }, [currentLocale, i18n]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  useSessionRestore(); // Restore session on app load

  return (
    <ErrorBoundary>
      <SmoothTransition>
        <Routes location={location} key={location.pathname}>
          {/* Home uses FullHeightLayout for scroll narrative - no overflow:hidden */}
          <Route element={<FullHeightLayout />}>
            <Route index element={<ErrorBoundary><Home /></ErrorBoundary>} />
          </Route>

          {/* Other pages use standard Layout with HorizontalSlideTransition */}
          <Route element={<Layout />}>
            <Route path="about" element={<ErrorBoundary><About /></ErrorBoundary>} />
            <Route path="campaigns" element={<ErrorBoundary><Campaigns /></ErrorBoundary>} />
            <Route path="campaigns/:id" element={<ErrorBoundary><CampaignDetail /></ErrorBoundary>} />
            <Route path="stories" element={<ErrorBoundary><Stories /></ErrorBoundary>} />
            <Route path="artworks/:id" element={<ErrorBoundary><ArtworkDetail /></ErrorBoundary>} />
            <Route path="donate" element={<ErrorBoundary><Donate /></ErrorBoundary>} />
            <Route path="donate-clothing" element={<ErrorBoundary><DonateClothing /></ErrorBoundary>} />
            <Route path="shop" element={<ErrorBoundary><Shop /></ErrorBoundary>} />
            <Route path="shop/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
            <Route path="traceability" element={<ErrorBoundary><Traceability /></ErrorBoundary>} />
            <Route path="contact" element={<ErrorBoundary><Contact /></ErrorBoundary>} />
            <Route path="login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="auth/callback" element={<ErrorBoundary><AuthCallback /></ErrorBoundary>} />
            <Route path="forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
            <Route path="register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
            <Route path="profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
            <Route path="orders/:id" element={<ErrorBoundary><OrderDetail /></ErrorBoundary>} />
            <Route path="support" element={<ErrorBoundary><Support /></ErrorBoundary>} />
            <Route path="assistant" element={<ErrorBoundary><AiAssistant /></ErrorBoundary>} />
            <Route path="privacy" element={<ErrorBoundary><Privacy /></ErrorBoundary>} />
            <Route path="terms" element={<ErrorBoundary><Terms /></ErrorBoundary>} />
            <Route path="children-safety" element={<ErrorBoundary><ChildrenSafety /></ErrorBoundary>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SmoothTransition>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <>
      <AppLocaleSync />
      <Toaster
        position="top-right"
        gutter={12}
        containerStyle={{ top: 24, right: 24 }}
        toastOptions={{
          duration: 2600,
          style: {
            background: 'color-mix(in srgb, var(--color-paper) 94%, white)',
            color: 'var(--color-ink)',
            border: '1px solid color-mix(in srgb, var(--color-warm-gray) 72%, transparent)',
            boxShadow: '0 14px 38px rgba(26, 26, 22, 0.12)',
            padding: '14px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            lineHeight: '1.5',
            maxWidth: '420px',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-sage)',
              secondary: 'var(--color-paper)',
            },
            style: {
              border: '1px solid color-mix(in srgb, var(--color-sage) 28%, var(--color-warm-gray))',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-paper) 96%, white), color-mix(in srgb, var(--color-aged-stock) 90%, white))',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-rust)',
              secondary: 'var(--color-paper)',
            },
            style: {
              border: '1px solid color-mix(in srgb, var(--color-rust) 32%, var(--color-warm-gray))',
            },
          },
        }}
      />
      <AnimatedRoutes />
    </>
  );
}
