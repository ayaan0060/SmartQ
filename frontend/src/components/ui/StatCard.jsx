import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';


const colorMap = {
  blue:   { icon: '#a5001b', iconBg: 'rgba(165,0,27,0.08)' },
  green:  { icon: '#005774', iconBg: 'rgba(0,87,116,0.08)' },
  purple: { icon: '#5f5e5e', iconBg: 'rgba(95,94,94,0.08)' },
  orange: { icon: '#a5001b', iconBg: 'rgba(165,0,27,0.08)' },
};

export default function StatCard({ label, value, icon: Icon, color = 'blue', trend, trendValue, subtitle }) {
  const c = colorMap[color] || colorMap.blue;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF';

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 hover:scale-[1.02] transition-all duration-200 cursor-default shadow-sm border border-outline-variant/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="label mb-3">{label}</p>
          <p className="text-3xl font-bold text-on-surface leading-none">
            {value ?? '—'}
          </p>
          {subtitle && (
            <p className="mt-2 text-xs text-secondary">{subtitle}</p>
          )}
          {trendValue != null && (
            <div className="mt-3 flex items-center gap-1.5">
              <TrendIcon size={13} style={{ color: trendColor }} />
              <span className="text-xs font-semibold" style={{ color: trendColor }}>
                {trendValue}
              </span>
              <span className="text-xs text-secondary">vs last week</span>
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
