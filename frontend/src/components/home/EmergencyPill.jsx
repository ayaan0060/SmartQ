/**
 * EmergencyPill.jsx
 * ─────────────────
 * Red SOS pill for the Quick Access strip.
 * Matches the exact style of QuickStrip pills (same border-radius, padding, font).
 * Renders as a <button> (not a Link) since it triggers a modal, not navigation.
 * Debounced — ignores second tap if modal is already open.
 *
 * Props:
 *   onClick — () => void  (opens SOSModal)
 *   disabled — boolean    (true while modal is already open)
 */

import React, { memo } from 'react';
import { Siren } from 'lucide-react';

const EmergencyPill = ({ onClick, disabled }) => (
  <>
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label="Emergency ambulance request"
      className="flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
      style={{
        background:  'rgba(220,38,38,0.15)',
        border:      '1px solid rgba(220,38,38,0.4)',
        color:       '#EF4444',
        cursor:      disabled ? 'not-allowed' : 'pointer',
        opacity:     disabled ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(220,38,38,0.25)'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; }}
    >
      {/* Pulsing icon — only the icon animates, not the pill */}
      <span style={{ animation: 'sosPulse 1.8s ease-in-out infinite', display: 'inline-flex' }}>
        <Siren size={14} />
      </span>
      Emergency
    </button>

    <style>{`
      @keyframes sosPulse {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.45; }
      }
    `}</style>
  </>
);

export default memo(EmergencyPill);
