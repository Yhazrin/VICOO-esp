import { create } from 'zustand';
import type { User } from '@/types';

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
  // Security: Access token stored in memory only (not localStorage).
  // Refresh token is in httpOnly cookie set by the server.
  // This prevents token theft via XSS — an injected script cannot read
  // JS runtime memory the way it can read localStorage/sessionStorage.
  accessToken: null,

  login: (user, accessToken, _refreshToken) => {
    // Store access token in memory for API requests.
    // Refresh token is managed by httpOnly cookie set by server.
    // No localStorage persistence — if the page refreshes, the app will
    // call /auth/refresh using the httpOnly refresh_token cookie.
    set({
      user,
      isAuthenticated: true,
      accessToken,
    });
  },

  logout: () => {
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
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      accessToken: accessToken || null,
    });
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  initAuth: () => {
    // On app load, do NOT read from localStorage.
    // The app should call /auth/refresh (using httpOnly cookie) to restore session.
    // This is handled by the App component's initialization logic.
  },
}));
