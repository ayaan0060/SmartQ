/**
 * WaitingScreen.jsx
 * ─────────────────
 * STATE B — shown after patient submits request, before admin dispatches.
 * Pulsing animation, request ID display, cancel button.
 */

import React, { memo } from 'react';
import { X, Loader2 } from 'lucide-react';

const WaitingScreen = ({ requestId, onCancel, cancelling }) => {
  const shortId = requestId
    ? `#REQ-${String(requestId).slice(-5).toUpperCase()}`
    : '—';

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ background: '#0B0F19' }}
    >
      {/* Pulsing ambulance */}
      <div className="relative mb-8">
        <div
          className="flex h-28 w-28 items-center justify-center rounded-full text-5xl"
          style={{
            background: 'rgba(220,38,38,0.12)',
            border:     '2px solid rgba(220,38,38,0.25)',
            animation:  'waitPulse 1.8s ease-in-out infinite',
          }}
        >
          🚑
        </div>
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border:    '2px solid rgba(220,38,38,0.15)',
            animation: 'waitRing 1.8s ease-in-out infinite',
          }}
        />
      </div>

      <h2 className="text-2xl font-black text-white mb-2">
        Connecting you to an ambulance...
      </h2>
      <p className="text-sm mb-6" style={{ color: '#64748B' }}>
        Admin is reviewing your request and assigning the nearest available ambulance.
      </p>

      {/* Request ID */}
      <div
        className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 mb-8"
        style={{ background: '#0D1117', border: '1px solid #1E293B' }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
          Request ID
        </span>
        <span className="text-base font-black text-white font-mono">{shortId}</span>
      </div>

      <p className="text-xs mb-8" style={{ color: '#334155' }}>
        Keep this page open. You'll be notified the moment an ambulance is dispatched.
      </p>

      {/* Cancel */}
      <button
        onClick={onCancel}
        disabled={cancelling}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: '#1E293B',
          color:      '#94A3B8',
          border:     '1px solid #334155',
          opacity:    cancelling ? 0.6 : 1,
        }}
      >
        {cancelling
          ? <><Loader2 size={14} className="animate-spin" /> Cancelling...</>
          : <><X size={14} /> Cancel Request</>
        }
      </button>

      <style>{`
        @keyframes waitPulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.06); opacity: 0.85; }
        }
        @keyframes waitRing {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default memo(WaitingScreen);
