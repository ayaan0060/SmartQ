import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/useAuthStore';
import { useHospitalStore } from '../features/hospital/useHospitalStore';
import { Shield } from 'lucide-react';

const ADMIN_ROLES = ['super-admin', 'hospital-admin', 'staff', 'receptionist', 'doctor', 'admin'];

const PendingScreen = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0F19' }}>
    <div className="text-center space-y-4 max-w-md px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl mx-auto"
        style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <Shield size={32} style={{ color: '#F59E0B' }} />
      </div>
      <h2 className="text-xl font-bold text-white">Registration Under Review</h2>
      <p className="text-sm" style={{ color: '#94A3B8' }}>
        Your hospital registration is pending approval by our team. You'll be able to access the admin panel once approved (within 24–48 hours).
      </p>
      <button onClick={() => { useAuthStore.getState().logout(); window.location.href = '/login'; }}
        className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
        style={{ background: '#1E293B' }}>
        Back to Login
      </button>
    </div>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false, requireHospital = false }) => {
  const { user } = useAuthStore();
  const selectedHospital = useHospitalStore((state) => state.selectedHospital);

  if (!user) return <Navigate to="/login" replace />;

  // Block pending/inactive hospital-admin, receptionist, doctor from accessing portal
  if (['hospital-admin', 'receptionist', 'doctor'].includes(user.role)) {
    const { hospitalStatus } = useAuthStore.getState();
    if (hospitalStatus === 'pending' || hospitalStatus === 'inactive') {
      return <PendingScreen />;
    }
  }

  if (adminOnly && !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/select-hospital" replace />;
  }

  if (requireHospital && !selectedHospital && !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/select-hospital" replace />;
  }

  return children;
};

export default ProtectedRoute;
