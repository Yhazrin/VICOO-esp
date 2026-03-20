import { create } from 'zustand';
import type { User } from '@/types';

const ACCESS_TOKEN_KEY = 'tonghua_access_token';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  restoreSession: (user: User, accessToken?: string) => void;
  setAccessToken: (token: string | null) => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set, _get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  accessToken: null,

  login: (user, accessToken, _refreshToken) => {
    // Store access token in memory for API requests
    // Refresh token is managed by httpOnly cookie set by server
    // Also store in localStorage for session persistence across page refreshes
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    set({
      user,
      isAuthenticated: true,
      accessToken,
    });
  },

  logout: () => {
    // Server will clear httpOnly cookies on /auth/logout
    // Also clear localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    set({
      user: null,
      isAuthenticated: false,
      accessToken: null,
    });
  },

  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  restoreSession: (user, accessToken) => {
    // Store access token in localStorage for persistence
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      accessToken: accessToken || null,
    });
  },

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    set({ accessToken: token });
  },

  initAuth: () => {
    // Initialize auth state from localStorage on app load
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (storedToken) {
      set({ accessToken: storedToken });
    }
  },
}));
