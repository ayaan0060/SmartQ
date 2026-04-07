import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  CalendarPlus, ChevronRight, Stethoscope, Building2, X,
} from 'lucide-react';

import api from '../lib/api';
import PageLayout from '../layouts/PageLayout';
import Skeleton from '../components/Skeleton';

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'upcoming', label: 'Upcoming', statuses: ['booked', 'confirmed'] },
  { id: 'past',     label: 'Past',     statuses: ['completed'] },
  { id: 'cancelled',label: 'Cancelled',statuses: ['cancelled'] },
];

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    booked:    { cls: 'bg-blue-100 text-blue-700',   icon: <Clock size={11} />,       label: 'Booked' },
    confirmed: { cls: 'bg-green-100 text-green-700',  icon: <CheckCircle2 size={11} />, label: 'Confirmed' },
    completed: { cls: 'bg-gray-100 text-gray-600',   icon: <CheckCircle2 size={11} />, label: 'Completed' },
    cancelled: { cls: 'bg-red-100 text-red-600',     icon: <XCircle size={11} />,      label: 'Cancelled' },
  };
  const c = cfg[status] || cfg.booked;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
};

// ── Appointment card ──────────────────────────────────────────────────────────
function AppointmentCard({ appt, onCancel }) {
  const [confirming, setConfirming] = useState(false);
  const isCancellable = ['booked', 'confirmed'].includes(appt.status);
  const docName = appt.doctorId?.name || 'Doctor';
  const specialty = appt.doctorId?.specialization || '';
  const hospital  = appt.hospitalId?.name || '';
  const service   = appt.serviceId?.name || appt.reason || 'Consultation';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white dark:bg-white/5 border border-(--border) rounded-2xl p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-(--smartq-red)/10 flex items-center justify-center shrink-0">
            <Stethoscope size={18} className="text-(--smartq-red)" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-(--foreground) leading-tight">{docName}</h4>
            {specialty && <p className="text-xs text-(--muted) mt-0.5">{specialty}</p>}
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-(--muted)" />
          <span className="text-xs text-(--foreground) font-medium">{appt.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-(--muted)" />
          <span className="text-xs text-(--foreground) font-medium">{appt.slot}</span>
        </div>
        {hospital && (
          <div className="flex items-center gap-2 col-span-2">
            <Building2 size={13} className="text-(--muted)" />
            <span className="text-xs text-(--muted)">{hospital}</span>
          </div>
        )}
        <div className="col-span-2">
          <span className="text-xs bg-gray-100 dark:bg-white/10 text-(--muted) px-2 py-0.5 rounded-full">{service}</span>
        </div>
      </div>

      {/* Cancel */}
      {isCancellable && (
        <div className="pt-1 border-t border-(--border)">
          {confirming ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-(--muted) flex-1">Cancel this appointment?</p>
              <button
                onClick={() => { onCancel(appt._id); setConfirming(false); }}
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
              >
                Yes, cancel
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs font-bold text-(--muted) hover:text-(--foreground) transition-colors"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1 text-xs text-(--muted) hover:text-red-500 transition-colors font-medium"
            >
              <X size={12} /> Cancel Appointment
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyAppointments() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const qc = useQueryClient();

  const { data: allAppointments = [], isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => api.get('/appointments/my').then(r => r.data.data.appointments),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.patch(`/appointments/${id}/cancel`),
    onSuccess: () => {
      toast.success('Appointment cancelled.');
      qc.invalidateQueries({ queryKey: ['my-appointments'] });
      qc.invalidateQueries({ queryKey: ['patient-upcoming-appointments'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to cancel.'),
  });

  const currentTab = TABS.find(t => t.id === activeTab);
  const filtered = allAppointments.filter(a => currentTab.statuses.includes(a.status));

  // Tab counts
  const counts = TABS.reduce((acc, t) => {
    acc[t.id] = allAppointments.filter(a => t.statuses.includes(a.status)).length;
    return acc;
  }, {});

  return (
    <PageLayout title="My Appointments" subtitle="Manage all your scheduled visits">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* CTA */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-(--muted)">{allAppointments.length} total appointments</p>
          <Link
            to="/book-appointment"
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--smartq-red) text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <CalendarPlus size={15} /> Book New
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/10 text-(--foreground) shadow-sm'
                  : 'text-(--muted) hover:text-(--foreground)'
              }`}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-(--smartq-red) text-white' : 'bg-gray-200 dark:bg-white/10 text-(--muted)'
                }`}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <Calendar size={40} className="mx-auto mb-4 text-(--muted) opacity-30" />
                  <p className="text-base font-semibold text-(--muted)">No {activeTab} appointments</p>
                  {activeTab === 'upcoming' && (
                    <Link
                      to="/book-appointment"
                      className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-(--smartq-red) hover:opacity-80 transition-opacity"
                    >
                      Book one now <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              ) : (
                filtered.map(appt => (
                  <AppointmentCard
                    key={appt._id}
                    appt={appt}
                    onCancel={cancelMutation.mutate}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageLayout>
  );
}
