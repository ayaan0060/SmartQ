import { create } from 'zustand';
import api from '../lib/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetch: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const r = await api.get('/notifications');
      const { notifications, unreadCount } = r.data.data;
      set({ notifications, unreadCount });
    } catch {
      // silently fail — not critical
    } finally {
      set({ loading: false });
    }
  },

  // Called by socket listener when new notification arrives
  push: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications].slice(0, 50),
    unreadCount: state.unreadCount + 1,
  })),

  markRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map(n =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch { /* ignore */ }
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch { /* ignore */ }
  },
}));
