/**
 * RequestForm.jsx
 * ───────────────
 * STATE A — patient fills in emergency details and submits.
 * GPS captured once via getCurrentPosition (not watchPosition).
 * Nominatim reverse-geocode called once on GPS capture.
 * Double-submit prevented by disabling button on first click.
 */

import React, { useState, useCallback, memo } from 'react';
import { AlertTriangle, MapPin, Loader2, Navigation } from 'lucide-react';

const EMERGENCY_TYPES = [
  { value: 'medical',  label: '🏥 Medical Emergency', desc: 'Heart attack, stroke, breathing issues' },
  { value: 'accident', label: '🚗 Accident',           desc: 'Road accident, fall, trauma' },
  { value: 'transfer', label: '🔄 Transfer',           desc: 'Hospital-to-hospital transfer' },
  { value: 'other',    label: '🆘 Other',              desc: 'Any other emergency' },
];

const RequestForm = ({ onSubmit, submitting }) => {
  const [emergencyType, setEmergencyType] = useState('medical');
  const [notes,         setNotes]         = useState('');
  const [location,      setLocation]      = useState(null);   // { lat, lng }
  const [address,       setAddress]       = useState('');     // display label
  const [manualAddress, setManualAddress] = useState('');     // fallback text input
  const [gpsLoading,    setGpsLoading]    = useState(false);
  const [gpsError,      setGpsError]      = useState(false);

  const captureGPS = useCallback(async () => {
    if (!navigator.geolocation) { setGpsError(true); return; }
    setGpsLoading(true);
    setGpsError(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });

        // Reverse geocode — called once only
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          setAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setGpsLoading(false);
      },
      () => {
        setGpsError(true);
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  const handleSubmit = useCallback(() => {
    const patientLocation = location
      ? { lat: location.lat, lng: location.lng, address: address || manualAddress }
      : { address: manualAddress };

    onSubmit({ emergencyType, notes, patientLocation });
  }, [location, address, manualAddress, emergencyType, notes, onSubmit]);

  const canSubmit = !submitting && (location || manualAddress.trim().length > 3);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0B0F19' }}>

      {/* Header */}
      <div
        className="px-5 pt-10 pb-6 text-center"
        style={{ background: 'linear-gradient(180deg, rgba(220,38,38,0.12) 0%, transparent 100%)' }}
      >
        <div
          className="inline-flex h-20 w-20 items-center justify-center rounded-3xl text-4xl mb-4"
          style={{
            background:  'rgba(220,38,38,0.15)',
            border:      '2px solid rgba(220,38,38,0.3)',
            animation:   'emergencyPulse 2s ease-in-out infinite',
          }}
        >
          🚨
        </div>
        <h1 className="text-2xl font-black text-white">Request Ambulance</h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
          Fill in the details below. Help will be dispatched immediately.
        </p>
      </div>

      <div className="flex-1 px-5 pb-8 space-y-5 overflow-y-auto">

        {/* Emergency type */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>
            Emergency Type
          </p>
          <div className="grid grid-cols-2 gap-2">
            {EMERGENCY_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setEmergencyType(t.value)}
                className="text-left rounded-2xl p-3 transition-all"
                style={{
                  background: emergencyType === t.value ? 'rgba(220,38,38,0.15)' : '#0D1117',
                  border:     `1px solid ${emergencyType === t.value ? 'rgba(220,38,38,0.4)' : '#1E293B'}`,
                }}
              >
                <p className="text-sm font-bold text-white">{t.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>
            Your Location
          </p>

          {location ? (
            <div
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <MapPin size={18} style={{ color: '#10B981', flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Location captured</p>
                <p className="text-xs mt-0.5 break-words" style={{ color: '#64748B' }}>{address}</p>
              </div>
              <button
                onClick={() => { setLocation(null); setAddress(''); }}
                className="text-xs shrink-0"
                style={{ color: '#64748B' }}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={captureGPS}
                disabled={gpsLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(59,130,246,0.1)',
                  border:     '1px solid rgba(59,130,246,0.25)',
                  color:      '#3B82F6',
                  opacity:    gpsLoading ? 0.7 : 1,
                }}
              >
                {gpsLoading
                  ? <><Loader2 size={16} className="animate-spin" /> Getting location...</>
                  : <><Navigation size={16} /> Use My Current Location</>
                }
              </button>

              {gpsError && (
                <p className="text-xs text-center" style={{ color: '#F59E0B' }}>
                  GPS denied — enter your address below
                </p>
              )}

              <div className="relative">
                <input
                  type="text"
                  placeholder="Or enter address manually (floor, building, street...)"
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-slate-600 outline-none"
                  style={{ background: '#0D1117', border: '1px solid #1E293B', fontSize: '16px' }}
                  onFocus={e => e.target.style.border = '1px solid #3B82F6'}
                  onBlur={e => e.target.style.border = '1px solid #1E293B'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>
            Additional Notes <span style={{ color: '#334155' }}>(optional)</span>
          </p>
          <textarea
            placeholder="Symptoms, floor number, gate number, special instructions..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-slate-600 outline-none resize-none"
            style={{ background: '#0D1117', border: '1px solid #1E293B', fontSize: '16px' }}
            onFocus={e => e.target.style.border = '1px solid #3B82F6'}
            onBlur={e => e.target.style.border = '1px solid #1E293B'}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-black text-white transition-all active:scale-[0.97]"
          style={{
            background:  canSubmit ? '#DC2626' : '#1E293B',
            color:       canSubmit ? '#fff' : '#475569',
            boxShadow:   canSubmit ? '0 0 0 0 rgba(220,38,38,0.4)' : 'none',
            animation:   canSubmit ? 'emergencyPulse 2s ease-in-out infinite' : 'none',
            cursor:      canSubmit ? 'pointer' : 'not-allowed',
            fontSize:    '18px',
          }}
        >
          {submitting ? (
            <><Loader2 size={22} className="animate-spin" /> Sending Alert...</>
          ) : (
            <><AlertTriangle size={22} /> Send Emergency Request</>
          )}
        </button>

        {!location && !manualAddress && (
          <p className="text-xs text-center" style={{ color: '#475569' }}>
            Please share your location or enter an address to continue
          </p>
        )}
      </div>

      <style>{`
        @keyframes emergencyPulse {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
          70%  { box-shadow: 0 0 0 14px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  );
};

export default memo(RequestForm);
