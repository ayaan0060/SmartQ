import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Clock, Play, SkipForward, UserCheck, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { connectSocket, getSocket } from '../../services/socket';
import { useQueueStore } from '../../store/queueStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function DoctorDashboard() {
  const { user, hospitalName } = useAuthStore();
  const hospitalId = user?.hospitalId;
  const { tokens: _tokens, setTokens, addToken, updateToken, removeToken, getWaiting, getInProgress, completedCount } = useQueueStore();
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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    { label: 'Waiting', value: waiting.length, icon: Users, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Seen Today', value: completedCount, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
    { label: 'Avg Wait', value: `${Math.round(waiting.length * 12)}m`, icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  ];

  return (
    <motion.div className="space-y-8" {...fadeUp}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">
          {greeting()}, Dr. {user?.name}
        </h1>
        <p className="text-sm text-(--muted) mt-1">{hospitalName} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          stats.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} shrink-0`}>
                  <Icon size={20} className={color} />
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

      {/* Now Serving */}
      <div>
        <h2 className="text-lg font-semibold text-(--foreground) mb-3">Now Serving</h2>
        {current ? (
          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-700 dark:text-green-300">{current.tokenNumber}</span>
                </div>
                 <div>
                  <p className="text-base font-semibold text-(--foreground)">{current.patientId?.name || current.userId?.name || 'Patient'}</p>
                  <p className="text-sm text-(--muted)">{current.serviceId?.name || 'General'}</p>
                  {current.notes && <p className="text-xs text-(--muted) mt-1 italic">"{current.notes}"</p>}
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
        ) : (
          <Card className="border-l-4 border-l-gray-200 dark:border-l-gray-700">
             <div className="flex items-center gap-4 py-2">
              <UserCheck size={24} className="text-(--muted) opacity-40" />
              <div>
                <p className="text-sm font-medium text-(--foreground)">No patient being seen</p>
                <p className="text-xs text-(--muted)">{waiting.length > 0 ? 'Call the next patient from your queue' : 'Your queue is empty'}</p>
              </div>
               {waiting.length > 0 && (
                <button onClick={callNext} className="ml-auto flex items-center gap-2 bg-(--smartq-red) text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all active:scale-95">
                  <Play size={14} fill="currentColor" /> Call Next
                </button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Queue */}
      <div>
         <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-(--foreground)">Waiting Queue</h2>
          {waiting.length > 0 && !current && (
            <button onClick={callNext} className="flex items-center gap-2 bg-(--smartq-red) text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all active:scale-95">
              <Play size={14} fill="currentColor" /> Call Next
            </button>
          )}
        </div>
         {waiting.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-10">
              <Activity size={40} className="text-(--muted) opacity-30 mb-3" />
              <p className="text-sm font-medium text-(--foreground)">Queue is clear</p>
              <p className="text-xs text-(--muted)">No patients are currently waiting</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
             {waiting.map((token, i) => (
              <Card key={token._id} className="py-3! px-4!">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-(--muted)">
                      {i + 1}
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-(--foreground)">{token.tokenNumber}</p>
                        <Badge variant={token.priority === 'emergency' ? 'emergency' : token.priority === 'high' ? 'waiting' : 'active'} dot={token.priority === 'emergency'}>
                          {(token.priority || 'normal').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-(--muted)">{token.patientId?.name || token.userId?.name || 'Guest'} · {token.serviceId?.name || 'General'}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-2">
                    <span className="text-xs text-(--muted) flex items-center gap-1"><Clock size={11} />{token.estimatedTime || 15}m</span>
                    <button onClick={() => updateStatus(token._id, 'in-progress')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-(--smartq-red) text-white hover:bg-(--smartq-red-hover) transition-all active:scale-95">
                      Call
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
