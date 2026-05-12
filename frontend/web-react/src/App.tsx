import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SmoothTransition from '@/components/transitions/SmoothTransition';
import ErrorBoundary from '@/components/editorial/ErrorBoundary';
import CartDrawer from '@/components/cart/CartDrawer';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';

const UniqloHome = lazy(() => import('@/pages/UniqloHome'));
const About = lazy(() => import('@/pages/About'));
const Shop = lazy(() => import('@/pages/Shop'));
const ImpactShop = lazy(() => import('@/pages/ImpactShop'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Contact = lazy(() => import('@/pages/Contact'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Donate = lazy(() => import('@/pages/Donate'));
const DonationCertificate = lazy(() => import('@/pages/DonationCertificate'));
const Profile = lazy(() => import('@/pages/Profile'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const ChildrenSafety = lazy(() => import('@/pages/ChildrenSafety'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const OrderDetail = lazy(() => import('@/pages/OrderDetail'));
const Support = lazy(() => import('@/pages/Support'));
const AiAssistant = lazy(() => import('@/pages/AiAssistant'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const AiDesign = lazy(() => import('@/pages/AiDesign'));
const SupplyChainStudio = lazy(() => import('@/pages/SupplyChainStudio'));

function normalizeLang(code: string | undefined) {
  if (!code) return '';
  return code.split('-')[0] ?? code;
}

function AppLocaleSync() {
  const { i18n } = useTranslation();
  const currentLocale = useUIStore((state) => state.currentLocale);

  useEffect(() => {
    const resolved = normalizeLang(i18n.resolvedLanguage || i18n.language);
    if (resolved !== currentLocale) {
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
      <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <SmoothTransition>
        {/* Do not key Routes by pathname — that remounts Layout/Header on every navigation (feels like a full reload). */}
        <Routes location={location}>
          {/* Auth pages — standalone, no header/footer */}
          <Route path="login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
          <Route path="register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
          <Route path="forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />

          {/* Company portal + utility pages use standard Layout */}
          <Route element={<Layout />}>
            <Route index element={<ErrorBoundary><UniqloHome /></ErrorBoundary>} />
            <Route path="shop" element={<ErrorBoundary><Shop /></ErrorBoundary>} />
            <Route path="shop/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
            <Route path="impact/shop" element={<ErrorBoundary><ImpactShop /></ErrorBoundary>} />
            <Route path="impact/shop/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
            <Route path="about" element={<ErrorBoundary><About /></ErrorBoundary>} />
            <Route path="contact" element={<ErrorBoundary><Contact /></ErrorBoundary>} />
            <Route path="donate" element={<ErrorBoundary><Donate /></ErrorBoundary>} />
            <Route path="donations/:id/certificate" element={<ErrorBoundary><DonationCertificate /></ErrorBoundary>} />
            <Route path="auth/callback" element={<ErrorBoundary><AuthCallback /></ErrorBoundary>} />
            <Route path="profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
            <Route path="orders/:id" element={<ErrorBoundary><OrderDetail /></ErrorBoundary>} />
            <Route path="checkout" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
            <Route path="support" element={<ErrorBoundary><Support /></ErrorBoundary>} />
            <Route path="ai-design" element={<ErrorBoundary><AiDesign /></ErrorBoundary>} />
            <Route path="studio/supply-chain" element={<ErrorBoundary><SupplyChainStudio /></ErrorBoundary>} />
            <Route path="assistant" element={<ErrorBoundary><AiAssistant /></ErrorBoundary>} />
            <Route path="privacy" element={<ErrorBoundary><Privacy /></ErrorBoundary>} />
            <Route path="terms" element={<ErrorBoundary><Terms /></ErrorBoundary>} />
            <Route path="children-safety" element={<ErrorBoundary><ChildrenSafety /></ErrorBoundary>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SmoothTransition>
      </Suspense>
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
      <CartDrawer />
    </>
  );
}
