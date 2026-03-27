import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/auth';
import api from '@/services/api';

/**
 * Hook to restore user session on app load.
 * Security: Access token is NOT stored in localStorage (XSS prevention).
 * Instead, we attempt a /auth/refresh call using the httpOnly refresh_token cookie.
 * If refresh succeeds, the new access token is stored in memory and we fetch the user profile.
 */
export function useSessionRestore() {
  const { restoreSession, setLoading, isAuthenticated, setAccessToken } = useAuthStore();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Don't attempt refresh on auth pages (login/register) to avoid redirect loops
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Attempt session restoration via /auth/refresh on mount
  useEffect(() => {
    let cancelled = false;
    async function attemptRefresh() {
      try {
        const refreshResponse = await api.post(
          '/auth/refresh',
          {},
          { withCredentials: true }
        );
        const { access_token } = refreshResponse.data.data;
        if (!cancelled) {
          setAccessToken(access_token);
          setRefreshToken(access_token);
        }
      } catch {
        // No valid refresh cookie — user is not logged in. This is expected.
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    }
    if (!isAuthenticated && !isAuthPage) {
      attemptRefresh();
    } else {
      setIsInitialized(true);
    }
    return () => { cancelled = true; };
  }, [isAuthenticated, setAccessToken, isAuthPage]);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['session'],
    queryFn: authApi.getProfile,
    enabled: isInitialized && !isAuthenticated && !isAuthPage && !!refreshToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (user && !isAuthenticated) {
      restoreSession(user, refreshToken || undefined);
    }
  }, [user, isAuthenticated, restoreSession, refreshToken]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  return {
    isLoading: isLoading || !isInitialized,
    error,
    user,
  };
}
