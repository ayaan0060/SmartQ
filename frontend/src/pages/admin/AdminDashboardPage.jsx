import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hospital, Users, Stethoscope, Activity, Clock, TrendingUp,
  BarChart3, AlertTriangle, Database, Wifi, Shield, Cpu,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../lib/api';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { connectSocket, getSocket } from '../../services/socket';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs bg-surface-container-lowest border border-outline-variant/20 shadow-lg">
      <p className="font-semibold text-on-surface mb-1">{label}</p>
      <p className="text-primary">{payload[0]?.value} tokens</p>
    </div>
  );
};

export default function AdminDashboardPage() {
  const { isSuperAdmin, user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchStats = useCallback(() => {
    api.get('/stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    const hospitalId = user?.hospitalId;
    if (!hospitalId) return;
    const socket = connectSocket(hospitalId);
    const refresh = () => fetchStats();
    ['queue:update', 'queue:add', 'queue:remove'].forEach(e => socket.on(e, refresh));
    return () => {
      const s = getSocket();
      if (s) ['queue:update', 'queue:add', 'queue:remove'].forEach(e => s.off(e, refresh));
    };
  }, [user?.hospitalId]);

  useEffect(() => {
    if (!isSuperAdmin()) return;
    api.get('/hospitals')
      .then(r => setPendingCount((r.data.data.hospitals || []).filter(h => h.status === 'pending').length))
      .catch(() => {});
  }, [isSuperAdmin]);

  const chartData = stats?.last7Days?.map(d => ({ date: d._id?.slice(5), tokens: d.count })) || [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = isSuperAdmin() ? [
    { label: 'Total Hospitals', value: stats?.hospitals   ?? '—', icon: Hospital,    color: 'text-primary',   bg: 'bg-primary/5' },
    { label: 'Total Doctors',   value: stats?.doctors     ?? '—', icon: Stethoscope, color: 'text-tertiary',  bg: 'bg-tertiary/5' },
    { label: 'Total Patients',  value: stats?.patients    ?? '—', icon: Users,       color: 'text-secondary', bg: 'bg-secondary/5' },
    { label: "Today's Tokens",  value: stats?.todayTokens ?? '—', icon: Activity,    color: 'text-primary',   bg: 'bg-primary/5' },
  ] : [
    { label: 'Doctors',        value: stats?.totalDoctors  ?? '—', icon: Stethoscope, color: 'text-primary',   bg: 'bg-primary/5' },
    { label: 'Patients',       value: stats?.totalPatients ?? '—', icon: Users,       color: 'text-tertiary',  bg: 'bg-tertiary/5' },
    { label: "Today's Tokens", value: stats?.todayTokens   ?? '—', icon: Activity,    color: 'text-secondary', bg: 'bg-secondary/5' },
    { label: 'Avg Wait (min)', value: stats?.avgWaitTime   ?? '—', icon: Clock,       color: 'text-primary',   bg: 'bg-primary/5' },
  ];

  // TODO: Replace with real queue monitor data
  const MOCK_QUEUE_ROWS = [
    { dept: 'Emergency Radiology', active: '12 Patients', wait: '18m', status: 'High Load', statusColor: 'bg-red-100 text-red-700' },
    { dept: 'Cardiology Triage',   active: '4 Patients',  wait: '8m',  status: 'Normal',    statusColor: 'bg-green-100 text-green-700' },
    { dept: 'Pediatric Urgent Care', active: '28 Patients', wait: '42m', status: 'Critical Surge', statusColor: 'bg-red-100 text-red-700' },
    { dept: 'Outpatient Labs',     active: '9 Patients',  wait: '12m', status: 'Normal',    statusColor: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">
            {greeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-sm mt-1 text-secondary">
            {isSuperAdmin() ? 'Global SmartQ platform metrics' : 'Your hospital performance at a glance'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold bg-green-50 border border-green-200 text-green-700 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Live data
        </div>
      </div>

      {/* Pending alert */}
      {isSuperAdmin() && pendingCount > 0 && (
        <button
          onClick={() => navigate('/admin/hospitals')}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left hover:opacity-80 transition-opacity bg-amber-50 border border-amber-200"
        >
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700">
              {pendingCount} hospital registration{pendingCount > 1 ? 's' : ''} awaiting your approval
            </p>
            <p className="text-xs mt-0.5 text-amber-600">Click to review and approve or reject</p>
          </div>
        </button>
      )}

      {/* Urgency ticker */}
      <div className="overflow-hidden rounded-2xl bg-primary-container text-on-primary-container px-6 py-2 flex items-center gap-4">
        <span className="bg-on-primary-container/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0">Critical</span>
        <p className="text-sm font-medium">System Alert: Surge detected in Pediatric ER. Redirecting secondary queue to Wing B.</p>
        <span className="ml-auto text-xs opacity-70 shrink-0">Updated 2m ago</span>
      </div>

      {/* Asymmetric grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* KPI bento */}
          <div className="grid grid-cols-12 gap-6">
            {/* Bar chart */}
            <div className="col-span-8 bg-surface-container-lowest rounded-2xl p-6 border-l-4 border-primary">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">REAL-TIME THROUGHPUT</p>
                  <h3 className="text-2xl font-black text-on-surface">Total Patient Flow</h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary tracking-tighter">{stats?.todayTokens ?? '—'}</p>
                  <p className="text-xs text-green-600 font-bold">+12.4% vs prev. shift</p>
                </div>
              </div>
              {loading ? (
                <div className="h-40 rounded-xl animate-pulse bg-surface-container" />
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#a5001b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#a5001b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#5f5e5e', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#5f5e5e', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e4bdbb', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="tokens" stroke="#a5001b" strokeWidth={2} fill="url(#redGrad)" dot={false} activeDot={{ r: 4, fill: '#a5001b', stroke: '#ffffff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Efficiency gauge */}
            <div className="col-span-4 bg-surface-container-lowest rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-4 w-full text-left">EFFICIENCY INDEX</p>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle className="text-surface-container" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="10" />
                  <circle className="text-primary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset="40" strokeWidth="10" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black tracking-tighter text-on-surface">92%</span>
                </div>
              </div>
              <p className="mt-4 text-xs font-medium text-secondary">Optimal clinical resource utilization active.</p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse h-28 bg-surface-container" />
                ))
              : statCards.map((s, i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${s.bg}`}>
                      <s.icon size={22} className={s.color} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-on-surface">{s.value}</p>
                      <p className="text-xs text-secondary uppercase tracking-widest font-bold mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))
            }
          </div>

          {/* Queue monitor table */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
            <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center">
              <h3 className="text-sm font-bold tracking-tight text-on-surface uppercase">Real-Time Queue Monitor</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Live Stream</span>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['Department', 'Active', 'Wait Time', 'Status'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {MOCK_QUEUE_ROWS.map(row => (
                  <tr key={row.dept} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-on-surface">{row.dept}</td>
                    <td className="px-6 py-4 text-sm font-medium text-secondary">{row.active}</td>
                    <td className={`px-6 py-4 text-sm font-medium ${parseInt(row.wait) > 20 ? 'text-primary' : 'text-zinc-600'}`}>{row.wait}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${row.statusColor}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Avg wait */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center shadow-sm">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">AVG. WAIT TIME</p>
            <h4 className="text-5xl font-black text-on-surface tracking-tighter">
              {stats?.avgWaitTime ?? '24'}<span className="text-xl ml-1 font-bold text-zinc-400">min</span>
            </h4>
            <div className="mt-4 flex items-center justify-center gap-2 text-primary font-bold text-xs">
              <TrendingUp size={14} />
              +4m from 1hr ago
            </div>
          </div>

          {/* Infrastructure status */}
          <div className="bg-surface-container-highest rounded-2xl p-6">
            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-6">INFRASTRUCTURE STATUS</p>
            <div className="space-y-4">
              {[
                { icon: Database, label: 'SQL Database',   status: 'OPTIMAL', color: 'text-green-600' },
                { icon: Wifi,     label: 'HealthAPI v2.4', status: 'ACTIVE',  color: 'text-green-600' },
                { icon: Cpu,      label: 'Cloud Cluster',  status: 'LATENCY', color: 'text-primary' },
              ].map(({ icon: Icon, label, status, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-zinc-600" />
                    <span className="text-xs font-bold text-on-surface">{label}</span>
                  </div>
                  <span className={`text-[10px] font-black ${color}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System health bar */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Wifi,   label: 'Node Nodes',  value: '12/12 Online' },
              { icon: Cpu,    label: 'CPU Usage',   value: '24.8%' },
              { icon: BarChart3, label: 'Network I/O', value: '1.2 GB/s' },
              { icon: Shield, label: 'Security',    value: 'Locked', green: true },
            ].map(({ icon: Icon, label, value, green }) => (
              <div key={label} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl p-4">
                <Icon size={16} className="text-zinc-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">{label}</p>
                  <p className={`text-sm font-black ${green ? 'text-green-600' : 'text-on-surface'}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
