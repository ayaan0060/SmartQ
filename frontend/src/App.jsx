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

// ── Retry wrapper for lazy imports (fixes stale chunk errors after deploy) ──
const lazyWithRetry = (importFn) =>
  lazy(() =>
    importFn().catch(() => {
      // If a chunk fails to load (stale cache after deploy), reload once
      const hasReloaded = sessionStorage.getItem('smartq-chunk-retry');
      if (!hasReloaded) {
        sessionStorage.setItem('smartq-chunk-retry', '1');
        window.location.reload();
        return new Promise(() => {}); // never resolves — page is reloading
      }
      sessionStorage.removeItem('smartq-chunk-retry');
      return importFn(); // let it throw naturally on second failure
    })
  );

// Lazy-loaded Public Pages
const Home             = lazyWithRetry(() => import('./pages/Home'));
const Login            = lazyWithRetry(() => import('./pages/Login'));
const Register         = lazyWithRetry(() => import('./pages/Register'));
const HospitalRegister = lazyWithRetry(() => import('./pages/HospitalRegister'));
const ForHospitals     = lazyWithRetry(() => import('./pages/ForHospitals'));
const HospitalSelection = lazyWithRetry(() => import('./pages/HospitalSelection'));
const Dashboard        = lazyWithRetry(() => import('./pages/Dashboard'));
const TokenStatus      = lazyWithRetry(() => import('./pages/TokenStatus'));
const TokenHistory     = lazyWithRetry(() => import('./pages/TokenHistory'));
const PaymentHistory   = lazyWithRetry(() => import('./pages/PaymentHistory'));
const EmergencyTracking = lazyWithRetry(() => import('./pages/EmergencyTrackingPage'));
const AmbulancePage     = lazyWithRetry(() => import('./pages/patient/AmbulancePage'));
const NotFound         = lazyWithRetry(() => import('./pages/NotFound'));

// Lazy-loaded Admin Pages
const AdminDashboardPage = lazyWithRetry(() => import('./pages/admin/AdminDashboardPage'));
const HospitalsPage      = lazyWithRetry(() => import('./pages/admin/HospitalsPage'));
const DepartmentsPage    = lazyWithRetry(() => import('./pages/admin/DepartmentsPage'));
const StaffPage          = lazyWithRetry(() => import('./pages/admin/StaffPage'));
const PatientsPage       = lazyWithRetry(() => import('./pages/admin/PatientsPage'));
const QueuePage          = lazyWithRetry(() => import('./pages/admin/QueuePage'));
const AnalyticsPage      = lazyWithRetry(() => import('./pages/admin/AnalyticsPage'));
const SettingsPage       = lazyWithRetry(() => import('./pages/admin/SettingsPage'));
const HospitalDetailPage = lazyWithRetry(() => import('./pages/admin/HospitalDetailPage'));
const AmbulancesPage     = lazyWithRetry(() => import('./pages/admin/AmbulancesPage'));
const ReceptionistPage   = lazyWithRetry(() => import('./pages/ReceptionistPage'));
const DisplayBoard       = lazyWithRetry(() => import('./pages/DisplayBoard'));
const DoctorPortal       = lazyWithRetry(() => import('./pages/DoctorPortal'));
const AppointmentBooking = lazyWithRetry(() => import('./pages/AppointmentBooking'));
const MyAppointments     = lazyWithRetry(() => import('./pages/MyAppointments'));
const PatientQueue       = lazyWithRetry(() => import('./pages/PatientQueue'));

// ── Role-Specific Layouts ───────────────────
const DoctorLayout = lazyWithRetry(() => import('./layouts/DoctorLayout'));
const StaffLayout  = lazyWithRetry(() => import('./layouts/StaffLayout'));

// ── Receptionist Pages ──────────────────────
const ReceptionistDashboard  = lazyWithRetry(() => import('./pages/receptionist/Dashboard'));
const ReceptionistIssueToken = lazyWithRetry(() => import('./pages/receptionist/IssueToken'));
const ReceptionistLiveQueue  = lazyWithRetry(() => import('./pages/receptionist/LiveQueue'));
const ReceptionistAppts      = lazyWithRetry(() => import('./pages/receptionist/Appointments'));
const ReceptionistLookup     = lazyWithRetry(() => import('./pages/receptionist/PatientLookup'));

// ── Nurse Pages ─────────────────────────────
const NurseDashboard     = lazyWithRetry(() => import('./pages/nurse/Dashboard'));
const NursePatients      = lazyWithRetry(() => import('./pages/nurse/Patients'));
const NurseVitals        = lazyWithRetry(() => import('./pages/nurse/Vitals'));
const NurseAnnouncements = lazyWithRetry(() => import('./pages/nurse/Announcements'));

// ── Doctor Pages ────────────────────────────
const DoctorDashboard    = lazyWithRetry(() => import('./pages/doctor/Dashboard'));
const DoctorQueue        = lazyWithRetry(() => import('./pages/doctor/Queue'));
const DoctorAppointments = lazyWithRetry(() => import('./pages/doctor/Appointments'));
const PatientRecords     = lazyWithRetry(() => import('./pages/doctor/Records'));
const DoctorSchedule     = lazyWithRetry(() => import('./pages/doctor/Schedule'));

// ── Staff Pages (ward/support staff) ────────
const StaffDashboard      = lazyWithRetry(() => import('./pages/staff/StaffDashboard'));
const StaffTasks          = lazyWithRetry(() => import('./pages/staff/StaffTasks'));
const StaffAnnouncements  = lazyWithRetry(() => import('./pages/staff/StaffAnnouncements'));
const StaffSchedule       = lazyWithRetry(() => import('./pages/staff/StaffSchedule'));

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent border-primary" />
      <p className="text-sm text-secondary">Loading SmartQ...</p>
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
        <Route path="/" element={<Home />} />
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
        <Route path="/display/:hospitalId" element={<DisplayBoard />} />
        <Route path="/book-appointment" element={<ProtectedRoute><AppointmentBooking /></ProtectedRoute>} />

        {/* ── Doctor Workspace ────────────────── */}
        <Route path="/doctor" element={<ProtectedRoute><DoctorLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<DoctorDashboard />} />
          <Route path="queue"        element={<DoctorQueue />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="records"      element={<PatientRecords />} />
          <Route path="schedule"     element={<DoctorSchedule />} />
        </Route>

        {/* ── Receptionist Workspace ──────────────── */}
        <Route path="/receptionist" element={<ProtectedRoute allowedRoles={['receptionist']}><StaffLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<ReceptionistDashboard />} />
          <Route path="issue-token"  element={<ReceptionistIssueToken />} />
          <Route path="queue"        element={<ReceptionistLiveQueue />} />
          <Route path="appointments" element={<ReceptionistAppts />} />
          <Route path="patients"     element={<ReceptionistLookup />} />
        </Route>

        {/* ── Nurse Workspace ──────────────────────── */}
        <Route path="/nurse" element={<ProtectedRoute allowedRoles={['nurse']}><StaffLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<NurseDashboard />} />
          <Route path="patients"     element={<NursePatients />} />
          <Route path="vitals"       element={<NurseVitals />} />
          <Route path="announcements" element={<NurseAnnouncements />} />
        </Route>

        {/* ── Staff Workspace (ward/support staff only) ── */}
        <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<StaffDashboard />} />
          <Route path="tasks"        element={<StaffTasks />} />
          <Route path="announcements" element={<StaffAnnouncements />} />
          <Route path="schedule"     element={<StaffSchedule />} />
        </Route>

        <Route path="/queue" element={<ProtectedRoute requireHospital><PatientQueue /></ProtectedRoute>} />

        {/* ── Patient-prefixed Routes ────────────── */}
        <Route path="/patient/dashboard"     element={<ProtectedRoute requireHospital><Dashboard /></ProtectedRoute>} />
        <Route path="/patient/appointments"  element={<ProtectedRoute allowedRoles={['patient']}><MyAppointments /></ProtectedRoute>} />
        <Route path="/patient/history"       element={<ProtectedRoute><TokenHistory /></ProtectedRoute>} />
        <Route path="/patient/queue"         element={<ProtectedRoute requireHospital><PatientQueue /></ProtectedRoute>} />

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
          path="/dashboard"
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
              borderRadius: '1rem',
              padding: '12px 16px',
              background: '#ffffff',
              color: '#1a1c1c',
              border: '1px solid #e4bdbb',
              fontSize: '13px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#15803d', secondary: '#ffffff' } },
            error:   { iconTheme: { primary: '#ba1a1a', secondary: '#ffffff' } },
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
