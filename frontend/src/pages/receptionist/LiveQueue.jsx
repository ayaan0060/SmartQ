import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2, SkipForward, XCircle, Clock, Users, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { connectSocket, getSocket } from '../../services/socket';
import { useQueueStore } from '../../store/queueStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import BackButton from '../../components/ui/BackButton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function LiveQueue() {
  const { user } = useAuthStore();
  const hospitalId = user?.hospitalId;
  const { setTokens, addToken, updateToken, removeToken, getWaiting, getInProgress } = useQueueStore();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [filter, setFilter] = useState('all');

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
  const current = getInProgress();

  const filtered = filter === 'all' ? waiting : waiting.filter(t => t.serviceId?._id === filter);

  const updateStatus = async (id, status) => {
    try { await api.patch(`/queue/${id}`, { status }); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to update'); }
  };

  const callNext = async () => {
    const next = filtered[0];
    if (!next) return;
    await updateStatus(next._id, 'in-progress');
  };

  return (
    <motion.div className="space-y-6" {...fadeUp}>
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Live Queue</h1>
        {filtered.length > 0 && (
           <button onClick={callNext} className="flex items-center gap-2 bg-(--smartq-red) text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all active:scale-95">
            <Play size={14} fill="currentColor" /> Call Next Patient
          </button>
        )}
      </div>

      {/* Now serving */}
      {current && (
        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                <span className="text-lg font-bold text-green-700 dark:text-green-300">{current.tokenNumber}</span>
              </div>
              <div>
                 <p className="text-sm font-semibold text-(--foreground)">{current.patientId?.name || current.userId?.name || 'Guest'}</p>
                <p className="text-xs text-(--muted)">{current.serviceId?.name || 'General'} · Now Serving</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateStatus(current._id, 'completed')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/25 transition-all">
                <CheckCircle2 size={14} /> Complete
              </button>
                 <button onClick={() => updateStatus(current._id, 'skipped')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-(--border) text-(--muted) hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                <SkipForward size={14} /> Skip
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Department filters */}
      <div className="flex gap-2 flex-wrap">
         <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === 'all' ? 'bg-(--smartq-red) text-white' : 'border border-(--border) text-(--muted) hover:bg-gray-50 dark:hover:bg-white/5'}`}>
          All Departments
        </button>
        {services.map(s => (
           <button key={s._id} onClick={() => setFilter(s._id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === s._id ? 'bg-(--smartq-red) text-white' : 'border border-(--border) text-(--muted) hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            {s.name}
          </button>
        ))}
      </div>

      {/* Queue table */}
       <Card className="p-0! overflow-hidden">
        {loading ? <SkeletonTable rows={6} /> : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No patients waiting" description="The queue is empty for this department." />
        ) : (
          <table className="w-full">
            <thead className="table-header">
               <tr>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">#</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Token</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Patient</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Department</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Priority</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Wait</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((token, i) => (
                <tr key={token._id} className={`table-row hover:bg-gray-50/50 dark:hover:bg-white/2 ${token.priority === 'emergency' ? 'bg-red-50/30 dark:bg-red-500/5' : ''}`}>
                  <td className="py-3.5 px-4 text-sm border-b border-(--border) text-(--muted)">{i + 1}</td>
                  <td className="py-3.5 px-4 text-sm border-b border-(--border) font-semibold text-(--foreground)">{token.tokenNumber}</td>
                  <td className="py-3.5 px-4 text-sm border-b border-(--border) text-(--foreground)">{token.patientId?.name || token.userId?.name || 'Guest'}</td>
                  <td className="py-3.5 px-4 text-sm border-b border-(--border) text-(--muted)">{token.serviceId?.name || 'General'}</td>
                  <td className="py-3.5 px-4 border-b border-(--border)">
                    <Badge variant={token.priority === 'emergency' ? 'emergency' : token.priority === 'high' ? 'waiting' : 'active'} dot={token.priority === 'emergency'}>
                      {(token.priority || 'normal').toUpperCase()}
                    </Badge>
                  </td>
                     <td className="py-3.5 px-4 text-sm border-b border-(--border) text-(--muted)">
                    <span className="flex items-center gap-1"><Clock size={12} /> {token.estimatedTime || 15}m</span>
                  </td>
                   <td className="py-3.5 px-4 border-b border-(--border) text-right">
                    <div className="flex items-center justify-end gap-1.5">
                       <button onClick={() => updateStatus(token._id, 'in-progress')}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-(--smartq-red) text-white hover:bg-(--smartq-red-hover) transition-all">
                        Call
                      </button>
                       <button onClick={() => updateStatus(token._id, 'cancelled')}
                        className="p-1.5 rounded text-(--muted) hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                        <XCircle size={14} />
                      </button>
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
