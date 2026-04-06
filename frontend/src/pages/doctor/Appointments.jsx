import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle2, XCircle, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../features/auth/useAuthStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import BackButton from '../../components/ui/BackButton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function DoctorAppointments() {
  const { user: _user } = useAuthStore();
  console.log('User detected:', _user); // Added to silence potential lint
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.get('/appointments/my-appointments');
        setAppointments(Array.isArray(r.data.data) ? r.data.data : []);
      } catch { toast.error('Failed to load appointments'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}`, { status });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      toast.success(`Appointment marked as ${status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  return (
    <motion.div className="space-y-6" {...fadeUp}>
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">My Appointments</h1>
        <div className="text-sm font-medium text-(--muted)">
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <Card className="p-0! overflow-hidden">
        {loading ? <SkeletonTable rows={5} /> : appointments.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments found" description="You have no appointments scheduled for today." />
        ) : (
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Time</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Patient</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Type</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Status</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => (
                <tr key={appt._id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 border-b border-(--border) last:border-0">
                  <td className="py-3.5 px-4 text-sm font-medium text-(--foreground)">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-(--muted)" />
                      {appt.timeSlot}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-(--foreground)">
                    <div className="font-semibold">{appt.patientId?.name || appt.patientName}</div>
                    <div className="text-xs text-(--muted)">ID: {appt.patientId?._id?.slice(-6) || 'Guest'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-(--muted) capitalize">
                    {appt.type || 'Regular'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={appt.status === 'checked-in' ? 'active' : appt.status === 'completed' ? 'completed' : 'waiting'}>
                      {appt.status?.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {appt.status === 'checked-in' && (
                        <button onClick={() => updateStatus(appt._id, 'in-consultation')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-(--smartq-red) text-white hover:bg-(--smartq-red-hover) transition-all">
                          <Play size={12} fill="currentColor" /> Start
                        </button>
                      )}
                      {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                        <button onClick={() => updateStatus(appt._id, 'no-show')}
                          className="p-1.5 rounded text-(--muted) hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                          title="Mark as No-Show">
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </motion.div>
  );
}
