import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import PageWrapper from '@/components/layout/PageWrapper';
import PaperTextureBackground from '@/components/editorial/PaperTextureBackground';
import api from '@/services/api';
import type { User } from '@/types';

const ADMIN_ROLES = ['admin', 'editor', 'compliance'];

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { restoreSession, setAccessToken } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function completeAuthentication() {
      const accessToken = searchParams.get('access_token');
      const nickname = searchParams.get('nickname');
      const email = searchParams.get('email');
      const avatar = searchParams.get('avatar');
      const role = searchParams.get('role') as User['role'] | null;
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(t('authCallback.authenticationFailed'));
        return;
      }

      if (!accessToken) {
        setError(t('authCallback.noTokenReceived'));
        return;
      }

      setAccessToken(accessToken);

      let user: User = {
        id: 0,
        email: email || '',
        nickname: nickname || t('authCallback.user', 'User'),
        role: role || 'user',
        avatarUrl: avatar || undefined,
        createdAt: new Date().toISOString(),
      };

      try {
        const profile = await api.get<{ success: boolean; data: User }>('/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        user = profile.data.data;
      } catch {
        // Keep query-string fallback for legacy OAuth providers that do not expose /users/me.
      }

      if (cancelled) return;

      if (ADMIN_ROLES.includes(user.role)) {
        useAuthStore.getState().logout();
        window.location.replace('/admin/');
        return;
      }

      restoreSession(user, accessToken);
      setTimeout(() => {
        if (!cancelled) navigate('/', { replace: true });
      }, 500);
    }

    completeAuthentication();
    return () => { cancelled = true; };
  }, [searchParams, navigate, restoreSession, setAccessToken, t]);

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
