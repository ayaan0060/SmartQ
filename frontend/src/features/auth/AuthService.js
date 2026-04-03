import api from '../../lib/api';
import { useAuthStore } from './useAuthStore';

/**
 * AuthService
 * Handles all authentication-related API calls.
 */
export const AuthService = {
  login: async (phone, password) => {
    const res = await api.post('/auth/login', { phone, password });
    const { token, user, hospitalName } = res.data.data ?? res.data;
    useAuthStore.getState().setAuth(user, token, hospitalName ?? null);
    localStorage.setItem('token', token);
    return user;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token, user, hospitalName } = res.data.data ?? res.data;
    useAuthStore.getState().setAuth(user, token, hospitalName ?? null);
    localStorage.setItem('token', token);
    return user;
  },

  logout: () => {
    useAuthStore.getState().logout();
  }
};
