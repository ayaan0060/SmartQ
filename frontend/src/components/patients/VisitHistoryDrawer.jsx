/**
 * VisitHistoryDrawer.jsx
 * ──────────────────────
 * Slide-in right drawer showing a patient's full visit history.
 * Closes on X click, backdrop click, and Escape key.
 * Uses CSS transform for smooth slide animation (no display:none toggle).
 *
 * Props:
 *   patient  — { name, _id, userId, bloodGroup } | null
 *   onClose  — () => void
 */

import React, { useEffect, memo } from 'react';
import { X, Calendar, Clock, Activity, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useVisitHistory } from '../../hooks/useVisitHistory';
import { formatDuration } from '../../utils/formatDuration';

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#3B82F6','#8B5CF6','#10B981','#F59E0B',
  '#EF4444','#06B6D4','#EC4899','#6366F1',
];

const avatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

const formatPatientId = (id = '') =>
  `#PT-${String(id).slice(-5).toUpperCase()}`;

// ── Status pill ───────────────────────────────────────────────────────────────
const STATUS = {
  waiting:     { label: 'Waiting',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  'in-progress':{ label: 'In Progress', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  completed:   { label: 'Completed',   color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  cancelled:   { label: 'Cancelled',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  skipped:     { label: 'Skipped',     color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
};

function StatusPill({ status }) {
  const s = STATUS[status] || { label: 'Unknown', color: '#64748B', bg: 'rgba(100,116,139,0.12)' };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {status === 'in-progress' && (
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: s.color }} />
      )}
      {s.label}
    </span>
  );
}

// ── VisitHistoryDrawer ────────────────────────────────────────────────────────
const VisitHistoryDrawer = ({ patient, onClose }) => {
  const isOpen = !!patient;

  const patientId = patient?._id    || null;
  const userId    = patient?.userId || null;

  const { visits, stats, loading, error } = useVisitHistory(
    isOpen ? patientId : null,
    isOpen ? userId    : null
  );

  // Escape key to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const color = avatarColor(patient?.name || '');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background:  'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(2px)',
          opacity:     isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Visit history for ${patient?.name || 'patient'}`}
        className="fixed right-0 top-0 z-50 h-full flex flex-col"
        style={{
          width:      'min(480px, 100vw)',
          background: '#0D1117',
          borderLeft: '1px solid #1E293B',
          transform:  isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow:  '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-4 px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid #1E293B' }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white"
            style={{ background: color }}
          >
            {initials(patient?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{patient?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
              {formatPatientId(patient?._id)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close visit history"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors"
            style={{ color: '#64748B', background: '#1E293B' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB'; e.currentTarget.style.background = '#334155'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = '#1E293B'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        {stats && (
          <div
            className="grid grid-cols-4 gap-px shrink-0"
            style={{ background: '#1E293B', borderBottom: '1px solid #1E293B' }}
          >
            {[
              { label: 'Total Visits',  value: stats.totalVisits },
              { label: 'Departments',   value: stats.departments },
              { label: 'Avg Duration',  value: stats.avgDurationMin != null ? `${stats.avgDurationMin} min` : '—' },
              { label: 'Last Visit',    value: stats.lastVisit ? format(new Date(stats.lastVisit), 'dd MMM') : '—' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center py-4 px-2" style={{ background: '#0D1117' }}>
                <p className="text-lg font-bold text-white tabular-nums">{s.value}</p>
                <p className="text-[10px] mt-0.5 text-center" style={{ color: '#475569' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Timeline body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin" style={{ color: '#475569' }} />
            </div>
          )}

          {error && !loading && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle size={16} style={{ color: '#EF4444', marginTop: 2, flexShrink: 0 }} />
              <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
            </div>
          )}

          {!loading && !error && visits.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">🏥</div>
              <p className="font-semibold text-white">First Visit</p>
              <p className="text-sm mt-1" style={{ color: '#475569' }}>
                No previous visit history found for this patient.
              </p>
            </div>
          )}

          {!loading && visits.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#475569' }}>
                Visit Timeline — {visits.length} visit{visits.length !== 1 ? 's' : ''}
              </p>

              {visits.map((visit, i) => {
                const durationSec = visit.waitTime != null ? visit.waitTime * 60 : null;
                const isOngoing   = visit.status === 'in-progress';
                const dept        = visit.serviceId?.name || '—';
                const doctor      = visit.doctorId?.name  || null;
                const tokenNum    = visit.tokenNumber      || '—';
                const visitDate   = visit.createdAt
                  ? format(new Date(visit.createdAt), 'dd MMM yyyy')
                  : '—';
                const visitTime   = visit.createdAt
                  ? format(new Date(visit.createdAt), 'hh:mm a')
                  : '';

                return (
                  <div
                    key={visit._id || i}
                    className="rounded-2xl p-4"
                    style={{ background: '#0F172A', border: '1px solid #1E293B' }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                          style={{ background: '#1E293B', color: '#64748B' }}
                        >
                          {visits.length - i}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{dept}</p>
                          {doctor && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: '#64748B' }}>
                              Dr. {doctor}
                            </p>
                          )}
                        </div>
                      </div>
                      <StatusPill status={visit.status} />
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#475569' }}>
                        <Calendar size={11} />
                        {visitDate} {visitTime && `· ${visitTime}`}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#475569' }}>
                        <Activity size={11} />
                        Token {tokenNum}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#475569' }}>
                        <Clock size={11} />
                        {isOngoing ? (
                          <span style={{ color: '#3B82F6' }}>Ongoing</span>
                        ) : (
                          formatDuration(durationSec)
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(VisitHistoryDrawer);
