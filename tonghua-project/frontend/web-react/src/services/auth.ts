import api from './api';
import type { User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

// Backend response structure (nested - register endpoint)
interface BackendRegisterResponse {
  success: boolean;
  data: {
    user: User;
    token: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
  };
  message?: string;
}

// Backend response structure (nested - login endpoint, now consistent with register)
interface BackendLoginResponse {
  success: boolean;
  data: {
    user: User;
    token: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
  };
  message?: string;
}

/**
 * HTTP-Only Cookie Authentication Strategy:
 * - Access tokens are stored in memory (reactive store state)
 * - Refresh tokens are stored in httpOnly cookies set by the server
 * - The API interceptor (api.ts) automatically handles token refresh on 401 errors
 * - Do NOT manually inject tokens into request bodies or headers
 *
 * Token refresh flow:
 * 1. Client makes a request with expired access token in memory
 * 2. Server returns 401 Unauthorized
 * 3. Interceptor catches 401 and sends a POST to /auth/refresh WITH credentials (cookies)
 * 4. Server validates the httpOnly refresh token cookie and issues new tokens
 * 5. New tokens are stored (access token in memory, refresh token in new cookie)
 * 6. Original request is retried with the new access token
 */
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<BackendLoginResponse>('/auth/login', data);
    // Transform backend response to frontend format
    return {
      user: response.data.data.user,
      access_token: response.data.data.token.access_token,
      refresh_token: response.data.data.token.refresh_token,
    };
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<BackendRegisterResponse>('/auth/register', data);
    // Transform backend response to frontend format
    return {
      user: response.data.data.user,
      access_token: response.data.data.token.access_token,
      refresh_token: response.data.data.token.refresh_token,
    };
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    // Note: Tokens are cleared from memory by useAuthStore after this call
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<{ success: boolean; data: User }>('/users/me');
    return response.data.data;
  },

  updateProfile: async (data: { nickname?: string; avatar?: string; phone?: string }): Promise<User> => {
    const response = await api.put<{ success: boolean; data: User }>('/users/me', data);
    return response.data.data;
  },

  // REMOVED: Legacy method that injected token in request body
  // The correct approach uses httpOnly cookies managed by api.ts interceptor
};
