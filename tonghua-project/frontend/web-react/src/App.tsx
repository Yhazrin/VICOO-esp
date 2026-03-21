import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import FlipPageTransition from '@/components/transitions/FlipPageTransition';
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
import Profile from '@/pages/Profile';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import ChildrenSafety from '@/pages/ChildrenSafety';
import NotFound from '@/pages/NotFound';
import { useSessionRestore } from '@/hooks/useSessionRestore';

function AnimatedRoutes() {
  const location = useLocation();
  useSessionRestore(); // Restore session on app load

  return (
    <ErrorBoundary>
      <FlipPageTransition>
        <Routes location={location} key={location.pathname}>
          <Route element={<Layout />}>
            <Route index element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="about" element={<ErrorBoundary><About /></ErrorBoundary>} />
            <Route path="campaigns" element={<ErrorBoundary><Campaigns /></ErrorBoundary>} />
            <Route path="campaigns/:id" element={<ErrorBoundary><CampaignDetail /></ErrorBoundary>} />
            <Route path="stories" element={<ErrorBoundary><Stories /></ErrorBoundary>} />
            <Route path="artworks/:id" element={<ErrorBoundary><ArtworkDetail /></ErrorBoundary>} />
            <Route path="donate" element={<ErrorBoundary><Donate /></ErrorBoundary>} />
            <Route path="shop" element={<ErrorBoundary><Shop /></ErrorBoundary>} />
            <Route path="shop/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
            <Route path="traceability" element={<ErrorBoundary><Traceability /></ErrorBoundary>} />
            <Route path="contact" element={<ErrorBoundary><Contact /></ErrorBoundary>} />
            <Route path="login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
            <Route path="register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
            <Route path="profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
            <Route path="privacy" element={<ErrorBoundary><Privacy /></ErrorBoundary>} />
            <Route path="terms" element={<ErrorBoundary><Terms /></ErrorBoundary>} />
            <Route path="children-safety" element={<ErrorBoundary><ChildrenSafety /></ErrorBoundary>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </FlipPageTransition>
    </ErrorBoundary>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
