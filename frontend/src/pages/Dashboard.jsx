import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MapPin, Clock, Building2, CalendarPlus, ArrowRight,
  Heart, CheckCircle2, AlertCircle, Navigation, TrendingUp,
  Calendar,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

import { useAuthStore } from '../features/auth/useAuthStore';
import { useHospitalStore } from '../features/hospital/useHospitalStore';
import { HospitalService } from '../features/hospital/HospitalService';
import api from '../lib/api';
import PageLayout from '../layouts/PageLayout';
import ServiceCard from '../components/ServiceCard';
import Skeleton from '../components/Skeleton';
import PaymentModal from '../components/PaymentModal';
import EmergencyButton from '../components/EmergencyButton';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedHospital } = useHospitalStore();
  const [paymentModal, setPaymentModal] = useState({ open: false, data: null });
  const [queueStats, setQueueStats] = useState({ avgWait: null, waiting: 0, safety: null });
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    if (user && ['super-admin', 'hospital-admin', 'staff'].includes(user.role)) navigate('/admin');
  }, [user, navigate]);

  // Fetch live queue stats
  useEffect(() => {
    if (!selectedHospital?._id) return;
    api.get(`/queue/stats/${selectedHospital._id}`)
      .then(r => {
        const { avgWait, waitingCount, safety } = r.data.data;
        setQueueStats({ avgWait, waiting: waitingCount, safety });
      }).catch(() => {});
  }, [selectedHospital?._id]);

  // Fetch patient's active queue token
  const { data: activeToken } = useQuery({
    queryKey: ['my-queue-status'],
    queryFn: () => api.get('/queue/my-status').then(r => r.data.data),
    enabled: !!user?._id,
    refetchInterval: 30000,
  });

  // Fetch upcoming appointments
  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ['patient-upcoming-appointments'],
    queryFn: () => api.get('/appointments/patient/upcoming').then(r => r.data.data.appointments),
    enabled: !!user?._id,
  });

  // Fetch hospital services
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', selectedHospital?._id],
    queryFn: async () => {
      const data = await HospitalService.getHospitalServices(selectedHospital?._id);
      return Array.isArray(data) ? data : (data ?? []);
    },
    enabled: !!selectedHospital?._id,
  });

  const handleBookToken = async (service) => {
    try {
      const res = await api.post('/tokens/book', { serviceId: service._id, hospitalId: selectedHospital?._id });
      const data = res.data.data;
      if (data.paymentRequired) {
        setPaymentModal({ open: true, data });
      } else {
        toast.success('Token booked successfully!');
        navigate(`/status/${data.token._id}`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to book token.');
    }
  };

  if (!selectedHospital) return null;

  const hospitalCoords = selectedHospital?.coordinates
    ? [selectedHospital.coordinates.lat, selectedHospital.coordinates.lng]
    : [40.7128, -74.006];

  const hasActiveToken = activeToken?.tokenNumber != null;
  const hasAppointments = upcomingAppointments.length > 0;

  return (
    <PageLayout>
      <EmergencyButton hospitalId={selectedHospital?._id} />

      <div className="space-y-8">
        {/* Welcome Hero */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="md:col-span-8 bg-surface-container-lowest rounded-2xl p-10 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="relative z-10">
              <h3 className="text-4xl font-bold text-on-surface leading-tight tracking-tighter">
                Welcome back,<br />
                <span className="text-primary italic">{user?.name?.split(' ')[0] || 'Patient'}.</span>
              </h3>
              <p className="mt-4 text-secondary max-w-md text-lg leading-relaxed">
                {selectedHospital.name} • {queueStats.waiting} patients currently waiting.
              </p>
            </div>
            <div className="mt-12 flex gap-4 z-10">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/book-appointment')}
                className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold tracking-tight shadow-lg shadow-primary/10 transition-all"
              >
                Book Appointment
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/appointments')}
                className="px-8 py-4 bg-surface-container-high text-on-surface rounded-2xl font-bold tracking-tight hover:bg-surface-container-highest transition-all"
              >
                View Schedule
              </motion.button>
            </div>
            {/* Decorative */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-5 pointer-events-none flex items-center justify-end pr-4">
              <Heart size={200} className="text-primary" />
            </div>
          </motion.div>

          {/* Capacity card */}
          <div className="md:col-span-4 bg-primary-container text-on-primary-container rounded-2xl p-8 flex flex-col justify-center">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Current Capacity</p>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black tracking-tighter">
                    {queueStats.waiting > 0 ? `${Math.min(Math.round((queueStats.waiting / 30) * 100), 100)}%` : '—'}
                  </span>
                  <TrendingUp size={28} className="mb-2" />
                </div>
              </div>
              <div className="h-1 bg-on-primary-container/20 rounded-full overflow-hidden">
                <div className="h-full bg-on-primary-container rounded-full" style={{ width: `${Math.min((queueStats.waiting / 30) * 100, 100)}%` }} />
              </div>
              <p className="text-sm font-medium leading-tight">
                {queueStats.safety?.desc || 'Queue status nominal. System operating normally.'}
              </p>
            </div>
          </div>
        </section>

        {/* Bento Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Queue Status */}
          <div className="bg-surface-container-low rounded-2xl p-1 overflow-hidden">
            <div className="bg-surface-container-lowest rounded-[22px] p-6 h-full">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="text-xl font-bold text-on-surface tracking-tight">Queue Status</h4>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">
                    {selectedHospital.name}
                  </p>
                </div>
                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </div>
              </div>

              <div className="space-y-6">
                {[
                  {
                    value: hasActiveToken ? activeToken.tokenNumber : '—',
                    label: 'Your Token',
                    sub: hasActiveToken ? `Position: ${activeToken.position ?? 'N/A'}` : 'No active token',
                    color: hasActiveToken ? 'text-primary' : 'text-secondary',
                  },
                  {
                    value: queueStats.waiting || 0,
                    label: 'Patients Waiting',
                    sub: queueStats.avgWait ? `Est. wait ${queueStats.avgWait} mins` : 'Wait time unavailable',
                    color: 'text-on-surface',
                  },
                ].map(({ value, label, sub, color }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                      <span className={`text-2xl font-black ${color}`}>{typeof value === 'number' ? String(value).padStart(2, '0') : value}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{label}</p>
                      <p className="text-xs text-secondary">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini chart */}
              <div className="mt-8 pt-8 border-t border-outline-variant/15">
                <div className="flex justify-between items-center text-xs font-bold text-secondary mb-4 uppercase tracking-widest">
                  <span>Wait Time Trend</span>
                  <span className="text-primary">-4m</span>
                </div>
                <div className="flex items-end gap-1.5 h-16">
                  {[60, 40, 80, 50, 30, 45, 70].map((h, i) => (
                    <div key={i} className={`flex-1 rounded-t-lg ${i === 3 ? 'bg-primary-container' : 'bg-surface-container'}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Appointments */}
          <div className="bg-surface-container-low rounded-2xl p-1 overflow-hidden">
            <div className="bg-surface-container-lowest rounded-[22px] p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-xl font-bold text-on-surface tracking-tight">Appointments</h4>
                <Link to="/appointments" className="text-xs font-bold text-primary hover:text-primary-container transition-colors">View All</Link>
              </div>
              <div className="space-y-4 flex-1">
                {hasAppointments ? (
                  upcomingAppointments.map(appt => (
                    <motion.div
                      key={appt._id}
                      whileHover={{ y: -2 }}
                      className="group relative bg-surface p-4 rounded-2xl hover:bg-surface-container transition-colors"
                    >
                      <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full" />
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {appt.date} · {appt.slot}
                        </p>
                        <span className="text-xs font-bold text-on-surface px-2 py-0.5 bg-surface-container rounded-full capitalize">{appt.status}</span>
                      </div>
                      <h5 className="font-bold text-on-surface">{appt.doctorId?.name || 'Doctor'}</h5>
                      <p className="text-xs text-secondary mt-0.5">{appt.serviceId?.name || appt.reason || 'Appointment'}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar size={32} className="text-secondary opacity-40 mb-3" />
                    <p className="text-sm font-semibold text-secondary">No upcoming appointments</p>
                    <p className="text-xs text-secondary opacity-60 mt-1">Book one to get started</p>
                  </div>
                )}
                <Link to="/book-appointment" className="block text-center text-xs font-bold text-primary hover:text-primary-container transition-colors py-2">
                  + Book New Appointment
                </Link>
              </div>
            </div>
          </div>

          {/* Transit / Map */}
          <div className="bg-surface-container-low rounded-2xl p-1 overflow-hidden">
            <div className="bg-surface-container-lowest rounded-[22px] overflow-hidden h-full flex flex-col">
              {/* Map */}
              <div className="relative h-40 w-full overflow-hidden">
                <MapContainer
                  center={hospitalCoords}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={hospitalCoords}>
                    <Popup>{selectedHospital.name}</Popup>
                  </Marker>
                </MapContainer>
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-6 pointer-events-none">
                  <h4 className="text-white font-black text-lg tracking-tight">Transit Status</h4>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Nearby: {selectedHospital.name}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospitalCoords[0]},${hospitalCoords[1]}`, '_blank')}
                  className="absolute bottom-4 right-4 bg-primary text-on-primary px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 pointer-events-auto"
                >
                  <Navigation size={10} /> Navigate
                </motion.button>
              </div>

              {/* Navigate button only — no mock transit data */}
              <div className="p-6">
                <p className="text-xs text-secondary">Click Navigate to get directions to this hospital.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Queue alert  — only show if user has active token */}
        {!alertDismissed && hasActiveToken && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary-container/10 border border-primary-container/30 rounded-2xl px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-primary shrink-0" />
              <p className="text-sm font-medium text-on-surface">
                Your estimated wait time is <strong>{queueStats.avgWait ?? '—'} minutes</strong>. You'll be notified when it's your turn.
              </p>
            </div>
            <button onClick={() => setAlertDismissed(true)} className="text-secondary hover:text-on-surface text-xs font-bold ml-4 shrink-0">Dismiss</button>
          </motion.div>
        )}

        {/* Services */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : services.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-black tracking-tight text-on-surface">Available Services</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map(service => (
                <ServiceCard key={service._id} service={service} onBook={handleBookToken} />
              ))}
            </div>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={paymentModal.open}
        paymentData={paymentModal.data}
        onClose={() => setPaymentModal({ open: false, data: null })}
      />
    </PageLayout>
  );
}
