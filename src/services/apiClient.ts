import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

/** Port the local backend listens on (see backend .env PORT). */
const LOCAL_BACKEND_PORT = 3000;

/**
 * Resolve the backend base URL.
 *
 * In development (Expo Go / dev client) we auto-target the local backend on the
 * SAME host Metro is served from — so `npx expo start` "just works" against
 * localhost without needing APP_ENV=local or a hardcoded LAN IP that drifts.
 *
 * Production builds (and any session started with an explicit API_URL) use the
 * configured `extra.apiUrl` instead.
 */
function resolveBaseUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  const forced = Constants.expoConfig?.extra?.apiUrlForced as boolean | undefined;

  if (__DEV__ && !forced) {
    // hostUri looks like "192.168.1.8:8081"; fall back to older fields.
    const hostUri =
      Constants.expoConfig?.hostUri ??
      (Constants as any).expoGoConfig?.debuggerHost ??
      (Constants as any).manifest?.debuggerHost;
    const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;
    if (host) {
      return `http://${host}:${LOCAL_BACKEND_PORT}`;
    }
  }

  return configured ?? '';
}

const BASE_URL = resolveBaseUrl();

if (!BASE_URL) {
  throw new Error(
    '[apiClient] Could not resolve a backend URL. ' +
    'In dev, ensure Metro is running; otherwise set API_URL / APP_ENV.'
  );
}

console.log('[apiClient] baseURL =', `${BASE_URL}/api`);

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('admin_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Token refresh on 401 ────────────────────────────────────────────────────
// Access tokens are short-lived (15m) but the refresh token lasts 7 days. When a
// request 401s, transparently refresh the access token and retry — so the admin
// stays logged in for the full refresh-token lifetime instead of being kicked
// out every 15 minutes. Concurrent 401s share a single in-flight refresh.
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const flushQueue = (token: string | null) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const isAuthCall =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true;

      // A refresh is already running — wait for it, then retry with the new token.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) return reject(new Error('Session expired. Please log in again.'));
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('admin_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        const newAccess: string = data.data.accessToken;
        const newRefresh: string = data.data.refreshToken;

        await SecureStore.setItemAsync('admin_access_token', newAccess);
        await SecureStore.setItemAsync('admin_refresh_token', newRefresh);

        flushQueue(newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh token is gone/expired (>7 days) — clear tokens so the app logs out.
        flushQueue(null);
        await SecureStore.deleteItemAsync('admin_access_token');
        await SecureStore.deleteItemAsync('admin_refresh_token');
        return Promise.reject(new Error('Session expired. Please log in again.'));
      } finally {
        isRefreshing = false;
      }
    }

    const data = error?.response?.data;
    let message = data?.message ?? error?.message ?? 'Something went wrong';

    // Surface field-level validation errors so failures say WHICH field failed
    // and why (e.g. "Validation failed (password: Password is required)").
    if (data?.errors && typeof data.errors === 'object') {
      const details = Object.entries(data.errors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join(' | ');
      if (details) message = `${message} (${details})`;
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
