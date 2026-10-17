import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
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

// Response interceptor for consistent error handling and 401 redirection
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      // Network / offline error
      return Promise.reject({
        isNetworkError: true,
        message: 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হচ্ছে না (Backend server offline). Please check if backend is running on port 8000.',
      });
    }

    const { status, data } = error.response;
    if (status === 401) {
      localStorage.removeItem('bhumilens_token');
      localStorage.removeItem('bhumilens_user');
      // Redirect to login if not already on login/register
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
