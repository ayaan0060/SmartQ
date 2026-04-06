import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stethoscope, Wifi, WifiOff, Megaphone, Zap, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import { connectSocket, getSocket } from '../services/socket';

// TODO: Replace with real queue data from socket
const MOCK_STATIONS = [
  { id: 'A-142', station: 'Station 01', icon: Stethoscope, active: true },
  { id: 'B-089', station: 'Station 02', icon: Stethoscope, active: true },
  { id: 'D-210', station: 'Diagnostics', icon: null, active: false },
  { id: 'P-012', station: 'Pharmacy',   icon: null, active: false },
];

const MOCK_QUEUE = [
  { id: 'A-143', est: '2m', next: true },
  { id: 'B-090', est: '5m' },
  { id: 'A-144', est: '8m' },
  { id: 'D-211', est: '12m' },
  { id: 'P-013', est: '15m' },
  { id: 'A-145', est: '19m' },
];

export default function DisplayBoard() {
  const { hospitalId } = useParams();
  const [waiting, setWaiting]     = useState([]);
  const [connected, setConnected] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [time, setTime]           = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      const r = await api.get(`/queue/display/${hospitalId}`);
      const tokens = r.data.data.tokens || [];
      setHospitalName(r.data.data.hospitalName || '');
      setWaiting(tokens.filter(t => t.status === 'waiting').slice(0, 6));
    } catch (err) {
      // Quietly fail as this is a live display board
      console.error('Failed to load queue:', err);
    }
  }, [hospitalId]);

  useEffect(() => {
    const t = setTimeout(() => loadQueue(), 0);
    const socket = connectSocket(hospitalId);
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    const handleUpdate = () => loadQueue();
    ['queue:add', 'queue:update', 'queue:priority-change', 'queue:remove'].forEach(e => socket.on(e, handleUpdate));
    return () => {
      clearTimeout(t);
      const s = getSocket();
      if (s) ['queue:add', 'queue:update', 'queue:priority-change', 'queue:remove'].forEach(e => s.off(e, handleUpdate));
    };
  }, [hospitalId, loadQueue]);

  const fmt = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Use real data if available, fall back to mock
  const displayStations = waiting.length > 0
    ? waiting.slice(0, 4).map((t, i) => ({ id: t.tokenNumber, station: `Station ${String(i + 1).padStart(2, '0')}`, active: i < 2 }))
    : MOCK_STATIONS;

  const displayQueue = waiting.length > 0
    ? waiting.map((t, i) => ({ id: t.tokenNumber, est: `${(i + 1) * 3}m`, next: i === 0 }))
    : MOCK_QUEUE;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col select-none">
      {/* Top nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-200/10 glass-nav shadow-sm flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black italic text-red-700 tracking-tight">SmartQ</span>
          <div className="h-6 w-px bg-outline-variant/30" />
          <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Live Display Board</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest font-bold text-primary">System Status</span>
            <span className="text-xs font-bold text-on-surface">CLINIC ACTIVE</span>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${connected ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>
      </nav>

      <main className="grow pt-20 pb-6 px-8 grid grid-cols-12 gap-8">
        {/* Left: Now Serving */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="flex items-end justify-between px-2">
            <div>
              <h1 className="text-5xl font-black text-on-surface tracking-tighter uppercase">Now Serving</h1>
              <p className="text-zinc-500 font-medium mt-1">Please proceed to the designated station when your number appears.</p>
            </div>
            <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
              <span className="text-[10px] uppercase tracking-widest font-bold text-primary block text-right">Average Wait</span>
              <span className="text-2xl font-black text-on-surface tracking-tight">14 MINS</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {displayStations.map(({ id, station, active }) => (
              <div
                key={id}
                className={`bg-surface-container-lowest rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden group ${active ? 'border-l-8 border-primary' : 'border-l-8 border-zinc-300'}`}
              >
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Stethoscope size={18} className={active ? 'text-primary' : 'text-zinc-400'} />
                  <span className={`text-xs font-bold tracking-widest uppercase ${active ? 'text-primary' : 'text-zinc-500'}`}>{station}</span>
                </div>
                <div className="text-[140px] font-black text-on-surface leading-none tracking-tighter">{id}</div>
                <div className={`mt-4 px-6 py-2 rounded-full font-bold text-lg ${active ? 'bg-primary text-on-primary' : 'bg-zinc-100 text-zinc-600 uppercase tracking-wide'}`}>
                  {active ? 'PROCEED NOW' : 'In Progress'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Queue + Announcements */}
        <div className="col-span-4 flex flex-col gap-6">
          {/* Queue status */}
          <div className="bg-zinc-900 text-white rounded-2xl p-6 flex flex-col gap-4 overflow-hidden relative">
            <div className="z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-tight">Queue Status</h2>
                <span className="bg-primary text-[10px] px-2 py-1 rounded font-bold">LIVE UPDATE</span>
              </div>
              <div className="flex flex-col gap-2">
                {displayQueue.map(({ id, est, next }) => (
                  <div key={id} className={`flex items-center justify-between p-4 rounded-xl ${next ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/5'}`}>
                    <span className={`text-2xl font-black ${next ? 'text-white' : 'text-zinc-300'}`}>{id}</span>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">{next ? 'Next Up' : 'Waiting'}</span>
                      <span className={`text-sm font-bold ${next ? 'text-primary' : 'text-zinc-400'}`}>Est. {est}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-10 translate-y-10" />
          </div>

          {/* Announcements */}
          <div className="grow bg-surface-container-low rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Clinic Announcements</h3>
            <div className="flex gap-4 p-4 bg-surface-container-lowest rounded-xl">
              <Megaphone size={20} className="text-primary shrink-0" />
              <p className="text-sm font-medium leading-relaxed text-on-surface">
                Please have your digital or physical token ready before approaching the station. Mask-wearing is optional but encouraged.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-8 border-t border-zinc-200/10 bg-zinc-100 flex flex-row justify-between items-center">
        <div className="flex gap-6 items-center">
          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">© {new Date().getFullYear()} SmartQ Hospital Systems. HIPAA Compliant Interface.</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-primary">Current Time</span>
            <span className="text-sm font-black text-on-surface">{fmt(time)}</span>
          </div>
          <div className="h-8 w-px bg-outline-variant/30" />
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">{hospitalName || 'Central Medical Hub'}</span>
        </div>
      </footer>

      {/* Emergency FAB */}
      <div className="fixed bottom-8 left-8 z-50">
        <div className="bg-primary text-on-primary p-4 rounded-2xl shadow-2xl flex items-center gap-3 pr-8">
          <div className="bg-on-primary/20 p-2 rounded-xl">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-tighter leading-none">Emergency</div>
            <div className="text-xl font-black leading-none tracking-tight">Level 01 Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
