import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { authApi } from '@/services/auth';
import type { LoginRequest, RegisterRequest } from '@/types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/utils/error';
import { localizeLoginErrorMessage } from '@/utils/loginError';
import { localizeRegisterErrorMessage } from '@/utils/registerError';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      login(data.user, data.access_token, data.refresh_token);
      queryClient.invalidateQueries();
      // Merge local cart into server cart
      useCartStore.getState().syncWithServer();
      toast.success(t('auth.loginSuccess', 'Login successful'));
    },
    onSettled: () => setLoading(false),
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      login(data.user, data.access_token, data.refresh_token);
      queryClient.invalidateQueries();
      // Merge local cart into server cart
      useCartStore.getState().syncWithServer();
      toast.success(t('auth.registerSuccess', 'Registration successful'));
    },
    onSettled: () => setLoading(false),
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast.success(t('auth.logoutSuccess', 'Logged out successfully'));
    },
    onError: () => {
      logout();
      queryClient.clear();
      toast.success(t('auth.logoutSuccess', 'Logged out successfully'));
    },
  });

  const getLocalizedLoginError = () => {
    if (!loginMutation.error) return undefined;
    return localizeLoginErrorMessage(getErrorMessage(loginMutation.error), t);
  };

  const getLocalizedRegisterError = () => {
    if (!registerMutation.error) return undefined;
    const msg = getErrorMessage(registerMutation.error);
    // Prefer the structured code → i18n lookup, fall back to legacy string
    // matching for any un-styled 4xx (e.g. older backends, proxy 502s).
    return localizeRegisterErrorMessage(registerMutation.error, t) || msg;
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    loginAsync: loginMutation,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: getLocalizedLoginError(),
    registerError: getLocalizedRegisterError(),
  };
}
