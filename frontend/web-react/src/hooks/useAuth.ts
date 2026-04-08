import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/auth';
import type { LoginRequest, RegisterRequest } from '@/types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/utils/error';

export function useAuth() {
  const { user, isAuthenticated, login, logout, setLoading } = useAuthStore();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      login(data.user, data.access_token, data.refresh_token);
      queryClient.invalidateQueries();
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
    const msg = getErrorMessage(loginMutation.error);
    if (msg === 'Invalid credentials') return t('login.error.invalidCredentials', 'Invalid email or password');
    if (msg === 'User not found') return t('login.error.userNotFound', 'User not found');
    return msg;
  };

  const getLocalizedRegisterError = () => {
    if (!registerMutation.error) return undefined;
    const msg = getErrorMessage(registerMutation.error);
    if (msg.includes('already exists')) return t('register.error.userExists', 'User already exists');
    return msg;
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: getLocalizedLoginError(),
    registerError: getLocalizedRegisterError(),
  };
}
