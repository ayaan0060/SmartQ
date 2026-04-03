import axios from 'axios';
import { useAuthStore } from '../features/auth/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject Token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized — skip redirect on public pages (login/register)
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isPublicPage = path.includes('/login') || path.includes('/register');
      if (!isPublicPage) {
        useAuthStore.getState().logout();
        // Use setTimeout to avoid triggering redirect during a React render cycle
        setTimeout(() => { window.location.href = '/login'; }, 0);
      }
    }

    // Handle rate limit (429)
    if (error.response?.status === 429) {
      console.warn('[API] Rate limit hit on', error.config?.url);
    }

    // Attach a clean display message WITHOUT spreading (spreading AxiosError
    // drops non-enumerable properties: message, stack, name — breaking catch blocks)
    error.displayMessage =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    console.error('[API Error]', error.config?.url, error.response?.status, error.displayMessage);
    return Promise.reject(error);
  }
);

export default api;
