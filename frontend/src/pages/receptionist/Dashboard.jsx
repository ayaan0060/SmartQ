import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Users, CheckCircle2, UserX, Clock, Plus, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { connectSocket, getSocket } from '../../services/socket';
import { useQueueStore } from '../../store/queueStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

export default function ReceptionistDashboard() {
  const { user } = useAuthStore();
  const hospitalId = user?.hospitalId;
  const { tokens, setTokens, addToken, updateToken, removeToken, getWaiting, completedCount } = useQueueStore();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ patientName: '', serviceId: '', priority: 'normal', notes: '' });
  const [issuing, setIssuing] = useState(false);

  const loadQueue = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const r = await api.get('/queue');
      setTokens(r.data.data.tokens || []);
    } catch { toast.error('Failed to load queue'); }
    finally { setLoading(false); }
  }, [hospitalId, setTokens]);

  useEffect(() => {
    loadQueue();
    if (hospitalId) {
      api.get(`/services/${hospitalId}`).then(r => setServices(Array.isArray(r.data.data) ? r.data.data : [])).catch(() => {});
    }
    const socket = connectSocket(hospitalId);
    socket.on('queue:add', addToken);
    socket.on('queue:update', updateToken);
    socket.on('queue:priority-change', updateToken);
    socket.on('queue:remove', removeToken);
    return () => {
      const s = getSocket();
      if (s) { s.off('queue:add'); s.off('queue:update'); s.off('queue:priority-change'); s.off('queue:remove'); }
    };
  }, [hospitalId, loadQueue, addToken, updateToken, removeToken]);

  const waiting = getWaiting();

  const updateStatus = async (id, status) => {
    try { await api.patch(`/queue/${id}`, { status }); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to update'); }
  };

  const callNext = async () => {
    const next = waiting[0];
    if (!next) return;
    await updateStatus(next._id, 'in-progress');
  };

  const handleIssueToken = async (e) => {
    e.preventDefault();
    if (!form.serviceId) { toast.error('Select a department'); return; }
    if (!form.patientName.trim()) { toast.error('Patient name required'); return; }
    setIssuing(true);
    try {
      const r = await api.post('/queue', {
        serviceId: form.serviceId,
        priority: form.priority,
        patientName: form.patientName.trim(),
        notes: form.notes,
      });
      toast.success(`Token ${r.data.data.token?.tokenNumber || ''} issued`);
      setForm({ patientName: '', serviceId: '', priority: 'normal', notes: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to issue token');
    } finally { setIssuing(false); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    { label: "Today's Tokens", value: tokens.length, icon: Ticket, color: 'text-blue-600' },
    { label: 'Currently Waiting', value: waiting.length, icon: Users, color: 'text-amber-600' },
    { label: 'Completed Today', value: completedCount, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'No-Shows', value: tokens.filter(t => t.status === 'cancelled').length, icon: UserX, color: 'text-red-600' },
  ];

  return (
    <motion.div className="space-y-8" {...fadeUp}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">
          {greeting()}, {user?.name}
        </h1>
        <p className="text-sm text-(--muted) mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                 <div>
                  <p className="text-2xl font-bold tabular-nums text-(--foreground)">{value}</p>
                  <p className="text-xs text-(--muted)">{label}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Main: Queue + Quick Issue */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Live Queue */}
         <div className="lg:col-span-3">
          <Card className="p-0! overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-(--border)">
              <h2 className="text-lg font-semibold text-(--foreground)">Live Queue</h2>
              {waiting.length > 0 && (
                <button onClick={callNext} className="btn-primary flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-(--smartq-red) text-white font-semibold hover:bg-(--smartq-red-hover) transition-all">
                  <Play size={14} fill="currentColor" /> Call Next
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto">
               {waiting.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Users size={40} className="text-(--muted) opacity-30 mb-3" />
                  <p className="text-sm font-medium text-(--foreground)">Queue is empty</p>
                  <p className="text-xs text-(--muted)">Issue a token to get started</p>
                </div>
              ) : (
                   waiting.map((token, i) => (
                  <div key={token._id} className="flex items-center justify-between px-5 py-3 border-b border-(--border) last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-(--muted)">
                        {i + 1}
                      </div>
                      <div>
                         <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-(--foreground)">{token.tokenNumber}</p>
                          <Badge variant={token.priority === 'emergency' ? 'emergency' : token.priority === 'high' ? 'waiting' : 'active'}>
                            {(token.priority || 'normal').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-(--muted)">
                          {token.patientId?.name || token.userId?.name || 'Guest'} · {token.serviceId?.name || 'General'}
                        </p>
                      </div>
                    </div>
                     <div className="flex items-center gap-2">
                      <span className="text-xs text-(--muted) flex items-center gap-1"><Clock size={11} />{token.estimatedTime || 15}m</span>
                      <button
                        onClick={() => updateStatus(token._id, 'in-progress')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-(--smartq-red) text-white hover:bg-(--smartq-red-hover) transition-all active:scale-95"
                      >
                        Call
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Issue Token */}
         <div className="lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-(--foreground) mb-4">Quick Issue Token</h2>
            <form onSubmit={handleIssueToken} className="space-y-4">
               <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted) mb-1 block">Patient Name</label>
                <input className="input" placeholder="Enter patient name" value={form.patientName}
                  onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
              </div>
               <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted) mb-1 block">Department</label>
                <select className="input" value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
                  <option value="">Select department...</option>
                  {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
               <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted) mb-1 block">Priority</label>
                <div className="flex gap-2">
                  {['normal', 'high', 'emergency'].map(p => (
                    <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-all border ${
                        form.priority === p
                           ? p === 'emergency' ? 'bg-red-50 text-red-700 border-red-200' : p === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'
                          : 'border-(--border) text-(--muted) hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >{p}</button>
                  ))}
                </div>
              </div>
               <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted) mb-1 block">Notes (optional)</label>
                <input className="input" placeholder="Any notes..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
               <button type="submit" disabled={issuing}
                className="w-full bg-(--smartq-red) text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all active:scale-95 disabled:opacity-50">
                {issuing ? 'Issuing...' : 'Issue Token'}
              </button>
            </form>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
