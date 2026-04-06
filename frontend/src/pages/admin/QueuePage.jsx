import React, { useEffect, useCallback } from 'react';
import { Play, CheckCircle2, XCircle, SkipForward, Zap, Users, Clock, Eye } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { useQueueStore } from '../../store/queueStore';
import { connectSocket, getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const priorityConfig = {
  emergency: { label: 'EMERGENCY', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  high:      { label: 'HIGH',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  normal:    { label: 'NORMAL',    color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
};

export default function QueuePage() {
  const { getHospitalId, user } = useAuthStore();
  const { completedCount, connected, setTokens, addToken, updateToken, removeToken, setConnected, getWaiting, getInProgress } = useQueueStore();
  const hospitalId = getHospitalId();
  const isReadOnly = user?.role === 'hospital-admin' || user?.role === 'super-admin';

  const loadQueue = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const r = await api.get('/queue');
      setTokens(r.data.data.tokens || []);
    } catch {
      toast.error('Failed to load queue');
    }
  }, [hospitalId, setTokens]);

  useEffect(() => {
    loadQueue();
    const socket = connectSocket(hospitalId);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('queue:add', addToken);
    socket.on('queue:update', updateToken);
    socket.on('queue:priority-change', updateToken);
    socket.on('queue:remove', removeToken);

      return () => {
        const s = getSocket();
        if (s) {
          s.off('queue:add', addToken);
          s.off('queue:update', updateToken);
          s.off('queue:priority-change', updateToken);
          s.off('queue:remove', removeToken);
        }
      };
    }, [hospitalId, loadQueue, setConnected, addToken, updateToken, removeToken]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/queue/${id}`, { status });
      // auto-call next is handled by backend after complete/skip
    } catch {
      toast.error('Failed to update');
    }
  };

  // Manual call next — fallback if auto-call didn't trigger
  const callNext = async () => {
    if (waiting.length === 0) return;
    await updateStatus(waiting[0]._id, 'in-progress');
  };

  const current = getInProgress();
  const waiting = getWaiting();
  const completed = completedCount;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            Queue {isReadOnly ? 'Monitor' : 'Management'}
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${connected ? 'badge-success' : 'badge-gray'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'animate-pulse' : ''}`}
                style={{ background: connected ? '#10B981' : '#6B7280' }} />
              {connected ? 'Live' : 'Offline'}
            </div>
            {isReadOnly && (
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Eye size={11} /> Monitor Only
              </div>
            )}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{isReadOnly ? 'Live queue overview — managed by reception' : 'Real-time patient queue'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Waiting', value: waiting.length, color: '#F59E0B', icon: Users },
          { label: 'In Progress', value: current ? 1 : 0, color: '#3B82F6', icon: Zap },
          { label: 'Completed', value: completed, color: '#10B981', icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
              style={{ background: `${color}18`, color }}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold font-display text-white">{value}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Current Serving */}
        <div className="lg:col-span-2 card p-5 flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6B7280' }}>
            Now Serving
          </h3>

          {current ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <div className="relative">
                <div className="text-8xl font-display font-black text-white leading-none">
                  {current.tokenNumber}
                </div>
                <span className="absolute -top-3 -right-3 badge badge-primary text-xs">Serving</span>
              </div>
              <p className="mt-4 font-semibold text-white">
                {current.patientId?.name || current.userId?.name || 'Guest'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                {current.serviceId?.name || 'General'}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6 w-full">
                  {!isReadOnly && (
                    <>
                      <button
                        className="btn btn-success py-3 text-sm"
                        onClick={() => updateStatus(current._id, 'completed')}
                      >
                        <CheckCircle2 size={16} /> Complete
                      </button>
                      <button
                        className="btn btn-secondary py-3 text-sm"
                        onClick={() => updateStatus(current._id, 'skipped')}
                      >
                        <SkipForward size={16} /> Skip
                      </button>
                    </>
                  )}
                  {isReadOnly && (
                    <div className="col-span-2 text-center text-xs py-2 rounded-xl" style={{ color: '#6B7280', background: '#1F2937' }}>
                      Managed by reception counter
                    </div>
                  )}
                </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4 space-y-4">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ background: '#1F2937', color: '#4B5563' }}>
                <Users size={28} />
              </div>
              <div>
                <p className="font-semibold text-white">Counter Ready</p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  {waiting.length > 0 ? `${waiting.length} patient${waiting.length > 1 ? 's' : ''} waiting` : 'No patients in queue'}
                </p>
              </div>
              {waiting.length > 0 && !isReadOnly && (
                <button
                  className="btn btn-primary w-full py-3"
                  onClick={callNext}
                >
                  <Play size={16} fill="currentColor" /> Call Next Patient
                </button>
              )}
              {waiting.length > 0 && isReadOnly && (
                <div className="text-center text-xs py-2 rounded-xl" style={{ color: '#6B7280', background: '#1F2937' }}>
                  Reception will call next patient
                </div>
              )}
            </div>
          )}
        </div>

        {/* Waiting Queue */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
              Waiting Queue ({waiting.length})
            </h3>
          </div>

          <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: '500px' }}>
            {waiting.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm" style={{ color: '#6B7280' }}>Queue is empty</p>
              </div>
            ) : (
              waiting.map((token, i) => {
                const pConfig = priorityConfig[token.priority] || priorityConfig.normal;
                return (
                  <div
                    key={token._id}
                    className="flex items-center justify-between px-4 py-3 transition-colors"
                    style={{ borderBottom: '1px solid #1a2234' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: '#1F2937', color: '#9CA3AF' }}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white text-sm">{token.tokenNumber}</p>
                          <span className="badge text-[10px] px-2 py-0.5" style={{ background: pConfig.bg, color: pConfig.color, border: `1px solid ${pConfig.border}` }}>
                            {pConfig.label}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                          {token.patientId?.name || token.userId?.name || 'Guest'} • {token.serviceId?.name || 'General'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
                        <Clock size={11} />
                        <span>{token.estimatedTime || 15}m</span>
                      </div>
                      {!isReadOnly && (
                        <>
                          <button
                            className="btn btn-primary py-1 px-3 text-xs"
                            onClick={() => updateStatus(token._id, 'in-progress')}
                          >
                            Call
                          </button>
                          <button
                            className="btn btn-ghost py-1 px-2 text-xs"
                            onClick={() => updateStatus(token._id, 'cancelled')}
                          >
                            <XCircle size={14} style={{ color: '#EF4444' }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
