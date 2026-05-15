import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl as string | undefined;

if (!BASE_URL) {
  throw new Error(
    '[apiClient] apiUrl missing from Constants.expoConfig.extra. ' +
    'Ensure APP_ENV is set correctly for the build profile.'
  );
}

const apiClient = axios.create({
  baseURL: `${BASE_URL!}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('admin_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.message ?? error?.message ?? 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
