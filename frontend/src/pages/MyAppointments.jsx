import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, User, Plus, X, ArrowLeft, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import PageLayout from '../layouts/PageLayout';

const statusConfig = {
  booked:     { label: 'Booked',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  confirmed:  { label: 'Confirmed',  color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  completed:  { label: 'Completed',  color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  cancelled:  { label: 'Cancelled',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function MyAppointments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => api.get('/appointments/my').then(r => r.data.data.appointments),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.delete(`/appointments/${id}`),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries(['my-appointments']);
      setCancelling(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
      setCancelling(null);
    },
  });

  const upcoming = data?.filter(a => a.status !== 'completed' && a.status !== 'cancelled') || [];
  const past     = data?.filter(a => a.status === 'completed' || a.status === 'cancelled') || [];

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="rounded-xl p-2"
              style={{ background: '#1E293B', color: '#94A3B8' }}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">My Appointments</h1>
              <p className="text-xs" style={{ color: '#6B7280' }}>{upcoming.length} upcoming</p>
            </div>
          </div>
          <button onClick={() => navigate('/book-appointment')}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)' }}>
            <Plus size={15} /> Book New
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }} />
          </div>
        ) : data?.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl mx-auto" style={{ background: '#1E293B' }}>
              <Calendar size={28} style={{ color: '#374151' }} />
            </div>
            <p className="font-semibold text-white">No appointments yet</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>Book your first appointment with a doctor</p>
            <button onClick={() => navigate('/book-appointment')}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white mx-auto"
              style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)' }}>
              <Plus size={15} /> Book Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Upcoming</p>
                {upcoming.map(appt => (
                  <AppointmentCard key={appt._id} appt={appt}
                    onCancel={() => setCancelling(appt._id)}
                    cancelling={cancelling === appt._id} />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>Past</p>
                {past.map(appt => (
                  <AppointmentCard key={appt._id} appt={appt} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cancel confirmation */}
        {cancelling && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
              <h3 className="text-base font-bold text-white">Cancel Appointment?</h3>
              <p className="text-sm" style={{ color: '#6B7280' }}>This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setCancelling(null)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                  style={{ background: '#1E293B', color: '#94A3B8' }}>Keep</button>
                <button onClick={() => cancelMutation.mutate(cancelling)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                  style={{ background: '#EF4444' }}>Cancel Appointment</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

function AppointmentCard({ appt, onCancel, cancelling }) {
  const cfg = statusConfig[appt.status] || statusConfig.booked;
  const canCancel = ['booked', 'confirmed'].includes(appt.status);

  return (
    <div className="rounded-2xl p-4" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black text-white"
            style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}>
            {appt.doctorId?.name?.charAt(0) || 'D'}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{appt.doctorId?.name}</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>{appt.doctorId?.specialization}</p>
          </div>
        </div>
        <span className="rounded-full px-2.5 py-1 text-xs font-bold shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          { icon: Calendar,    value: new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) },
          { icon: Clock,       value: appt.slot },
          { icon: Stethoscope, value: appt.serviceId?.name },
          { icon: User,        value: appt.hospitalId?.name },
        ].map(({ icon: Icon, value }, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: '#94A3B8' }}>
            <Icon size={11} style={{ color: '#475569', flexShrink: 0 }} />{value}
          </div>
        ))}
      </div>

      {canCancel && (
        <button onClick={onCancel} disabled={cancelling}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-all"
          style={{ color: '#EF4444' }}>
          <X size={12} /> Cancel Appointment
        </button>
      )}
    </div>
  );
}
