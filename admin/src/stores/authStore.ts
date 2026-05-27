import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'user' | 'guardian' | 'compliance';
  avatar?: string;
  provider?: 'password' | 'oauth' | 'adfs';
  permissions?: string[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  redirectPath: string | null;
  login: (user: AuthUser, token: string, redirectPath?: string) => void;
  restoreSession: (user: AuthUser, token: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  setRedirectPath: (path: string | null) => void;
  clearRedirectPath: () => void;
}

/**
 * Check if path is an admin route
 */
function isAdminPath(path: string): boolean {
  return path.startsWith('/admin') || path === '/admin';
}

/**
 * Check if path is an external URL (security check)
 */
function isExternalUrl(path: string): boolean {
  return path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//');
}

/**
 * Check if user has admin access
 */
export function hasAdminAccess(role: AuthUser['role']): boolean {
  return ['admin', 'editor', 'compliance'].includes(role);
}

/**
 * Get the default redirect path based on user role
 */
export function getDefaultRedirectPath(role: AuthUser['role']): string {
  if (hasAdminAccess(role)) {
    return '/admin';
  }
  return '/';
}

/**
 * Resolve post-login redirect path
 * Enforces role-based access control:
 * - Admin users can only go to /admin/* routes
 * - Regular users can only go to non-admin routes
 * - External URLs and javascript: are blocked
 */
export function resolvePostLoginRedirect(
  user: AuthUser,
  redirectPath?: string | null
): string {
  const isAdmin = hasAdminAccess(user.role);

  // Block external URLs and javascript: redirects
  if (redirectPath && isExternalUrl(redirectPath)) {
    console.warn('[Auth] Blocked external URL redirect:', redirectPath);
    redirectPath = undefined;
  }

  // If redirect is specified
  if (redirectPath) {
    // Admin users: only allow /admin/* paths
    if (isAdmin) {
      if (isAdminPath(redirectPath)) {
        return redirectPath;
      }
      // Redirect to /admin if trying to go to user path
      console.warn('[Auth] Admin user redirected from user path:', redirectPath);
      return '/admin';
    } else {
      // Regular users: only allow non-admin paths
      if (!isAdminPath(redirectPath)) {
        return redirectPath;
      }
      // Redirect to / if trying to go to admin path
      console.warn('[Auth] User redirected from admin path:', redirectPath);
      return '/';
    }
  }

  // Use default path based on role
  return getDefaultRedirectPath(user.role);
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.includes(permission) ?? false;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      redirectPath: null,

      login: (user, token, redirectPath) => {
        // Resolve the actual redirect path with role enforcement
        const targetPath = resolvePostLoginRedirect(user, redirectPath || get().redirectPath);

        set({
          user,
          token,
          isAuthenticated: true,
          redirectPath: null, // Clear stored redirect after use
        });

        // Navigate to target path
        window.location.href = targetPath;
      },

      restoreSession: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          redirectPath: null,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          redirectPath: null,
        });
        // Invalidate server-side session
        fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' })
          .catch(() => {});
      },

      setAccessToken: (token) => {
        set({ token });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setRedirectPath: (path) => {
        set({ redirectPath: path });
      },

      clearRedirectPath: () => {
        set({ redirectPath: null });
      },
    }),
    {
      name: 'vicoo-admin-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
