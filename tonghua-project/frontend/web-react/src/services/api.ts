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

/**
 * Generate HMAC-SHA256 signature for request authentication
 */
async function generateSignature(method: string, path: string, timestamp: string, nonce: string, body: string): Promise<string> {
  // Use the same secret key as the backend
  const secretKey = import.meta.env.VITE_API_SECRET_KEY;
  if (!secretKey) {
    console.warn('VITE_API_SECRET_KEY not set — request signing disabled');
    return '';
  }

  // Build the string to sign: method + "\n" + path + "\n" + timestamp + "\n" + nonce + "\n" + body
  const stringToSign = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}`;

  // Generate HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // Add security headers for request signing
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomUUID();

    // Get request body for signing
    const body = config.data ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : '';

    // Generate signature (skipped if no secret key configured)
    const signature = await generateSignature(
      config.method?.toUpperCase() || 'GET',
      config.url || '',
      timestamp,
      nonce,
      body
    );

    if (signature) {
      config.headers['X-Signature'] = signature;
      config.headers['X-Timestamp'] = timestamp;
      config.headers['X-Nonce'] = nonce;
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
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
