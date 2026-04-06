import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import SOSModal from './home/SOSModal';

export default function EmergencyButton() {
  const [sosOpen, setSosOpen] = useState(false);

  return (
    <>
      {/* Emergency banner card — visual unchanged, onClick now uses SOSModal */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}
      >
        <div className="flex items-center gap-4 flex-1">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ background: 'rgba(220,38,38,0.15)' }}
          >
            🚑
          </div>
          <div>
            <p className="text-sm font-bold text-white">Medical Emergency?</p>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
              Request an ambulance immediately. We'll dispatch help right away.
            </p>
          </div>
        </div>

        <button
          onClick={() => setSosOpen(true)}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-[0.97]"
          style={{
            background:  '#DC2626',
            boxShadow:   '0 0 0 0 rgba(220,38,38,0.4)',
            animation:   'emergencyPulse 2s ease-in-out infinite',
            minHeight:   '44px',
          }}
        >
          <AlertTriangle size={16} />
          Request Ambulance
        </button>
      </div>

      {/* SOSModal — nearest-hospital auto-detection flow */}
      <SOSModal isOpen={sosOpen} onClose={() => setSosOpen(false)} />

      {/* Pulse keyframe */}
      <style>{`
        @keyframes emergencyPulse {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
          70%  { box-shadow: 0 0 0 12px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
        @keyframes mapPulse {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
          70%  { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
      `}</style>
    </>
  );
}
