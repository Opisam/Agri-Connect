import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

function getMetroHost(): string | null {
  const scriptURL = (NativeModules.SourceCode as
    | { scriptURL?: string }
    | undefined)?.scriptURL;
  if (!scriptURL) return null;
  // Expo Go uses custom schemes (e.g. exp://192.168.1.5:8081).
  const match = scriptURL.match(/^[a-z][a-z0-9+.-]*:\/\/([^/:]+)(?::\d+)?/i);
  return match ? match[1] : null;
}

function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }
  // In Expo Go / dev builds the Metro bundler host is the dev machine, so the
  // Django server on that same machine is reachable at the same address.
  const host = getMetroHost();
  if (host) {
    return `http://${host}:8000/api/v1`;
  }
  // Android emulators reach the host machine via 10.0.2.2.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
}

const API_BASE_URL = resolveApiBaseUrl();

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
    typeof (error as { response: { data?: unknown } }).response.data === 'object' &&
    (error as { response: { data?: unknown } }).response.data !== null
  ) {
    const data = (error as { response: { data: Record<string, unknown> } })
      .response.data;
    const message = data.message ?? data.detail;
    if (typeof message === 'string' && message) {
      return message;
    }
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