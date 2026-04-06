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

export default function DoctorQueue() {
  const { user } = useAuthStore();
  const hospitalId = user?.hospitalId;
  const { setTokens, addToken, updateToken, removeToken, getWaiting, getInProgress } = useQueueStore();
  const [loading, setLoading] = useState(true);

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

  const updateStatus = async (id, status) => {
    try { await api.patch(`/queue/${id}`, { status }); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to update'); }
  };

  const callNext = async () => {
    if (waiting.length === 0) return;
    await updateStatus(waiting[0]._id, 'in-progress');
  };

  return (
    <motion.div className="space-y-6" {...fadeUp}>
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">My Queue</h1>
        {waiting.length > 0 && (
          <button onClick={callNext} className="flex items-center gap-2 bg-(--smartq-red) text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all active:scale-95">
            <Play size={14} fill="currentColor" /> Call Next
          </button>
        )}
      </div>

      {/* Now Serving */}
      {current && (
        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                <span className="text-xl font-bold text-green-700 dark:text-green-300">{current.tokenNumber}</span>
              </div>
               <div>
                <p className="text-base font-semibold text-(--foreground)">{current.patientId?.name || current.userId?.name || 'Patient'}</p>
                <p className="text-sm text-(--muted)">{current.serviceId?.name || 'General'} · Now Serving</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateStatus(current._id, 'completed')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-all active:scale-95">
                <CheckCircle2 size={16} /> Done
              </button>
               <button onClick={() => updateStatus(current._id, 'skipped')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-(--border) text-(--muted) hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                <SkipForward size={16} /> Skip
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Queue Table */}
       <Card className="p-0! overflow-hidden">
        {loading ? <SkeletonTable rows={6} /> : waiting.length === 0 ? (
          <EmptyState icon={Users} title="Queue is empty" description="No patients are waiting to be seen." />
        ) : (
          <table className="w-full">
             <thead>
              <tr className="border-b border-(--border) bg-gray-50/50 dark:bg-white/2">
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">#</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Token</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Patient</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Priority</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-left">Est. Wait</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-(--muted) py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {waiting.map((token, i) => (
                <tr key={token._id} className={`hover:bg-gray-50/50 dark:hover:bg-white/2 ${token.priority === 'emergency' ? 'bg-red-50/30 dark:bg-red-500/5' : ''}`}>
                   <td className="py-3.5 px-4 text-sm border-b border-(--border) text-(--muted)">{i + 1}</td>
                  <td className="py-3.5 px-4 text-sm border-b border-(--border) font-semibold text-(--foreground)">{token.tokenNumber}</td>
                  <td className="py-3.5 px-4 text-sm border-b border-(--border) text-(--foreground)">
                    <div>
                      <p className="font-medium">{token.patientId?.name || token.userId?.name || 'Guest'}</p>
                      <p className="text-xs text-(--muted)">{token.serviceId?.name || 'General'}</p>
                    </div>
                  </td>
                   <td className="py-3.5 px-4 border-b border-(--border)">
                    <Badge variant={token.priority === 'emergency' ? 'emergency' : token.priority === 'high' ? 'waiting' : 'active'} dot={token.priority === 'emergency'}>
                      {(token.priority || 'normal').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-sm border-b border-(--border) text-(--muted)">
                    <span className="flex items-center gap-1"><Clock size={12} /> ~{(i + 1) * 12}m</span>
                  </td>
                  <td className="py-3.5 px-4 border-b border-(--border) text-right">
                    <button onClick={() => updateStatus(token._id, 'in-progress')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-(--smartq-red) text-white hover:bg-(--smartq-red-hover) transition-all active:scale-95">
                      Call In
                    </button>
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
