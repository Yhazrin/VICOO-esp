import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is required. Set it in .env file.');
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // Send httpOnly cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — add access token and security headers
api.interceptors.request.use(
  async (config) => {
    // Get access token from auth store
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if this IS the refresh request itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Wait for the in-flight refresh to complete
        return new Promise((resolve) => {
          addRefreshSubscriber(() => {
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // The new access token is in the response body
        // The new refresh token is set as an httpOnly cookie by the server
        const { access_token } = refreshResponse.data.data;
        // Update the access token in memory (via auth store)
        // Note: We don't store the refresh token in memory - it's in the httpOnly cookie
        useAuthStore.getState().setAccessToken(access_token);
        isRefreshing = false;
        onRefreshed(access_token);
        return api(originalRequest);
      } catch {
        isRefreshing = false;
        refreshSubscribers = [];
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
