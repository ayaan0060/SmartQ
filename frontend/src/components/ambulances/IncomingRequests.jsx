/**
 * IncomingRequests.jsx
 * ────────────────────
 * Collapsible panel showing active emergency requests in real-time.
 * Replaces the inline request list in AmbulancesPage.jsx.
 *
 * Props:
 *   requests        — EmergencyRequest[] (active only)
 *   onDispatch      — (requestId) => void  → opens dispatch modal
 *   onStatusUpdate  — (requestId, status) => void
 */

import React, { useState, memo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CFG = {
  requested:    { label: 'Pending',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',   pulse: true  },
  acknowledged: { label: 'Acknowledged',color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',   pulse: false },
  dispatched:   { label: 'Dispatched',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',   pulse: false },
  en_route:     { label: 'En Route',    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',   pulse: true  },
  arriving:     { label: 'Arriving',    color: '#10B981', bg: 'rgba(16,185,129,0.12)',   pulse: true  },
  arrived:      { label: 'Arrived',     color: '#10B981', bg: 'rgba(16,185,129,0.12)',   pulse: false },
  cancelled:    { label: 'Cancelled',   color: '#64748B', bg: 'rgba(100,116,139,0.12)',  pulse: false },
};

const EMERGENCY_LABELS = {
  medical:  '🏥 Medical',
  accident: '🚗 Accident',
  transfer: '🔄 Transfer',
  other:    '🆘 Other',
};

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.requested;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      {c.pulse && <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: c.color }} />}
      {c.label}
    </span>
  );
}

const IncomingRequests = ({ requests, onDispatch, onStatusUpdate }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (requests.length === 0) return null;

  // SOS requests float to the top
  const sorted  = [...requests].sort((a, b) => {
    const aIsSOS = a.source === 'quick_access_sos' ? -1 : 0;
    const bIsSOS = b.source === 'quick_access_sos' ? -1 : 0;
    return aIsSOS - bIsSOS;
  });

  const pending = requests.filter(r => ['requested', 'acknowledged'].includes(r.status));
  const hasSOS  = requests.some(r => r.source === 'quick_access_sos');

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${pending.length > 0 ? 'rgba(220,38,38,0.35)' : 'rgba(59,130,246,0.25)'}` }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 px-5 py-3 transition-colors"
        style={{
          background:   pending.length > 0 ? 'rgba(220,38,38,0.1)' : 'rgba(59,130,246,0.08)',
          borderBottom: collapsed ? 'none' : `1px solid ${pending.length > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(59,130,246,0.15)'}`,
        }}
      >
        <AlertTriangle size={16} style={{ color: pending.length > 0 ? '#EF4444' : '#3B82F6', flexShrink: 0 }} />
        <p className="text-sm font-bold flex-1 text-left" style={{ color: pending.length > 0 ? '#EF4444' : '#3B82F6' }}>
          {pending.length > 0
            ? `🚨 ${pending.length} Pending Request${pending.length > 1 ? 's' : ''} — Needs Dispatch`
            : `${requests.length} Active Request${requests.length > 1 ? 's' : ''}`
          }
          {hasSOS && (
            <span
              className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
              style={{ background: 'rgba(220,38,38,0.15)', color: '#EF4444', border: '1px solid rgba(220,38,38,0.3)' }}
            >
              SOS
            </span>
          )}
        </p>
        {collapsed ? <ChevronDown size={16} style={{ color: '#64748B' }} /> : <ChevronUp size={16} style={{ color: '#64748B' }} />}
      </button>

      {/* Request cards */}
      {!collapsed && (
        <div className="divide-y" style={{ background: '#0D1117', borderColor: '#1E293B' }}>
          {sorted.map(req => {
            const isSOS = req.source === 'quick_access_sos';
            return (
            <div
              key={req._id}
              className="px-5 py-4"
              title={isSOS ? 'Patient used Quick Access SOS — auto-nearest hospital' : undefined}
              style={{
                borderLeft: isSOS
                  ? '3px solid #EF4444'
                  : `3px solid ${STATUS_CFG[req.status]?.color || '#64748B'}`,
                animation: isSOS && ['requested','acknowledged'].includes(req.status)
                  ? 'sosBorderPulse 1.5s ease-in-out infinite'
                  : 'none',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white">
                      {req.patientId?.name || 'Unknown Patient'}
                    </p>
                    <span className="text-xs font-mono" style={{ color: '#475569' }}>
                      #{String(req._id).slice(-6).toUpperCase()}
                    </span>
                    <StatusPill status={req.status} />
                    {/* SOS badge */}
                    {isSOS && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                        style={{ background: 'rgba(220,38,38,0.15)', color: '#EF4444', border: '1px solid rgba(220,38,38,0.35)' }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#EF4444' }} />
                        SOS
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                      {EMERGENCY_LABELS[req.emergencyType] || '🆘 Emergency'}
                    </span>
                    {req.patientLocation?.lat && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#475569' }}>
                        <MapPin size={11} />
                        {req.patientLocation.address
                          ? req.patientLocation.address.slice(0, 40) + '...'
                          : `${req.patientLocation.lat.toFixed(4)}, ${req.patientLocation.lng.toFixed(4)}`
                        }
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#475569' }}>
                      <Clock size={11} />
                      {formatDistanceToNow(new Date(req.requestedAt), { addSuffix: true })}
                    </span>
                  </div>

                  {req.notes && (
                    <p className="text-xs italic" style={{ color: '#64748B' }}>
                      "{req.notes}"
                    </p>
                  )}

                  {req.ambulanceId && (
                    <p className="text-xs" style={{ color: '#3B82F6' }}>
                      🚑 {req.ambulanceId.vehicleNumber} — {req.ambulanceId.driverName}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {(req.status === 'requested' || req.status === 'acknowledged') && (
                    <button
                      onClick={() => onDispatch(req._id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97]"
                      style={{ background: '#DC2626' }}
                    >
                      🚑 Dispatch
                    </button>
                  )}
                  {req.status === 'dispatched' && (
                    <button
                      onClick={() => onStatusUpdate(req._id, 'en_route')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                      style={{ background: '#2563EB' }}
                    >
                      En Route
                    </button>
                  )}
                  {req.status === 'en_route' && (
                    <button
                      onClick={() => onStatusUpdate(req._id, 'arriving')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                      style={{ background: '#7C3AED' }}
                    >
                      Arriving
                    </button>
                  )}
                  {(req.status === 'arriving' || req.status === 'en_route') && (
                    <button
                      onClick={() => onStatusUpdate(req._id, 'arrived')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                      style={{ background: '#10B981' }}
                    >
                      ✅ Arrived
                    </button>
                  )}
                  {req.status === 'arrived' && (
                    <button
                      onClick={() => onStatusUpdate(req._id, 'completed')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                      style={{ background: '#2563EB' }}
                    >
                      ✅ Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(IncomingRequests);

// Injected once — SOS pulsing border animation
const _style = typeof document !== 'undefined' && (() => {
  if (document.getElementById('sos-border-style')) return;
  const s = document.createElement('style');
  s.id = 'sos-border-style';
  s.textContent = `
    @keyframes sosBorderPulse {
      0%,100% { border-left-color: #EF4444; }
      50%      { border-left-color: rgba(239,68,68,0.3); }
    }
  `;
  document.head.appendChild(s);
})();
