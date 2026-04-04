import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, SkipForward, XCircle, Clock, Users, Zap, LogOut, Plus, X, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../features/auth/useAuthStore';
import { useQueueStore } from '../store/queueStore';
import { connectSocket, getSocket } from '../services/socket';

const priorityConfig = {
  emergency: { label: 'EMERGENCY', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  high:      { label: 'HIGH',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  normal:    { label: 'NORMAL',    color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
};

const PRIORITIES = ['normal', 'high', 'emergency'];

const inputStyle = {
  background: '#0F172A', border: '1px solid #1E293B', color: '#fff',
  borderRadius: 10, padding: '8px 12px', width: '100%', fontSize: 13, outline: 'none',
};
const labelStyle = {
  color: '#94A3B8', fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4,
};

function AddTokenModal({ onClose, onAdded, hospitalId }) {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ patientName: '', serviceId: '', priority: 'normal', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hospitalId) return;
    api.get(`/services/${hospitalId}`)
      .then(r => setServices(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => {});
  }, [hospitalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serviceId) { toast.error('Please select a service'); return; }
    if (!form.patientName.trim()) { toast.error('Patient name is required'); return; }
    setLoading(true);
    try {
      const r = await api.post('/queue', {
        serviceId: form.serviceId,
        priority: form.priority,
        notes: form.notes,
        patientName: form.patientName.trim(),
      });
      onAdded(r.data.data.token);
      toast.success('Token added to queue');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Add Walk-in Token</h2>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={labelStyle}>Patient Name</label>
            <input style={inputStyle} placeholder="Enter patient name" value={form.patientName}
              onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Service</label>
            <select style={inputStyle} value={form.serviceId}
              onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
              <option value="">Select service...</option>
              {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p} type="button"
                  onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className="flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-all"
                  style={{
                    background: form.priority === p
                      ? (p === 'emergency' ? '#EF4444' : p === 'high' ? '#F59E0B' : '#2563EB')
                      : '#1E293B',
                    color: form.priority === p ? '#fff' : '#6B7280',
                  }}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <input style={inputStyle} placeholder="Any notes..." value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white mt-1"
            style={{ background: loading ? '#1E3A8A' : 'linear-gradient(135deg,#1D4ED8,#2563EB)', opacity: loading ? 0.8 : 1 }}>
            {loading ? 'Adding...' : 'Add to Queue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ReceptionistPage() {
  const { user, logout, hospitalName } = useAuthStore();
  const { tokens, connected, setTokens, addToken, updateToken, removeToken, setConnected, getWaiting, getInProgress, completedCount } = useQueueStore();
  const navigate = useNavigate();
  const hospitalId = user?.hospitalId;
  const [showAddModal, setShowAddModal] = useState(false);

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
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  const callNext = async () => {
    const next = waiting[0];
    if (!next) return;
    await updateStatus(next._id, 'in-progress');
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const current = getInProgress();
  const waiting = getWaiting();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B0F19' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0" style={{ background: '#0D1117', borderBottom: '1px solid #1E293B' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>Reception Counter</p>
          <h1 className="text-lg font-bold text-white">{hospitalName || 'SmartQ'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.open(`/display/${hospitalId}`, '_blank')}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
          >
            <Monitor size={15} /> Display Board
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)' }}
          >
            <Plus size={15} /> Add Token
          </button>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${connected ? 'text-emerald-400' : 'text-slate-500'}`}
            style={{ background: connected ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', border: `1px solid ${connected ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)'}` }}>
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {connected ? 'Live' : 'Offline'}
          </div>
          <div className="flex items-center gap-2 text-sm text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="hidden sm:block font-medium">{user?.name}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: '#EF4444' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Waiting',     value: waiting.length,   color: '#F59E0B', icon: Users },
            { label: 'In Progress', value: current ? 1 : 0,  color: '#3B82F6', icon: Zap },
            { label: 'Completed',   value: completedCount,   color: '#10B981', icon: CheckCircle2 },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: `${color}18`, color }}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-5">

          {/* Now Serving */}
          <div className="lg:col-span-2 rounded-2xl p-5 flex flex-col" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6B7280' }}>Now Serving</h3>

            {current ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <div className="relative">
                  <div className="text-8xl font-bold text-white leading-none">{current.tokenNumber}</div>
                  <span className="absolute -top-3 -right-3 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: '#2563EB' }}>Serving</span>
                </div>
                <p className="mt-4 font-semibold text-white">{current.patientId?.name || current.userId?.name || 'Guest'}</p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{current.serviceId?.name || 'General'}</p>
                <div className="grid grid-cols-2 gap-3 mt-6 w-full">
                  <button
                    className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all active:scale-95"
                    style={{ background: '#059669' }}
                    onClick={() => updateStatus(current._id, 'completed')}
                  >
                    <CheckCircle2 size={16} /> Complete
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
                    style={{ background: '#1E293B', color: '#94A3B8' }}
                    onClick={() => updateStatus(current._id, 'skipped')}
                  >
                    <SkipForward size={16} /> Skip
                  </button>
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
                {waiting.length > 0 && (
                  <button
                    className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all active:scale-95"
                    style={{ background: '#2563EB' }}
                    onClick={callNext}
                  >
                    <Play size={16} fill="currentColor" /> Call Next Patient
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Waiting Queue */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                Waiting Queue ({waiting.length})
              </h3>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
              {waiting.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-sm" style={{ color: '#6B7280' }}>Queue is empty</p>
                </div>
              ) : (
                waiting.map((token, i) => {
                  const pConfig = priorityConfig[token.priority] || priorityConfig.normal;
                  return (
                    <div key={token._id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1a2234' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: '#1F2937', color: '#9CA3AF' }}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white text-sm">{token.tokenNumber}</p>
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: pConfig.bg, color: pConfig.color, border: `1px solid ${pConfig.border}` }}>
                              {pConfig.label}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                            {token.patientId?.name || token.userId?.name || 'Guest'} · {token.serviceId?.name || 'General'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
                          <Clock size={11} /><span>{token.estimatedTime || 15}m</span>
                        </div>
                        <button
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95"
                          style={{ background: '#2563EB' }}
                          onClick={() => updateStatus(token._id, 'in-progress')}
                        >
                          Call
                        </button>
                        <button
                          className="rounded-lg p-1.5 transition-all active:scale-95"
                          style={{ background: '#1E293B' }}
                          onClick={() => updateStatus(token._id, 'cancelled')}
                        >
                          <XCircle size={14} style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddTokenModal
          hospitalId={hospitalId}
          onClose={() => setShowAddModal(false)}
          onAdded={(token) => addToken(token)}
        />
      )}
    </div>
  );
}
