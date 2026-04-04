import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Zap, Wifi, WifiOff, Users, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { connectSocket, getSocket } from '../services/socket';

const priorityConfig = {
  emergency: { label: 'EMERGENCY', color: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' },
  high:      { label: 'HIGH',      color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  normal:    { label: 'NORMAL',    color: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' },
};

export default function DisplayBoard() {
  const { hospitalId } = useParams();
  const [current, setCurrent]     = useState(null);
  const [waiting, setWaiting]     = useState([]);
  const [completed, setCompleted] = useState(0);
  const [connected, setConnected] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [time, setTime]           = useState(new Date());
  const [flash, setFlash]         = useState(false);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      // fetch queue without auth — public endpoint via hospitalId query
      const r = await api.get(`/queue/display/${hospitalId}`);
      const tokens = r.data.data.tokens || [];
      const hospitalName = r.data.data.hospitalName || '';
      setHospitalName(hospitalName);
      setCurrent(tokens.find(t => t.status === 'in-progress') || null);
      setWaiting(tokens.filter(t => t.status === 'waiting').slice(0, 5));
      setCompleted(r.data.data.completedCount || 0);
    } catch {
      // silently retry via socket
    }
  }, [hospitalId]);

  useEffect(() => {
    loadQueue();

    const socket = connectSocket(hospitalId);
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    const handleUpdate = () => { loadQueue(); triggerFlash(); };
    socket.on('queue:add',             handleUpdate);
    socket.on('queue:update',          handleUpdate);
    socket.on('queue:priority-change', handleUpdate);
    socket.on('queue:remove',          handleUpdate);

    return () => {
      const s = getSocket();
      if (s) {
        s.off('queue:add',             handleUpdate);
        s.off('queue:update',          handleUpdate);
        s.off('queue:priority-change', handleUpdate);
        s.off('queue:remove',          handleUpdate);
      }
    };
  }, [hospitalId, loadQueue]);

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 800);
  };

  const fmt = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col select-none" style={{ background: '#060B14', fontFamily: 'system-ui, sans-serif' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-10 py-5" style={{ background: '#0A0F1E', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}>
            <Zap size={24} className="text-white" fill="white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>SmartQ Display</p>
            <h1 className="text-2xl font-bold text-white">{hospitalName || 'Hospital Queue'}</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold tabular-nums text-white">{fmt(time)}</p>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>{fmtDate(time)}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          style={{ background: connected ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: connected ? '#10B981' : '#6B7280', border: `1px solid ${connected ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.2)'}` }}>
          {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>

      <div className="flex flex-1 gap-6 p-8">

        {/* NOW SERVING — left big panel */}
        <div className="flex flex-col flex-1 rounded-3xl overflow-hidden"
          style={{
            background: flash ? 'rgba(37,99,235,0.15)' : '#0D1117',
            border: `2px solid ${flash ? 'rgba(37,99,235,0.6)' : 'rgba(37,99,235,0.2)'}`,
            transition: 'all 0.3s ease',
          }}>
          <div className="px-8 py-5" style={{ borderBottom: '1px solid #1E293B' }}>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Now Serving</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-10">
            {current ? (
              <>
                <div className="text-[10rem] font-black leading-none text-white tracking-tight"
                  style={{ textShadow: '0 0 60px rgba(37,99,235,0.5)' }}>
                  {current.tokenNumber}
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <span className="rounded-full px-4 py-1.5 text-sm font-bold"
                    style={{
                      background: priorityConfig[current.priority]?.bg || priorityConfig.normal.bg,
                      color: priorityConfig[current.priority]?.color || priorityConfig.normal.color,
                      border: `1px solid ${priorityConfig[current.priority]?.border || priorityConfig.normal.border}`,
                    }}>
                    {priorityConfig[current.priority]?.label || 'NORMAL'}
                  </span>
                  <span className="text-xl font-semibold" style={{ color: '#94A3B8' }}>
                    {current.serviceId?.name || 'General'}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-semibold text-white">
                  {current.patientId?.name || current.userId?.name || 'Patient'}
                </p>
                <div className="mt-8 rounded-2xl px-8 py-4 text-center animate-pulse"
                  style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
                  <p className="text-lg font-bold" style={{ color: '#60A5FA' }}>Please proceed to the counter</p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="h-24 w-24 rounded-3xl flex items-center justify-center mx-auto" style={{ background: '#1F2937' }}>
                  <Users size={48} style={{ color: '#374151' }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: '#374151' }}>Counter Ready</p>
                <p style={{ color: '#1F2937' }}>Waiting for next patient...</p>
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 divide-x" style={{ borderTop: '1px solid #1E293B', divideColor: '#1E293B' }}>
            {[
              { label: 'Waiting',   value: waiting.length, color: '#F59E0B' },
              { label: 'Serving',   value: current ? 1 : 0, color: '#3B82F6' },
              { label: 'Completed', value: completed,       color: '#10B981' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center py-5" style={{ borderRight: '1px solid #1E293B' }}>
                <p className="text-4xl font-black" style={{ color }}>{value}</p>
                <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: '#475569' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* NEXT UP — right panel */}
        <div className="w-80 flex flex-col rounded-3xl overflow-hidden" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
          <div className="px-6 py-5" style={{ borderBottom: '1px solid #1E293B' }}>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Next Up</p>
          </div>

          <div className="flex-1 overflow-hidden">
            {waiting.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <CheckCircle2 size={40} style={{ color: '#1F2937' }} />
                <p className="mt-4 text-sm font-semibold" style={{ color: '#374151' }}>Queue is empty</p>
              </div>
            ) : (
              waiting.map((token, i) => {
                const pCfg = priorityConfig[token.priority] || priorityConfig.normal;
                return (
                  <div key={token._id} className="flex items-center gap-4 px-6 py-4"
                    style={{ borderBottom: '1px solid #0F172A', background: i === 0 ? 'rgba(37,99,235,0.06)' : 'transparent' }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black"
                      style={{ background: i === 0 ? 'rgba(37,99,235,0.2)' : '#1F2937', color: i === 0 ? '#60A5FA' : '#4B5563' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-lg truncate">{token.tokenNumber}</p>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
                          style={{ background: pCfg.bg, color: pCfg.color, border: `1px solid ${pCfg.border}` }}>
                          {pCfg.label}
                        </span>
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#475569' }}>
                        {token.serviceId?.name || 'General'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-6 py-4" style={{ borderTop: '1px solid #1E293B' }}>
            <p className="text-xs text-center" style={{ color: '#1E293B' }}>
              Powered by SmartQ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
