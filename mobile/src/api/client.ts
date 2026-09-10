import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export interface ApiEnvelope<T> {
  status: 'success' | 'error';
  data: T;
}

export const unwrap = <T>(envelope: ApiEnvelope<T>): T => envelope.data;

export function getApiErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response: { data?: { message?: string } } }).response.data?.message === 'string'
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  return 'Something went wrong. Please try again.';
}

export const TOKEN_KEYS = {
  access: 'agri_access_token',
  refresh: 'agri_refresh_token',
} as const;

export const tokenStorage = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.access);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.refresh);
  },
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get(TOKEN_KEYS.access);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = await tokenStorage.get(TOKEN_KEYS.refresh);
      if (refresh) {
        try {
          const { data } = await axios.post<ApiEnvelope<{ access: string }>>(
            `${API_BASE_URL}/auth/token/refresh/`,
            { refresh },
          );
          await tokenStorage.set(TOKEN_KEYS.access, data.data.access);
          original.headers.Authorization = `Bearer ${data.data.access}`;
          return api(original);
        } catch {
          await tokenStorage.clear();
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;