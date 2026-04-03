/**
 * SOSModal.jsx
 * ────────────
 * Nearest-hospital confirmation modal with 3-second countdown.
 *
 * States (internal):
 *   detecting   → spinner "Detecting your location..."
 *   confirm     → show nearest hospital + Send button
 *   countdown   → 3…2…1 before firing
 *   sending     → API in flight
 *   error       → GPS / API error with retry / fallback
 *
 * Props:
 *   isOpen   — boolean
 *   onClose  — () => void
 */

import React, {
  useState, useEffect, useRef, useCallback, memo,
} from 'react';
import { X, MapPin, Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useNearestHospital } from '../../hooks/useNearestHospital';
import { HospitalService } from '../../features/hospital/HospitalService';

// ── Distance formatter ────────────────────────────────────────────────────────
const fmtDist = (km) => {
  if (km == null || isNaN(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
};

// ── GPS error messages ────────────────────────────────────────────────────────
const gpsMsg = (code) => {
  if (code === 1) return 'Location access denied. Please enable GPS in your browser settings.';
  if (code === 2) return 'Unable to get your location. Please try again.';
  if (code === 3) return 'Location timed out. Check your GPS signal and try again.';
  return 'Could not get your location. Please try again.';
};

const SOSModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { findNearest } = useNearestHospital();

  // ── state machine ─────────────────────────────────────────────────────────
  const [phase,        setPhase]        = useState('detecting'); // detecting|confirm|countdown|sending|error
  const [nearest,      setNearest]      = useState(null);        // { hospital, distanceKm, patientLat, patientLng }
  const [errorMsg,     setErrorMsg]     = useState('');
  const [gpsErrorCode, setGpsErrorCode] = useState(null);        // 1|2|3
  const [countdown,    setCountdown]    = useState(null);
  const [allHospitals, setAllHospitals] = useState([]);
  const [fallbackId,   setFallbackId]   = useState('');          // manual hospital select
  const [patientCoords,setPatientCoords]= useState(null);        // { lat, lng } from GPS

  const countdownRef = useRef(null);
  const didDetect    = useRef(false);

  // ── cleanup countdown on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ── run detection when modal opens ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || didDetect.current) return;
    didDetect.current = true;
    setPhase('detecting');
    setNearest(null);
    setErrorMsg('');
    setGpsErrorCode(null);
    setCountdown(null);

    findNearest()
      .then(result => {
        if (!result) {
          // No hospitals with coords — load full list for fallback dropdown
          return HospitalService.getHospitals().then(list => {
            setAllHospitals(list);
            setErrorMsg('Cannot auto-detect nearest hospital — no GPS coordinates set for any hospital. Please select one manually.');
            setPhase('error');
          });
        }
        setNearest(result);
        setPatientCoords({ lat: result.patientLat, lng: result.patientLng });
        setAllHospitals(result.allHospitals || []);
        setPhase('confirm');
      })
      .catch(err => {
        const code = err?.code; // GeolocationPositionError code
        setGpsErrorCode(code || null);
        setErrorMsg(gpsMsg(code));
        // Load hospitals for fallback dropdown
        HospitalService.getHospitals()
          .then(list => setAllHospitals(list))
          .catch(() => {});
        setPhase('error');
      });
  }, [isOpen, findNearest]);

  // ── reset when closed ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      didDetect.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(null);
      setPhase('detecting');
    }
  }, [isOpen]);

  // ── countdown logic ───────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    setCountdown(3);
    setPhase('countdown');
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    setPhase('confirm');
  }, []);

  // ── fire request ──────────────────────────────────────────────────────────
  const fireRequest = useCallback(async (hospitalId, lat, lng) => {
    setPhase('sending');
    try {
      const res = await api.post('/emergency/request', {
        hospitalId,
        emergencyType:   'medical',
        source:          'quick_access_sos',
        patientLocation: lat ? { lat, lng } : {},
        notes:           'Quick Access SOS — auto-nearest hospital',
      });
      const requestId = res.data.data.request._id;
      toast.success('🚨 Emergency request sent! Help is on the way.');
      onClose();
      navigate(`/emergency/${requestId}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send emergency request. Please try again.');
      setPhase('error');
    }
  }, [navigate, onClose]);

  // Watch countdown reaching null after interval fires
  useEffect(() => {
    if (phase === 'countdown' && countdown === null && !countdownRef.current) {
      // Countdown finished naturally — fire
      const hId  = nearest?.hospital?._id;
      const lat  = patientCoords?.lat;
      const lng  = patientCoords?.lng;
      if (hId) fireRequest(hId, lat, lng);
    }
  }, [countdown, phase, nearest, patientCoords, fireRequest]);

  // ── handle fallback manual dispatch ──────────────────────────────────────
  const handleFallbackSend = useCallback(() => {
    const hId = fallbackId || allHospitals[0]?._id;
    if (!hId) { toast.error('Please select a hospital'); return; }
    fireRequest(hId, patientCoords?.lat, patientCoords?.lng);
  }, [fallbackId, allHospitals, patientCoords, fireRequest]);

  if (!isOpen) return null;

  const hospital = nearest?.hospital;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:     'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        isolation:      'isolate',   // prevents z-index leakage from map layers
      }}
      onClick={e => e.target === e.currentTarget && phase !== 'sending' && onClose()}
    >
      {/* Modal card */}
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth:   '400px',
          background: '#0D1117',
          border:     '1px solid rgba(220,38,38,0.3)',
          boxShadow:  '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #1E293B' }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl text-lg"
              style={{ background: 'rgba(220,38,38,0.15)' }}
            >
              🚨
            </span>
            <p className="text-sm font-bold text-white">Emergency Ambulance Request</p>
          </div>
          {phase !== 'sending' && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: '#64748B' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-6 space-y-5">

          {/* ── DETECTING ─────────────────────────────────────────────── */}
          {phase === 'detecting' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Loader2 size={32} className="animate-spin" style={{ color: '#EF4444' }} />
              <p className="text-sm font-semibold text-white">Detecting your location...</p>
              <p className="text-xs" style={{ color: '#475569' }}>
                Finding the nearest hospital to you
              </p>
            </div>
          )}

          {/* ── CONFIRM ───────────────────────────────────────────────── */}
          {phase === 'confirm' && hospital && (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>
                  Nearest hospital detected
                </p>
                <div
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{ background: '#0F172A', border: '1px solid #1E293B' }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ background: 'rgba(59,130,246,0.12)' }}
                  >
                    🏥
                  </div>
                  <div>
                    <p className="text-base font-black text-white">{hospital.name}</p>
                    <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: '#10B981' }}>
                      <MapPin size={13} />
                      {fmtDist(nearest.distanceKm)}
                    </p>
                    {hospital.location && (
                      <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{hospital.location}</p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm" style={{ color: '#94A3B8' }}>
                Your location has been captured. An ambulance will be dispatched from{' '}
                <span className="font-bold text-white">{hospital.name}</span> to your location.
              </p>

              <button
                onClick={startCountdown}
                className="w-full py-4 rounded-2xl text-base font-black text-white transition-all active:scale-[0.97]"
                style={{
                  background: '#DC2626',
                  boxShadow:  '0 4px 20px rgba(220,38,38,0.35)',
                  fontSize:   '16px',
                }}
              >
                🚑 Send Emergency Request
              </button>
            </>
          )}

          {/* ── COUNTDOWN ─────────────────────────────────────────────── */}
          {phase === 'countdown' && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              {hospital && (
                <p className="text-sm font-semibold text-white">
                  Sending to <span style={{ color: '#EF4444' }}>{hospital.name}</span>
                </p>
              )}

              <div
                className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                  background: 'rgba(220,38,38,0.12)',
                  border:     '3px solid rgba(220,38,38,0.4)',
                }}
              >
                <span
                  className="font-black tabular-nums"
                  style={{ fontSize: '3rem', color: '#EF4444', lineHeight: 1 }}
                >
                  {countdown}
                </span>
              </div>

              <p className="text-sm font-semibold text-white">
                Sending in {countdown}...
              </p>

              <button
                onClick={cancelCountdown}
                className="text-sm font-semibold transition-colors"
                style={{ color: '#64748B' }}
                onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
              >
                Cancel
              </button>
            </div>
          )}

          {/* ── SENDING ───────────────────────────────────────────────── */}
          {phase === 'sending' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Loader2 size={32} className="animate-spin" style={{ color: '#EF4444' }} />
              <p className="text-sm font-semibold text-white">Sending emergency request...</p>
            </div>
          )}

          {/* ── ERROR ─────────────────────────────────────────────────── */}
          {phase === 'error' && (
            <>
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <AlertTriangle size={16} style={{ color: '#F59E0B', marginTop: 2, flexShrink: 0 }} />
                <p className="text-sm" style={{ color: '#F59E0B' }}>{errorMsg}</p>
              </div>

              {/* Fallback: manual hospital selector */}
              {allHospitals.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
                    Select hospital manually
                  </p>
                  <div className="relative">
                    <Building2
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#475569' }}
                    />
                    <select
                      value={fallbackId}
                      onChange={e => setFallbackId(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none"
                      style={{ background: '#0F172A', border: '1px solid #1E293B' }}
                      onFocus={e => e.target.style.border = '1px solid #3B82F6'}
                      onBlur={e => e.target.style.border = '1px solid #1E293B'}
                    >
                      <option value="" style={{ background: '#0D1117' }}>— Choose a hospital —</option>
                      {allHospitals.map(h => (
                        <option key={h._id} value={h._id} style={{ background: '#0D1117' }}>
                          {h.name}{h.location ? ` · ${h.location}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleFallbackSend}
                    disabled={!fallbackId}
                    className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all active:scale-[0.97]"
                    style={{
                      background: fallbackId ? '#DC2626' : '#1E293B',
                      color:      fallbackId ? '#fff'    : '#475569',
                      cursor:     fallbackId ? 'pointer' : 'not-allowed',
                      fontSize:   '15px',
                    }}
                  >
                    🚑 Send Emergency Request
                  </button>
                </div>
              )}

              {/* Retry GPS button (only for GPS errors, not "no coords" error) */}
              {gpsErrorCode && (
                <button
                  onClick={() => {
                    didDetect.current = false;
                    setPhase('detecting');
                    setErrorMsg('');
                    setGpsErrorCode(null);
                    // Re-trigger detection
                    findNearest()
                      .then(result => {
                        if (!result) {
                          setErrorMsg('Cannot auto-detect — no hospital GPS coordinates set.');
                          setPhase('error');
                          return;
                        }
                        setNearest(result);
                        setPatientCoords({ lat: result.patientLat, lng: result.patientLng });
                        setAllHospitals(result.allHospitals || []);
                        setPhase('confirm');
                      })
                      .catch(err => {
                        setGpsErrorCode(err?.code || null);
                        setErrorMsg(gpsMsg(err?.code));
                        setPhase('error');
                      });
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
                >
                  Retry Location Detection
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer cancel — always visible except during sending */}
        {phase !== 'sending' && phase !== 'countdown' && (
          <div
            className="px-5 pb-5"
            style={{ borderTop: phase === 'error' ? 'none' : '1px solid #1E293B', paddingTop: phase === 'error' ? 0 : '16px' }}
          >
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(SOSModal);
