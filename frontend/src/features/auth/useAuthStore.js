import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hospitalName: null,
      isAuthenticated: false,

      setAuth: (user, token, hospitalName = null) => set({ user, token, hospitalName, isAuthenticated: !!user }),

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, hospitalName: null, isAuthenticated: false });
      },

      clearAuth: () => set({ user: null, token: null, hospitalName: null, isAuthenticated: false }),

      setUser: (user) => set({ user }),
      setHospitalName: (hospitalName) => set({ hospitalName }),
      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      // Role helpers
      isSuperAdmin: () => get().user?.role === 'super-admin',
      isHospitalAdmin: () => get().user?.role === 'hospital-admin',
      isStaff: () => get().user?.role === 'staff',
      isAdmin: () => ['super-admin', 'hospital-admin', 'staff'].includes(get().user?.role),

      // Tenant helper
      getHospitalId: () => get().user?.hospitalId || null,
    }),
    {
      name: 'smartq-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        hospitalName: state.hospitalName,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
