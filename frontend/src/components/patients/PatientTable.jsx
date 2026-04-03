/**
 * PatientTable.jsx
 * ────────────────
 * Rich data table for patient appointments.
 * Columns: Patient | Department | Date & Time | Duration | Total Visits | Actions
 *
 * Props:
 *   rows           — Token[] (populated with userId, patientId, serviceId)
 *   loading        — boolean
 *   error          — string | null
 *   onRetry        — () => void
 *   onViewHistory  — (patient: object) => void
 *   statusFilter   — string | null  (from stats bar click)
 *   selectedDate   — Date
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Search, AlertCircle, RefreshCw, User, Clock,
  History, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatDuration, elapsedSeconds } from '../../utils/formatDuration';

const PAGE_SIZE = 10;

// ── Avatar helpers ────────────────────────────────────────────────────────────
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
const STATUS_MAP = {
  waiting:      { label: 'Waiting',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',   pulse: false },
  'in-progress':{ label: 'In Progress', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',   pulse: true  },
  completed:    { label: 'Completed',   color: '#10B981', bg: 'rgba(16,185,129,0.12)',   pulse: false },
  cancelled:    { label: 'Cancelled',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',    pulse: false },
  skipped:      { label: 'Skipped',     color: '#64748B', bg: 'rgba(100,116,139,0.12)',  pulse: false },
};

const StatusPill = memo(({ status }) => {
  const s = STATUS_MAP[status] || { label: 'Unknown', color: '#64748B', bg: 'rgba(100,116,139,0.12)', pulse: false };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {s.pulse && (
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: s.color }} />
      )}
      {s.label}
    </span>
  );
});
StatusPill.displayName = 'StatusPill';

// ── Live timer cell ───────────────────────────────────────────────────────────
const LiveTimer = memo(({ calledAt }) => {
  const [secs, setSecs] = useState(() => elapsedSeconds(calledAt));

  useEffect(() => {
    const id = setInterval(() => setSecs(elapsedSeconds(calledAt)), 1000);
    return () => clearInterval(id); // cleanup — no memory leak
  }, [calledAt]);

  return (
    <span className="font-mono tabular-nums" style={{ color: '#3B82F6' }}>
      {formatDuration(secs)}
    </span>
  );
});
LiveTimer.displayName = 'LiveTimer';

// ── Duration cell ─────────────────────────────────────────────────────────────
const DurationCell = memo(({ token }) => {
  if (token.status === 'in-progress' && token.calledAt) {
    return <LiveTimer calledAt={token.calledAt} />;
  }
  if (token.status === 'completed' && token.waitTime != null) {
    return <span style={{ color: '#94A3B8' }}>{formatDuration(token.waitTime, 'minutes')}</span>;
  }
  return <span style={{ color: '#334155' }}>—</span>;
});
DurationCell.displayName = 'DurationCell';

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = ({ cols }) => (
  <tr style={{ borderBottom: '1px solid #1a2234' }}>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div
          className="h-4 rounded animate-pulse"
          style={{ background: '#1F2937', width: `${50 + (i * 13) % 40}%` }}
        />
      </td>
    ))}
  </tr>
);

// ── PatientTable ──────────────────────────────────────────────────────────────
const PatientTable = ({
  rows = [],
  loading,
  error,
  onRetry,
  onViewHistory,
  statusFilter,
  selectedDate,
}) => {
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);

  // Reset page when filter/date/search changes
  useEffect(() => { setPage(1); }, [statusFilter, selectedDate, search]);

  // Filter by status (from stats bar) + search
  const filtered = rows.filter(row => {
    const name    = row.userId?.name || row.patientId?.name || '';
    const service = row.serviceId?.name || '';
    const token   = row.tokenNumber || '';

    const matchesStatus = !statusFilter || row.status === statusFilter;
    const matchesSearch = !search || [name, service, token]
      .some(v => v.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const dateLabel = selectedDate
    ? format(selectedDate, 'EEEE, dd MMM yyyy')
    : format(new Date(), 'EEEE, dd MMM yyyy');

  return (
    <div className="card overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid #1F2937' }}
      >
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
          <input
            type="text"
            placeholder="Search patient, department..."
            value={search}
            onChange={handleSearch}
            className="input pl-8 py-1.5 text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {statusFilter && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              Filtered: {STATUS_MAP[statusFilter]?.label || statusFilter}
            </span>
          )}
          <span className="text-xs" style={{ color: '#6B7280' }}>
            {total} record{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Date label ───────────────────────────────────────────────────── */}
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ background: '#0A0F1A', borderBottom: '1px solid #1F2937' }}
      >
        <Clock size={13} style={{ color: '#475569' }} />
        <p className="text-xs font-medium" style={{ color: '#475569' }}>
          Showing appointments for:{' '}
          <span className="text-white font-semibold">{dateLabel}</span>
        </p>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}
        >
          <AlertCircle size={15} style={{ color: '#EF4444', flexShrink: 0 }} />
          <p className="text-sm flex-1" style={{ color: '#EF4444' }}>{error}</p>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: '720px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937', background: '#0F1623' }}>
              {['Patient', 'Department', 'Date & Time', 'Duration', 'Visits', 'Actions'].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-semibold select-none"
                  style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-5xl">📋</div>
                    <p className="font-semibold text-white">No appointments found</p>
                    <p className="text-sm" style={{ color: '#475569' }}>
                      {search || statusFilter
                        ? 'Try clearing your filters.'
                        : `No patients booked on ${dateLabel}.`}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => {
                const patientName = row.userId?.name || row.patientId?.name || 'Unknown';
                const patientObj  = row.patientId || row.userId || {};
                const patientId   = patientObj._id || row._id;
                const service     = row.serviceId?.name || '—';
                const tokenNum    = row.tokenNumber || '—';
                const color       = avatarColor(patientName);

                const createdAt   = row.createdAt ? new Date(row.createdAt) : null;
                const dateStr     = createdAt ? format(createdAt, 'dd MMM yyyy') : '—';
                const timeStr     = createdAt ? format(createdAt, 'hh:mm a')    : '';

                return (
                  <tr
                    key={row._id || i}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid #1a2234' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#111827'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* ── Col 1: Patient ─────────────────────────────────── */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                          style={{ background: color }}
                        >
                          {initials(patientName)}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm leading-tight">{patientName}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: '#475569' }}>
                            {formatPatientId(patientId)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ── Col 2: Department ──────────────────────────────── */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-medium">{service}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                          style={{ background: '#1E293B', color: '#94A3B8' }}
                        >
                          {tokenNum}
                        </span>
                        <StatusPill status={row.status} />
                      </div>
                    </td>

                    {/* ── Col 3: Date & Time ─────────────────────────────── */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{dateStr}</p>
                      {timeStr && (
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{timeStr}</p>
                      )}
                    </td>

                    {/* ── Col 4: Duration ────────────────────────────────── */}
                    <td className="px-4 py-3 text-sm">
                      <DurationCell token={row} />
                    </td>

                    {/* ── Col 5: Total Visits ────────────────────────────── */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewHistory({
                          ...patientObj,
                          name:   patientName,
                          _id:    patientId,
                          userId: row.userId?._id || row.userId,
                        })}
                        className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                        style={{ color: '#3B82F6' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                        onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}
                        aria-label={`View visit history for ${patientName}`}
                      >
                        <History size={13} />
                        History
                      </button>
                    </td>

                    {/* ── Col 6: Actions ─────────────────────────────────── */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; e.currentTarget.style.color = '#3B82F6'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#94A3B8'; }}
                          aria-label={`View profile for ${patientName}`}
                        >
                          <User size={12} /> Profile
                        </button>
                        <button
                          onClick={() => onViewHistory({
                            ...patientObj,
                            name:   patientName,
                            _id:    patientId,
                            userId: row.userId?._id || row.userId,
                          })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.color = '#8B5CF6'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#94A3B8'; }}
                          aria-label={`View history for ${patientName}`}
                        >
                          <History size={12} /> History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {pages > 1 && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid #1F2937' }}
        >
          <span className="text-xs" style={{ color: '#6B7280' }}>
            Page {page} of {pages} · {total} records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary py-1.5 px-2.5"
              style={{ fontSize: '12px', opacity: page === 1 ? 0.4 : 1 }}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="btn btn-secondary py-1.5 px-2.5"
              style={{ fontSize: '12px', opacity: page === pages ? 0.4 : 1 }}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(PatientTable);
