import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useHospitalStore
 * Centralized hospital/branch selection state.
 * Replaces the old HospitalContext.
 */

export const useHospitalStore = create()(
  persist(
    (set) => ({
      selectedHospital: null,
      
      setSelectedHospital: (hospital) => set({ 
        selectedHospital: hospital 
      }),
      
      clearHospital: () => set({ selectedHospital: null }),
      clearSelectedHospital: () => set({ selectedHospital: null }),
    }),
    {
      name: 'smartq-hospital-storage',
    }
  )
);
