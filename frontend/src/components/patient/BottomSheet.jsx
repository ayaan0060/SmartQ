/**
 * BottomSheet.jsx
 * ───────────────
 * Uber-style slide-up card shown during live tracking (STATE C).
 * Shows ambulance info, ETA, distance, status, call driver, cancel.
 */

import React, { memo } from 'react';
import { Phone, X, AlertTriangle } from 'lucide-react';

const STATUS_LABELS = {
  dispatched: { label: 'On the way',  color: '#3B82F6', pulse: true  },
  en_route:   { label: 'En route',    color: '#3B82F6', pulse: true  },
  arriving:   { label: 'Arriving',    color: '#10B981', pulse: true  },
  arrived:    { label: 'Arrived',     color: '#10B981', pulse: false },
};

const BottomSheet = ({ ambulance, eta, status, onCancel, cancelling }) => {
  const cfg = STATUS_LABELS[status] || STATUS_LABELS.dispatched;

  // Cancel disabled once ambulance is en_route or closer
  const canCancel = status === 'dispatched';

  return (
    <div
      className="absolute bottom-0 left-0 right-0 rounded-t-3xl px-5 pt-4 pb-8"
      style={{
        background:  '#0D1117',
        border:      '1px solid #1E293B',
        borderBottom: 'none',
        boxShadow:   '0 -20px 60px rgba(0,0,0,0.6)',
        animation:   'slideUp 300ms cubic-bezier(0.4,0,0.2,1)',
        zIndex:      10,
      }}
    >
      {/* Drag handle */}
      <div className="flex justify-center mb-4">
        <div className="h-1 w-10 rounded-full" style={{ background: '#334155' }} />
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mb-4">
        {cfg.pulse && (
          <span
            className="h-2.5 w-2.5 rounded-full animate-pulse shrink-0"
            style={{ background: cfg.color }}
          />
        )}
        {!cfg.pulse && (
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
        )}
        <span className="text-base font-black" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
        {eta && (
          <span
            className="ml-auto text-sm font-black px-3 py-1 rounded-full"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#60A5FA' }}
          >
            ~{eta.etaMin} min · {eta.distKm} km
          </span>
        )}
      </div>

      {/* Ambulance info */}
      {ambulance && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl p-4 mb-4"
          style={{ background: '#0F172A', border: '1px solid #1E293B' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ background: 'rgba(220,38,38,0.12)' }}
            >
              🚑
            </div>
            <div>
              <p className="text-base font-black text-white">{ambulance.vehicleNumber}</p>
              <p className="text-sm" style={{ color: '#64748B' }}>
                {ambulance.driverName || 'Driver assigned'}
              </p>
            </div>
          </div>

          {ambulance.driverPhone && (
            <a
              href={`tel:${ambulance.driverPhone}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
              style={{ background: '#16A34A', minHeight: '44px' }}
              aria-label="Call driver"
            >
              <Phone size={16} /> Call
            </a>
          )}
        </div>
      )}

      {/* Cancel button */}
      {canCancel ? (
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all"
          style={{
            background: '#1E293B',
            color:      '#94A3B8',
            border:     '1px solid #334155',
            opacity:    cancelling ? 0.6 : 1,
          }}
        >
          <X size={15} />
          {cancelling ? 'Cancelling...' : 'Cancel Request'}
        </button>
      ) : (
        <div
          className="flex items-center gap-2 justify-center py-2 rounded-xl text-xs"
          style={{ color: '#475569' }}
        >
          <AlertTriangle size={13} />
          Cannot cancel — ambulance is already on the way
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default memo(BottomSheet);
