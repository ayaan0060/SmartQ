import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, SkipForward, Clock, Users, AlertTriangle,
  Activity, LogOut, ChevronDown, ChevronUp, Phone, Droplets,
  User, Calendar, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../features/auth/useAuthStore';
import { connectSocket, getSocket } from '../services/socket';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const priorityConfig = {
  emergency: { label: 'EMERGENCY', color: 'text-error', bg: 'bg-error-container' },
  high:      { label: 'HIGH',      color: 'text-amber-600', bg: 'bg-amber-50' },
  normal:    { label: 'NORMAL',    color: 'text-green-700', bg: 'bg-green-50' },
};

function PatientCard({ token }) {
  const [expanded, setExpanded] = useState(false);
  const patient = token.patientId || token.userId;
  const pCfg = priorityConfig[token.priority] || priorityConfig.normal;
  return (
    <div className="rounded-xl overflow-hidden bg-surface border border-outline-variant/20">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-on-primary bg-primary">
            {patient?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">{patient?.name || 'Guest'}</p>
            <p className="text-xs text-secondary">{token.serviceId?.name || 'General'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pCfg.bg} ${pCfg.color}`}>{pCfg.label}</span>
          {expanded ? <ChevronUp size={14} className="text-secondary" /> : <ChevronDown size={14} className="text-secondary" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-outline-variant/20">
          <div className="grid grid-cols-2 gap-2 mt-3">
            {token.patientId?.phone && <div className="flex items-center gap-2 text-xs text-secondary"><Phone size={12} />{token.patientId.phone}</div>}
            {token.patientId?.bloodGroup && <div className="flex items-center gap-2 text-xs text-secondary"><Droplets size={12} />{token.patientId.bloodGroup}</div>}
            {token.patientId?.gender && <div className="flex items-center gap-2 text-xs text-secondary"><User size={12} />{token.patientId.gender}</div>}
            {token.patientId?.dateOfBirth && <div className="flex items-center gap-2 text-xs text-secondary"><Calendar size={12} />{new Date(token.patientId.dateOfBirth).toLocaleDateString()}</div>}
          </div>
          {token.notes && <p className="text-xs mt-2 rounded-lg px-3 py-2 bg-surface-container text-secondary">📝 {token.notes}</p>}
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
  const [connected, setConnected] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState(false);

  const current = active.find(t => t.status === 'in-progress');
  const waiting = active.filter(t => t.status === 'waiting');

  const loadQueue = useCallback(async () => {
    try {
      const r = await api.get('/queue/doctor');
      setDoctor(r.data.data.doctor);
      setActive(r.data.data.active || []);
    } catch (err) {
      console.error('Queue fetch failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadQueue(), 0);
    const socket = connectSocket(user?.hospitalId);
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    ['queue:add', 'queue:update', 'queue:priority-change', 'queue:remove'].forEach(e => socket.on(e, loadQueue));
    return () => {
      clearTimeout(timer);
      const s = getSocket();
      if (s) ['queue:add', 'queue:update', 'queue:priority-change', 'queue:remove'].forEach(e => s.off(e, loadQueue));
    };
  }, [loadQueue, user?.hospitalId]);

  const updateStatus = async (id, status) => {
    try { await api.patch(`/queue/${id}`, { status }); loadQueue(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed to update'); }
  };

  const toggleAvailability = async () => {
    if (!doctor) return;
    setToggling(true);
    try { 
      await api.patch(`/doctors/${doctor._id}`, { isAvailable: !doctor.isAvailable });
      await loadQueue();
    } catch (_err) { 
      console.error('Availability update failed:', _err);
      toast.error('Failed to update availability'); 
    }
    finally { setToggling(false); }
  };

  const handleLogout = async () => {
    if (doctor?._id) { 
      try { await api.patch(`/doctors/${doctor._id}`, { isAvailable: false }); } 
      catch (err) { console.error('Failed to update availability on logout:', err); } 
    }
    logout(); navigate('/login');
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col">
        {/* Emergency ticker */}
        <div className="bg-primary-container text-on-primary-container px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="animate-pulse" />
            <p className="text-sm font-bold uppercase tracking-wider">Urgent: Trauma Bay 4 requires immediate senior consultation. Code Yellow.</p>
          </div>
          <span className="text-xs font-mono">{new Date().toLocaleTimeString()} UTC</span>
        </div>

        {/* Header */}
        <header className="glass-nav border-b border-zinc-200/10 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">Clinical Sentinel Overview</h2>
            <p className="text-sm text-secondary font-medium mt-1">
              {doctor?.name || user?.name} • {doctor?.specialization} · {hospitalName}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${connected ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} />
              {connected ? 'Live' : 'Offline'}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={toggleAvailability} disabled={toggling}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${doctor?.isAvailable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-error border border-red-200'}`}
            >
              <Activity size={14} />
              {doctor?.isAvailable ? 'Available' : 'Unavailable'}
            </motion.button>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-error hover:bg-error-container/30 transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <div className="p-8 flex-1 grid grid-cols-12 gap-8">
          {/* Left: Patient Focus */}
          <div className="col-span-8 space-y-8">
            {/* Patient header card */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex justify-between items-start">
              {current ? (
                <>
                  <div className="flex gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-primary-container flex items-center justify-center text-4xl font-black text-on-primary">
                      {(current.patientId?.name || current.userId?.name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black tracking-tight text-on-surface">
                          {current.patientId?.name || current.userId?.name || 'Guest'}
                        </h1>
                        <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-xs font-bold">ID: #{current.tokenNumber}</span>
                      </div>
                      <p className="text-zinc-500 font-medium mt-1">{current.serviceId?.name || 'General'}</p>
                      <div className="flex gap-4 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => updateStatus(current._id, 'completed')}
                          className="bg-primary text-on-primary px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} /> Mark Completed
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => updateStatus(current._id, 'skipped')}
                          className="bg-secondary-container text-on-secondary-container px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2"
                        >
                          <SkipForward size={16} /> Call Next
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-4 py-1.5 bg-red-50 text-error text-xs font-black uppercase tracking-widest rounded-full border border-red-100">Critical Observation</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-6 w-full">
                  <div className="w-24 h-24 rounded-2xl bg-surface-container flex items-center justify-center">
                    <Users size={40} className="text-outline-variant" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-on-surface">No patient in progress</h1>
                    <p className="text-secondary mt-1">{waiting.length > 0 ? `${waiting.length} patient${waiting.length > 1 ? 's' : ''} waiting` : 'Queue is empty'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Vitals grid */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Heart Rate', value: '84', unit: 'BPM', accent: true },
                { label: 'Blood Pressure', value: '128/82', unit: 'mmHg', accent: false },
                { label: 'SPO2 Level', value: '98', unit: '%', accent: false },
                { label: 'Temperature', value: '98.6', unit: '°F', accent: false },
              ].map(({ label, value, unit, accent }) => (
                <div key={label} className={`bg-surface-container-low p-6 rounded-2xl ${accent ? 'border-l-4 border-primary' : ''}`}>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-on-surface">{value}</span>
                    <span className="text-sm font-bold text-zinc-400">{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ECG Telemetry */}
            <div className="bg-zinc-950 p-8 rounded-2xl overflow-hidden relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h3 className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Real-time Telemetry (ECG Lead II)</h3>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-600 text-[10px] font-mono">25mm/sec</span>
                  <span className="text-zinc-600 text-[10px] font-mono">10mm/mV</span>
                </div>
              </div>
              <div className="h-48 w-full">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e1e1e" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect fill="url(#grid)" width="100%" height="100%" />
                  <path
                    className="ecg-line"
                    d="M0,50 L50,50 L60,30 L70,70 L80,50 L120,50 L130,50 L140,10 L150,90 L160,50 L200,50 L250,50 L260,30 L270,70 L280,50 L320,50 L330,50 L340,10 L350,90 L360,50 L400,50 L450,50 L460,30 L470,70 L480,50 L520,50 L530,50 L540,10 L550,90 L560,50 L600,50 L650,50 L660,30 L670,70 L680,50 L720,50 L730,50 L740,10 L750,90 L760,50 L800,50 L850,50 L860,30 L870,70 L880,50 L920,50 L930,50 L940,10 L950,90 L960,50 L1000,50"
                    fill="none" stroke="#a5001b" strokeWidth="2" vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Right: Queue */}
          <div className="col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container p-6 rounded-2xl flex-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black tracking-tight text-lg text-on-surface">Queue Status</h3>
                <span className="bg-zinc-200 px-3 py-1 rounded-full text-[10px] font-black text-on-surface">{waiting.length} REMAINING</span>
              </div>
              <div className="space-y-4">
                {waiting.length === 0 ? (
                  <p className="text-center text-sm py-8 text-secondary">No patients waiting</p>
                ) : (
                  waiting.map(token => (
                    <motion.div
                      key={token._id}
                      whileHover={{ x: 4 }}
                      className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 text-sm">
                          {(token.patientId?.name || token.userId?.name || 'G').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{token.patientId?.name || token.userId?.name || 'Guest'}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">Token: {token.tokenNumber}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-zinc-300 group-hover:text-primary transition-colors" />
                    </motion.div>
                  ))
                )}
              </div>

              {/* Clinical insights */}
              <div className="mt-8 pt-8 border-t border-outline-variant/10">
                <div className="bg-primary/5 rounded-2xl p-6">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-3">Clinical Insights</h4>
                  <p className="text-sm text-on-surface leading-relaxed">
                    System predicts a peak volume increase in 45 minutes. Review discharge summaries early.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
