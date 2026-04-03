import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/useAuthStore';
import { useHospitalStore } from '../features/hospital/useHospitalStore';

const ProtectedRoute = ({ children, adminOnly = false, requireHospital = false }) => {
  const { user } = useAuthStore();
  const selectedHospital = useHospitalStore((state) => state.selectedHospital);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const ADMIN_ROLES = ['super-admin', 'hospital-admin', 'staff', 'receptionist', 'admin'];
  if (adminOnly && !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/select-hospital" replace />;
  }

  if (requireHospital && !selectedHospital && !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/select-hospital" replace />;
  }

  return children;
};

export default ProtectedRoute;
