import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import PageWrapper from '@/components/layout/PageWrapper';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import GrainOverlay from '@/components/editorial/GrainOverlay';

/**
 * OAuth Callback Page
 *
 * After GitHub/Google OAuth, the backend redirects here with an access_token
 * in the query string. This page:
 * 1. Extracts the token
 * 2. Stores it in the auth store
 * 3. Redirects to home
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { restoreSession, setAccessToken } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const nickname = searchParams.get('nickname');
    const email = searchParams.get('email');
    const avatar = searchParams.get('avatar');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (!accessToken) {
      setError('Authentication failed. No token received.');
      return;
    }

    // Store the access token and restore session
    const user = {
      id: 0,
      email: email || '',
      nickname: nickname || 'User',
      role: 'user' as const,
      avatar: avatar || undefined,
    };

    restoreSession(user, accessToken);

    // Redirect to home after a brief moment
    const timer = setTimeout(() => navigate('/', { replace: true }), 500);
    return () => clearTimeout(timer);
  }, [searchParams, navigate, restoreSession, setAccessToken]);

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="min-h-[100dvh] flex items-center justify-center relative">
        <GrainOverlay />
        <div className="text-center relative z-10">
          {error ? (
            <>
              <h2 className="font-display text-2xl text-ink mb-4">Authentication Failed</h2>
              <p className="font-body text-body-sm text-ink-faded mb-6">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="font-body text-body-sm tracking-[0.15em] uppercase bg-ink text-paper px-8 py-3 hover:bg-rust transition-colors cursor-pointer"
              >
                Back to Login
              </button>
            </>
          ) : (
            <>
              <div className="w-8 h-8 border-2 border-rust border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-body text-body-sm text-ink-faded tracking-wide">
                Authenticating...
              </p>
            </>
          )}
        </div>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
