import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import BackButton from '../../components/ui/BackButton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.get('/appointments');
        setAppointments(Array.isArray(r.data.data) ? r.data.data : r.data.data?.appointments || []);
      } catch { toast.error('Failed to load appointments'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const today = new Date().toDateString();
  const todaysAppts = appointments.filter(a => new Date(a.date || a.appointmentDate).toDateString() === today);

  const filtered = filter === 'all' ? todaysAppts
    : filter === 'upcoming' ? todaysAppts.filter(a => a.status === 'scheduled' || a.status === 'confirmed')
    : filter === 'checked-in' ? todaysAppts.filter(a => a.status === 'checked-in')
    : todaysAppts.filter(a => a.status === 'missed' || a.status === 'no-show');

  const updateAppointment = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}`, { status });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      toast.success(`Appointment ${status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'checked-in', label: 'Checked In' },
    { key: 'missed', label: 'Missed' },
  ];

  return (
    <motion.div className="space-y-6" {...fadeUp}>
      <BackButton />
      <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Today's Appointments</h1>
      <p className="text-sm text-(--muted)">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>

      {/* Filters */}
       <div className="flex gap-2">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f.key ? 'bg-(--smartq-red) text-white' : 'border border-(--border) text-(--muted) hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Appointments */}
       <Card className="p-0! overflow-hidden">
        {loading ? <SkeletonTable rows={5} /> : filtered.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments" description="No appointments match the selected filter." />
        ) : (
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Time</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Patient</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Doctor</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Department</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Status</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(appt => {
                const statusVariant = appt.status === 'checked-in' ? 'active' : appt.status === 'missed' || appt.status === 'no-show' ? 'emergency' : appt.status === 'completed' ? 'completed' : 'waiting';
                return (
                  <tr key={appt._id} className="hover:bg-gray-50/50 dark:hover:bg-white/2">
                     <td className="py-3.5 px-4 text-sm border-b border-(--border)">
                      <span className="flex items-center gap-1.5 text-(--foreground) font-medium">
                        <Clock size={14} className="text-(--muted)" />
                        {appt.timeSlot || appt.time || '--'}
                      </span>
                    </td>
                     <td className="py-3.5 px-4 text-sm border-b border-(--border) font-medium text-(--foreground)">
                      {appt.patientId?.name || appt.patientName || 'Unknown'}
                    </td>
                    <td className="py-3.5 px-4 text-sm border-b border-(--border) text-(--muted)">
                      Dr. {appt.doctorId?.name || appt.doctorName || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-sm border-b border-(--border) text-(--muted)">
                      {appt.serviceId?.name || appt.department || 'General'}
                    </td>
                    <td className="py-3.5 px-4 border-b border-(--border)">
                      <Badge variant={statusVariant}>{(appt.status || 'scheduled').replace('-', ' ').toUpperCase()}</Badge>
                    </td>
                    <td className="py-3.5 px-4 border-b border-(--border) text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                          <button onClick={() => updateAppointment(appt._id, 'checked-in')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300 hover:bg-green-100 transition-all">
                            <CheckCircle2 size={12} /> Check In
                          </button>
                        )}
                         {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                          <button onClick={() => updateAppointment(appt._id, 'cancelled')}
                            className="p-1.5 rounded text-(--muted) hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </motion.div>
  );
}
