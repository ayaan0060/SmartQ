import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../lib/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

const ChartSkeleton = () => <div className="h-64 rounded-xl animate-pulse" style={{ background: '#1F2937' }} />;

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-4">
    <h3 className="font-semibold text-white text-sm">{title}</h3>
    {subtitle && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{subtitle}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2" style={{ border: '1px solid #374151' }}>
        <p className="text-xs font-semibold text-white">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs mt-0.5" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats').then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = stats?.last7Days?.map(d => ({
    date: d._id?.slice(5),
    Total: d.count,
  })) || [];

  const statusPieData = [
    { name: 'Completed', value: stats?.completedToday || stats?.completedTokens || 0 },
    { name: 'Waiting', value: stats?.waitingTokens || 0 },
    { name: 'Today Total', value: stats?.todayTokens || 0 },
  ].filter(d => d.value > 0);



  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Platform performance insights</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Queue Volume Area Chart */}
        <div className="card p-5 lg:col-span-2">
          <SectionTitle title="Queue Volume" subtitle="Tokens processed over last 7 days" />
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purpleArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Total" stroke="#3B82F6" strokeWidth={2} fill="url(#blueArea)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart */}
        <div className="card p-5">
          <SectionTitle title="Daily Breakdown" subtitle="Token distribution by day" />
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card p-5">
          <SectionTitle title="Today's Queue Status" subtitle="Token status breakdown" />
          {loading ? <ChartSkeleton /> : statusPieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: '#6B7280' }}>
              No queue data for today yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#374151' }}>
                  {statusPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Platform Hospitals', value: stats?.hospitals ?? stats?.totalDoctors ?? '—', color: '#3B82F6' },
          { label: 'Total Doctors', value: stats?.doctors ?? stats?.totalDoctors ?? '—', color: '#10B981' },
          { label: 'Total Patients', value: stats?.patients ?? stats?.totalPatients ?? '—', color: '#8B5CF6' },
          { label: 'All-time Tokens', value: stats?.totalTokens ?? '—', color: '#F59E0B' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <div className="h-1 w-8 rounded-full mb-3" style={{ background: color }} />
            <p className="text-2xl font-display font-bold text-white">{value}</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
