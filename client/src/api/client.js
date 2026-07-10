import axios from 'axios';

// In dev, Vite proxies /api -> :5050. For a Capacitor build, set VITE_API_URL
// to your deployed API origin (e.g. https://api.influconnect.com).
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const api = axios.create({ baseURL });

export const TOKEN_KEY = 'influ_token';

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

// Bootstrap the header from storage on load
const existing = localStorage.getItem(TOKEN_KEY);
if (existing) api.defaults.headers.common.Authorization = `Bearer ${existing}`;

// Normalize errors to a friendly message
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
    const details = error.response?.data?.details;
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      setAuthToken(null);
    }
    return Promise.reject({ message, details, status: error.response?.status });
  }
);

export const API_ORIGIN = import.meta.env.VITE_API_URL || '';
