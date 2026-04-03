import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Providers & Global CSS
import { QueryProvider } from './app/QueryProvider';
import './index.css';

// Core Components
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Lazy-loaded Public Pages
const Home             = lazy(() => import('./pages/Home'));
const Login            = lazy(() => import('./pages/Login'));
const Register         = lazy(() => import('./pages/Register'));
const HospitalRegister = lazy(() => import('./pages/HospitalRegister'));
const ForHospitals     = lazy(() => import('./pages/ForHospitals'));
const HospitalSelection = lazy(() => import('./pages/HospitalSelection'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const TokenStatus      = lazy(() => import('./pages/TokenStatus'));
const TokenHistory     = lazy(() => import('./pages/TokenHistory'));
const PaymentHistory   = lazy(() => import('./pages/PaymentHistory'));
const EmergencyTracking = lazy(() => import('./pages/EmergencyTrackingPage'));
const AmbulancePage     = lazy(() => import('./pages/patient/AmbulancePage'));
const NotFound         = lazy(() => import('./pages/NotFound'));

// Lazy-loaded Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const HospitalsPage      = lazy(() => import('./pages/admin/HospitalsPage'));
const DepartmentsPage    = lazy(() => import('./pages/admin/DepartmentsPage'));
const StaffPage          = lazy(() => import('./pages/admin/StaffPage'));
const PatientsPage       = lazy(() => import('./pages/admin/PatientsPage'));
const QueuePage          = lazy(() => import('./pages/admin/QueuePage'));
const AnalyticsPage      = lazy(() => import('./pages/admin/AnalyticsPage'));
const SettingsPage       = lazy(() => import('./pages/admin/SettingsPage'));
const HospitalDetailPage = lazy(() => import('./pages/admin/HospitalDetailPage'));
const AmbulancesPage     = lazy(() => import('./pages/admin/AmbulancesPage'));
const ReceptionistPage   = lazy(() => import('./pages/ReceptionistPage'));

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center" style={{ background: '#0B0F19' }}>
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: '#6B7280' }}>Loading SmartQ...</p>
    </div>
  </div>
);

function AppContent() {
  const location = useLocation();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes location={location}>
        {/* ── Public Routes ──────────────────── */}
        {/* Bug fix: / redirects to /home for guests; /home is the landing page */}
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-hospital" element={<HospitalRegister />} />
        <Route path="/for-hospitals" element={<ForHospitals />} />
        <Route path="/select-hospital" element={<HospitalSelection />} />
        <Route path="/status/:tokenId" element={<TokenStatus />} />
        <Route path="/history"  element={<ProtectedRoute><TokenHistory /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
        <Route path="/emergency/:requestId" element={<ProtectedRoute><EmergencyTracking /></ProtectedRoute>} />
        <Route path="/ambulance" element={<ProtectedRoute><AmbulancePage /></ProtectedRoute>} />
        <Route path="/reception" element={<ProtectedRoute><ReceptionistPage /></ProtectedRoute>} />

        {/* ── Admin Panel Routes ─────────────── */}
        <Route
          path="/admin"
          element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="hospitals"     element={<HospitalsPage />} />
          <Route path="hospitals/:id" element={<HospitalDetailPage />} />
          <Route path="departments"   element={<DepartmentsPage />} />
          <Route path="staff"         element={<StaffPage />} />
          <Route
            path="doctors"
            element={<Navigate to="/admin/staff?role=doctor" replace />}
          />
          <Route path="patients"      element={<PatientsPage />} />
          <Route path="queue"         element={<QueuePage />} />
          <Route path="analytics"     element={<AnalyticsPage />} />
          <Route path="settings"      element={<SettingsPage />} />
          <Route path="ambulances"    element={<AmbulancesPage />} />
        </Route>

        {/* ── Patient Dashboard ──────────────── */}
        <Route
          path="/"
          element={
            <ProtectedRoute requireHospital>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    document.title = 'SmartQ — Enterprise Healthcare Platform';
  }, []);

  return (
    <QueryProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              padding: '12px 16px',
              background: '#1F2937',
              color: '#F9FAFB',
              border: '1px solid #374151',
              fontSize: '13px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#1F2937' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#1F2937' } },
          }}
        />
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </Router>
    </QueryProvider>
  );
}

export default App;
