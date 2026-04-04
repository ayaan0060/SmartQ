import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, SkipForward, Clock, Users, Zap, LogOut,
  Activity, Calendar, Phone, Droplets, User, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../features/auth/useAuthStore';
import { connectSocket, getSocket } from '../services/socket';

const priorityConfig = {
  emergency: { label: 'EMERGENCY', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  high:      { label: 'HIGH',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  normal:    { label: 'NORMAL',    color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
};

function PatientCard({ token }) {
  const [expanded, setExpanded] = useState(false);
  const patient = token.patientId || token.userId;
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0F172A', border: '1px solid #1E293B' }}>
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}>
            {patient?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{patient?.name || 'Guest'}</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>{token.serviceId?.name || 'General'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: priorityConfig[token.priority]?.bg, color: priorityConfig[token.priority]?.color, border: `1px solid ${priorityConfig[token.priority]?.border}` }}>
            {priorityConfig[token.priority]?.label}
          </span>
          {expanded ? <ChevronUp size={14} style={{ color: '#6B7280' }} /> : <ChevronDown size={14} style={{ color: '#6B7280' }} />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-2" style={{ borderTop: '1px solid #1E293B' }}>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {token.patientId?.phone && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#94A3B8' }}>
                <Phone size={12} />{token.patientId.phone}
              </div>
            )}
            {token.patientId?.bloodGroup && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#94A3B8' }}>
                <Droplets size={12} />{token.patientId.bloodGroup}
              </div>
            )}
            {token.patientId?.gender && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#94A3B8' }}>
                <User size={12} />{token.patientId.gender}
              </div>
            )}
            {token.patientId?.dateOfBirth && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#94A3B8' }}>
                <Calendar size={12} />
                {new Date(token.patientId.dateOfBirth).toLocaleDateString('en-IN')}
              </div>
            )}
          </div>
          {token.notes && (
            <p className="text-xs mt-2 rounded-lg px-3 py-2" style={{ background: '#1E293B', color: '#94A3B8' }}>
              📝 {token.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DoctorPortal() {
  const { user, logout, hospitalName } = useAuthStore();
  const navigate = useNavigate();

  const [doctor, setDoctor]       = useState(null);
  const [active, setActive]       = useState([]);
  const [history, setHistory]     = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState(false);

  const current  = active.find(t => t.status === 'in-progress');
  const waiting  = active.filter(t => t.status === 'waiting');

  const loadQueue = useCallback(async () => {
    try {
      const r = await api.get('/queue/doctor');
      setDoctor(r.data.data.doctor);
      setActive(r.data.data.active || []);
      setHistory(r.data.data.history || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const socket = connectSocket(user?.hospitalId);
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('queue:add',             loadQueue);
    socket.on('queue:update',          loadQueue);
    socket.on('queue:priority-change', loadQueue);
    socket.on('queue:remove',          loadQueue);
    return () => {
      const s = getSocket();
      if (s) {
        s.off('queue:add',             loadQueue);
        s.off('queue:update',          loadQueue);
        s.off('queue:priority-change', loadQueue);
        s.off('queue:remove',          loadQueue);
      }
    };
  }, [loadQueue, user?.hospitalId]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/queue/${id}`, { status });
      loadQueue();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  const toggleAvailability = async () => {
    if (!doctor) return;
    setToggling(true);
    try {
      const r = await api.patch(`/doctors/${doctor._id}/availability`);
      setDoctor(d => ({ ...d, isAvailable: r.data.data.doctor.isAvailable }));
      toast.success(`You are now ${r.data.data.doctor.isAvailable ? 'Available' : 'Unavailable'}`);
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    // Mark doctor unavailable on logout
    if (doctor?._id) {
      try { await api.patch(`/doctors/${doctor._id}`, { isAvailable: false }); } catch {}
    }
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#0B0F19' }}>
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B0F19' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ background: '#0D1117', borderBottom: '1px solid #1E293B' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>Doctor Portal</p>
          <h1 className="text-lg font-bold text-white">{doctor?.name || user?.name}</h1>
          <p className="text-xs" style={{ color: '#6B7280' }}>{doctor?.specialization} · {hospitalName}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold`}
            style={{ background: connected ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: connected ? '#10B981' : '#6B7280', border: `1px solid ${connected ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)'}` }}>
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {connected ? 'Live' : 'Offline'}
          </div>

          {/* Availability toggle */}
          <button onClick={toggleAvailability} disabled={toggling}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background: doctor?.isAvailable ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: doctor?.isAvailable ? '#10B981' : '#EF4444',
              border: `1px solid ${doctor?.isAvailable ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
            <Activity size={14} />
            {doctor?.isAvailable ? 'Available' : 'Unavailable'}
          </button>

          <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
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
            { label: 'Waiting',   value: waiting.length,    color: '#F59E0B', icon: Users },
            { label: 'In Progress', value: current ? 1 : 0, color: '#3B82F6', icon: Zap },
            { label: 'Completed', value: history.length,    color: '#10B981', icon: CheckCircle2 },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                style={{ background: `${color}18`, color }}>
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

          {/* Current Patient */}
          <div className="lg:col-span-2 rounded-2xl p-5 flex flex-col"
            style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6B7280' }}>
              Current Patient
            </h3>

            {current ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4 space-y-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}>
                  {(current.patientId?.name || current.userId?.name || 'G').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{current.patientId?.name || current.userId?.name || 'Guest'}</p>
                  <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{current.tokenNumber} · {current.serviceId?.name}</p>
                </div>
                {current.patientId?.bloodGroup && (
                  <span className="rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {current.patientId.bloodGroup}
                  </span>
                )}
                {current.notes && (
                  <p className="text-xs rounded-xl px-3 py-2 w-full text-left"
                    style={{ background: '#1E293B', color: '#94A3B8' }}>📝 {current.notes}</p>
                )}
                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                  <button onClick={() => updateStatus(current._id, 'completed')}
                    className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
                    style={{ background: '#059669' }}>
                    <CheckCircle2 size={16} /> Done
                  </button>
                  <button onClick={() => updateStatus(current._id, 'skipped')}
                    className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                    style={{ background: '#1E293B', color: '#94A3B8' }}>
                    <SkipForward size={16} /> Skip
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-3">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
                  style={{ background: '#1F2937', color: '#4B5563' }}>
                  <Users size={28} />
                </div>
                <p className="font-semibold text-white">No patient in progress</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  {waiting.length > 0 ? `${waiting.length} patient${waiting.length > 1 ? 's' : ''} waiting` : 'Queue is empty'}
                </p>
              </div>
            )}
          </div>

          {/* Right column — waiting + history */}
          <div className="lg:col-span-3 space-y-4">

            {/* Waiting Queue */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                  Waiting ({waiting.length})
                </h3>
              </div>
              <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '280px' }}>
                {waiting.length === 0 ? (
                  <p className="text-center text-sm py-8" style={{ color: '#6B7280' }}>No patients waiting</p>
                ) : (
                  waiting.map(token => <PatientCard key={token._id} token={token} />)
                )}
              </div>
            </div>

            {/* Today's History */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                  Today's Completed ({history.length})
                </h3>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
                {history.length === 0 ? (
                  <p className="text-center text-sm py-8" style={{ color: '#6B7280' }}>No completed patients yet</p>
                ) : (
                  history.map((token, i) => (
                    <div key={token._id} className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: '1px solid #0F172A' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                          style={{ background: '#1F2937', color: '#6B7280' }}>{i + 1}</div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {token.patientId?.name || token.userId?.name || 'Guest'}
                          </p>
                          <p className="text-xs" style={{ color: '#6B7280' }}>{token.tokenNumber} · {token.serviceId?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {token.waitTime !== null && token.waitTime !== undefined && (
                          <div className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
                            <Clock size={11} />{token.waitTime === 0 ? '< 1 min' : `${token.waitTime}m`}
                          </div>
                        )}
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: token.status === 'completed' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', color: token.status === 'completed' ? '#10B981' : '#6B7280' }}>
                          {token.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
