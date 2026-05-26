import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import PageWrapper from '@/components/layout/PageWrapper';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';


/**
 * OAuth Callback Page
 *
 * After GitHub/Google OAuth, the backend redirects here with an access_token
 * in the URL fragment (#access_token=...). The fragment is never sent to servers,
 * preventing token leakage in logs, Referer headers, and browser history.
 *
 * This page:
 * 1. Extracts the token from the URL fragment
 * 2. Stores it in the auth store
 * 3. Redirects to home
 */
export default function AuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { restoreSession } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    // Parse token from URL fragment (e.g., #access_token=xxx&nickname=yyy)
    const hash = window.location.hash.substring(1); // Remove leading #
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const nickname = params.get('nickname');
    const email = params.get('email');
    const avatar = params.get('avatar');
    const errorParam = params.get('error');

    // Clean the fragment from the URL bar immediately
    window.history.replaceState(null, '', window.location.pathname);

    if (errorParam) {
      setError(t('authCallback.authenticationFailed'));
      return;
    }

    if (!accessToken) {
      setError(t('authCallback.noTokenReceived'));
      return;
    }

    // Store the access token and restore session
    const user = {
      id: 0,
      email: email || '',
      nickname: nickname || t('authCallback.user', 'User'),
      role: 'user' as const,
      avatarUrl: avatar || undefined,
      createdAt: new Date().toISOString(),
    };

    restoreSession(user, accessToken);

    // Redirect to home after a brief moment
    const timer = setTimeout(() => navigate('/', { replace: true }), 500);
    return () => clearTimeout(timer);
  }, [navigate, restoreSession, t]);

  return (
    <PageWrapper>
      <PaperTextureBackground variant="paper" className="min-h-[100dvh] flex items-center justify-center relative">

        <div className="text-center relative z-10">
          {error ? (
            <>
              <h2 className="font-display text-2xl text-ink mb-4">{t('authCallback.authenticationFailed')}</h2>
              <p className="font-body text-body-sm text-ink-faded mb-6">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="font-body text-body-sm tracking-[0.15em] uppercase bg-ink text-paper px-8 py-3 hover:bg-rust transition-colors cursor-pointer"
              >
                {t('authCallback.backToLogin')}
              </button>
            </>
          ) : (
            <>
              <div className="w-8 h-8 border-2 border-rust border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-body text-body-sm text-ink-faded tracking-wide">
                {t('authCallback.authenticating')}
              </p>
            </>
          )}
        </div>
      </PaperTextureBackground>
    </PageWrapper>
  );
}
