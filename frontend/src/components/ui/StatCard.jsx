import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const glowMap = {
  blue:   'stat-glow-blue',
  green:  'stat-glow-green',
  purple: 'stat-glow-purple',
  orange: 'stat-glow-orange',
};

const colorMap = {
  blue:   { icon: '#3B82F6', iconBg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  green:  { icon: '#10B981', iconBg: 'rgba(16,185,129,0.12)', text: '#10B981' },
  purple: { icon: '#8B5CF6', iconBg: 'rgba(139,92,246,0.12)', text: '#8B5CF6' },
  orange: { icon: '#F59E0B', iconBg: 'rgba(245,158,11,0.12)',  text: '#F59E0B' },
};

export default function StatCard({ label, value, icon: Icon, color = 'blue', trend, trendValue, subtitle }) {
  const c = colorMap[color] || colorMap.blue;
  const glow = glowMap[color] || '';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF';

  return (
    <div className={`card p-5 ${glow} hover:scale-[1.02] transition-all duration-200 cursor-default`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="label mb-3">{label}</p>
          <p className="text-3xl font-display font-bold text-white leading-none">
            {value ?? '—'}
          </p>
          {subtitle && (
            <p className="mt-2 text-xs" style={{ color: '#6B7280' }}>{subtitle}</p>
          )}
          {trendValue != null && (
            <div className="mt-3 flex items-center gap-1.5">
              <TrendIcon size={13} style={{ color: trendColor }} />
              <span className="text-xs font-semibold" style={{ color: trendColor }}>
                {trendValue}
              </span>
              <span className="text-xs" style={{ color: '#6B7280' }}>vs last week</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: c.iconBg, color: c.icon }}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
