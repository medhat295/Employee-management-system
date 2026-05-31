import axios, { type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const TOKENS_KEY = 'auth_tokens';

function getTokens(): { access: string; refresh: string } | null {
  const raw = localStorage.getItem(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getTokens();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// Queue to hold requests that arrive while a token refresh is in flight
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      // Queue concurrent requests while refresh is in flight
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      const tokens = getTokens();

      if (!tokens?.refresh) {
        localStorage.removeItem(TOKENS_KEY);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<{ access: string }>(
          `${BASE_URL}/auth/refresh/`,
          { refresh: tokens.refresh },
        );
        const updated = { ...tokens, access: data.access };
        localStorage.setItem(TOKENS_KEY, JSON.stringify(updated));
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem(TOKENS_KEY);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show toast for every non-401 error
    if (error.response?.status !== 401) {
      const data = error.response?.data;
      const message =
        data?.detail ??
        (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null) ??
        error.message ??
        'Something went wrong.';
      toast.error(String(message));
    }

    return Promise.reject(error);
  },
);

export default api;
