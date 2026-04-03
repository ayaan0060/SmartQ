/**
 * PatientStatsBar.jsx
 * ───────────────────
 * Four metric cards: Today's Total | Waiting | In Progress | Completed Today.
 * Polls /api/stats every 30 s. Failure shows "—" without blocking the table.
 * Clicking a card calls onFilterStatus(status) to filter the table.
 *
 * Props:
 *   onFilterStatus — (status: string | null) => void
 *   activeFilter   — string | null
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { Users, Clock, Activity, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';

const CARDS = [
  {
    key:    'total',
    label:  "Today's Patients",
    icon:   Users,
    color:  '#3B82F6',
    bg:     'rgba(59,130,246,0.1)',
    status: null,
  },
  {
    key:    'waiting',
    label:  'Currently Waiting',
    icon:   Clock,
    color:  '#F59E0B',
    bg:     'rgba(245,158,11,0.1)',
    status: 'waiting',
  },
  {
    key:    'inProgress',
    label:  'In Progress',
    icon:   Activity,
    color:  '#8B5CF6',
    bg:     'rgba(139,92,246,0.1)',
    status: 'in-progress',
  },
  {
    key:    'completed',
    label:  'Completed Today',
    icon:   CheckCircle2,
    color:  '#10B981',
    bg:     'rgba(16,185,129,0.1)',
    status: 'completed',
  },
];

const PatientStatsBar = ({ onFilterStatus, activeFilter }) => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/stats');
      const d   = res.data?.data;
      setStats({
        total:      d?.todayTokens      ?? '—',
        waiting:    d?.waitingTokens    ?? '—',
        inProgress: d?.inProgressTokens ?? '—',
        completed:  d?.completedToday   ?? '—',
      });
    } catch {
      // Silently degrade — show "—" in cards, do not block table
      setStats({ total: '—', waiting: '—', inProgress: '—', completed: '—' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 30 s polling
  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30_000);
    return () => clearInterval(id); // cleanup on unmount
  }, [fetchStats]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map(card => {
        const Icon      = card.icon;
        const value     = loading ? '…' : (stats?.[card.key] ?? '—');
        const isActive  = activeFilter === card.status;

        return (
          <button
            key={card.key}
            onClick={() => onFilterStatus(isActive ? null : card.status)}
            className="text-left rounded-2xl p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2"
            style={{
              background:  isActive ? card.bg : '#0D1117',
              border:      `1px solid ${isActive ? card.color + '55' : '#1E293B'}`,
              boxShadow:   isActive ? `0 0 0 1px ${card.color}33` : 'none',
              cursor:      'pointer',
            }}
            aria-pressed={isActive}
            aria-label={`Filter by ${card.label}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: card.bg }}
              >
                <Icon size={18} style={{ color: card.color }} />
              </div>
              {isActive && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                  style={{ background: card.bg, color: card.color }}
                >
                  Active
                </span>
              )}
            </div>
            <p
              className="mt-3 text-2xl font-bold tabular-nums"
              style={{ color: isActive ? card.color : '#F9FAFB' }}
            >
              {value}
            </p>
            <p className="mt-0.5 text-xs font-medium" style={{ color: '#64748B' }}>
              {card.label}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default memo(PatientStatsBar);
