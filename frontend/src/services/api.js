import axios from 'axios';
import { handleMockRequest } from './mockService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bhumilens_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: if real backend responds with JSON, use it.
// If backend returns HTML (Vercel rewrite) or fails with network error, fallback to deterministic demo mock.
api.interceptors.response.use(
  async (response) => {
    // If Vercel rewrote /api/... to index.html (string starting with '<!doctype html'), fallback to mock
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html')) {
      const url = response.config.url;
      const method = response.config.method?.toLowerCase();
      let reqData = {};
      try {
        reqData = response.config.data ? JSON.parse(response.config.data) : {};
      } catch {}
      return await handleMockRequest(url, method, reqData);
    }
    return response.data;
  },
  async (error) => {
    // Check if we should fallback to cloud demo mode on network or 404/405/502 errors
    const config = error.config;
    if (config) {
      const status = error.response?.status;
      const isNetworkOrNotFound = !error.response || status === 404 || status === 405 || status === 502 || status === 503;
      if (isNetworkOrNotFound) {
        try {
          const url = config.url;
          const method = config.method?.toLowerCase();
          let reqData = {};
          try {
            reqData = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};
          } catch {}
          return await handleMockRequest(url, method, reqData);
        } catch (mockErr) {
          return Promise.reject(mockErr);
        }
      }
    }

    const { status, data } = error.response || {};
    if (status === 401) {
      localStorage.removeItem('bhumilens_token');
      localStorage.removeItem('bhumilens_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }

    const detailMsg = data?.detail || data?.message || 'অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে (An unexpected error occurred)';
    return Promise.reject({
      status,
      message: detailMsg,
      data,
    });
  }
);

export default api;
