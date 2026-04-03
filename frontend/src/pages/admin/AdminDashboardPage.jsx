import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, Users, Stethoscope, Activity, Clock, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import StatCard from '../../components/ui/StatCard';
import api from '../../lib/api';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { connectSocket, getSocket } from '../../services/socket';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs"
      style={{ background: '#1E293B', border: '1px solid #334155', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
    >
      <p className="font-semibold text-white mb-1">{label}</p>
      <p style={{ color: '#60A5FA' }}>{payload[0]?.value} tokens</p>
    </div>
  );
};

const ChartSkeleton = () => (
  <div className="h-48 rounded-xl animate-pulse" style={{ background: '#1E293B' }} />
);

const ListSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: '#1E293B' }} />
    ))}
  </div>
);

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

  useEffect(() => {
    fetchStats();
  }, []);

  // Re-fetch stats whenever a queue token is completed/updated via socket
  useEffect(() => {
    const hospitalId = user?.hospitalId;
    if (!hospitalId) return;
    const socket = connectSocket(hospitalId);
    const refresh = () => fetchStats();
    socket.on('queue:update', refresh);
    socket.on('queue:add', refresh);
    socket.on('queue:remove', refresh);
    return () => {
      const s = getSocket();
      if (s) {
        s.off('queue:update', refresh);
        s.off('queue:add', refresh);
        s.off('queue:remove', refresh);
      }
    };
  }, [user?.hospitalId]);

  useEffect(() => {
    if (!isSuperAdmin()) return;
    api.get('/hospitals')
      .then(r => {
        const all = r.data.data.hospitals || [];
        setPendingCount(all.filter(h => h.status === 'pending').length);
      })
      .catch(() => {});
  }, [isSuperAdmin]);

  const chartData = stats?.last7Days?.map(d => ({
    date:   d._id?.slice(5),
    tokens: d.count,
  })) || [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = isSuperAdmin() ? [
    { label: 'Total Hospitals', value: stats?.hospitals   ?? '—', icon: Hospital,    color: 'blue',   trendValue: '+2 this month' },
    { label: 'Total Doctors',   value: stats?.doctors     ?? '—', icon: Stethoscope, color: 'green',  trendValue: '+8 this month' },
    { label: 'Total Patients',  value: stats?.patients    ?? '—', icon: Users,       color: 'purple', trendValue: '+15%' },
    { label: "Today's Tokens",  value: stats?.todayTokens ?? '—', icon: Activity,    color: 'orange', trendValue: 'vs yesterday' },
  ] : [
    { label: 'Doctors',         value: stats?.totalDoctors  ?? '—', icon: Stethoscope, color: 'blue' },
    { label: 'Patients',        value: stats?.totalPatients ?? '—', icon: Users,       color: 'green' },
    { label: "Today's Tokens",  value: stats?.todayTokens   ?? '—', icon: Activity,    color: 'purple' },
    { label: 'Avg Wait (min)',  value: stats?.avgWaitTime   ?? '—', icon: Clock,       color: 'orange' },
  ];

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            {isSuperAdmin() ? 'Global SmartQ platform metrics' : 'Your hospital performance at a glance'}
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold shrink-0"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live data
        </div>
      </div>

      {/* Pending hospitals alert — super-admin only */}
      {isSuperAdmin() && pendingCount > 0 && (
        <button
          onClick={() => navigate('/admin/hospitals')}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-opacity hover:opacity-80"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
              {pendingCount} hospital registration{pendingCount > 1 ? 's' : ''} awaiting your approval
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#92400E' }}>Click to review and approve or reject</p>
          </div>
        </button>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse h-28" style={{ background: '#0D1117', border: '1px solid #1E293B' }} />
            ))
          : statCards.map((s, i) => <StatCard key={i} {...s} />)
        }
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Area chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: '#0D1117', border: '1px solid #1E293B' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Queue Activity</h3>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Token bookings — last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#10B981' }}>
              <TrendingUp size={13} />
              <span>Live</span>
            </div>
          </div>
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="tokens" stroke="#2563EB" strokeWidth={2} fill="url(#blueGrad)" dot={false} activeDot={{ r: 4, fill: '#2563EB', stroke: '#0D1117', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Side panel */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#0D1117', border: '1px solid #1E293B' }}
        >
          {isSuperAdmin() ? (
            <>
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={16} style={{ color: '#2563EB' }} />
                <h3 className="text-sm font-semibold text-white">Top Hospitals</h3>
              </div>
              {loading ? <ListSkeleton /> : (
                <div className="space-y-3">
                  {stats?.topHospitals?.length ? stats.topHospitals.map((h, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{ background: '#1E293B', color: '#64748B' }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm text-white truncate">{h.name}</span>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ background: 'rgba(37,99,235,0.12)', color: '#60A5FA', border: '1px solid rgba(37,99,235,0.2)' }}
                      >
                        {h.tokens}
                      </span>
                    </div>
                  )) : (
                    <p className="text-xs text-center py-8" style={{ color: '#475569' }}>No data yet</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-5">
                <Activity size={16} style={{ color: '#2563EB' }} />
                <h3 className="text-sm font-semibold text-white">Today's Queue</h3>
              </div>
              {loading ? <ListSkeleton /> : (
                <div className="space-y-3">
                  {[
                    { label: 'Waiting',   value: stats?.waitingTokens  ?? 0, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
                    { label: 'Completed', value: stats?.completedToday ?? 0, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Total',     value: stats?.todayTokens    ?? 0, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
                  ].map(({ label, value, color, bg }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{ background: bg, border: `1px solid ${color}22` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                        <span className="text-sm font-medium" style={{ color: '#94A3B8' }}>{label}</span>
                      </div>
                      <span className="text-lg font-bold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
