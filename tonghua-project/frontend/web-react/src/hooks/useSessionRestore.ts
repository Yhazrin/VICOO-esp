import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/auth';

/**
 * Hook to restore user session on app load.
 * Fetches the current user profile using the access token from localStorage.
 */
export function useSessionRestore() {
  const { restoreSession, setLoading, isAuthenticated, accessToken, initAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    initAuth();
    setIsInitialized(true);
  }, [initAuth]);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['session'],
    queryFn: authApi.getProfile,
    enabled: isInitialized && !isAuthenticated && !!accessToken, // Only fetch after init and if not authenticated but have a token
    retry: false, // Don't retry on 401/403 errors
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (user && !isAuthenticated) {
      restoreSession(user, accessToken || undefined);
    }
  }, [user, isAuthenticated, restoreSession, accessToken]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  return {
    isLoading,
    error,
    user,
  };
}
