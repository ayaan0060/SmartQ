import api from '../../lib/api';

/**
 * HospitalService
 * Handles all hospital and service related API calls.
 */
export const HospitalService = {
  getHospitals: async () => {
    const res = await api.get('/hospitals');
    // Backend returns: { success, data: { hospitals: [], count: n } }
    return Array.isArray(res.data.data) ? res.data.data : (res.data.data?.hospitals ?? []);
  },

  getHospitalServices: async (hospitalId) => {
    const res = await api.get(`/services/${hospitalId}`);
    return res.data.data;
  },

  getQueueStatus: async (hospitalId, serviceId) => {
    const res = await api.get(`/tokens/status/${hospitalId}/${serviceId}`);
    return res.data.data;
  }
};
