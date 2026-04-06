/**
 * DirectionsModal.jsx
 * ───────────────────
 * Full-screen walking directions modal.
 *
 * Features:
 *  • Lazy-loads DirectionsMap (all leaflet code) via React.lazy + Suspense
 *  • Fetches walking route from OSRM with AbortController
 *  • Voice turn-by-turn navigation via useVoiceNavigation
 *  • Graceful degraded UI when OSRM fails (map still renders with markers)
 *  • All GPS watches + speech cancelled on close or unmount
 *
 * Props:
 *   isOpen    — boolean
 *   onClose   — () => void
 *   hospital  — { _id, name, coordinates: { lat, lng } }
 *   userLocation — { lat, lng } | null  (passed from parent, already fetched)
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
  memo,
} from 'react';
import {
  X,
  Navigation,
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';
import { fetchWalkingRoute } from '../services/osrmService';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';

// ── Lazy-load ALL leaflet code — never statically imported ────────────────────
const DirectionsMap = lazy(() => import('./DirectionsMap'));

// ── MapFallback shown while DirectionsMap chunk loads ─────────────────────────
const MapFallback = () => (
  <div
    className="flex h-full w-full items-center justify-center"
    style={{ background: '#0D1117' }}
  >
    <Loader2 size={28} className="animate-spin" style={{ color: '#3B82F6' }} />
  </div>
);

// ── DirectionsModal ───────────────────────────────────────────────────────────
const DirectionsModal = ({ isOpen, onClose, hospital, userLocation }) => {
  const [route,        setRoute]        = useState(null);   // OSRM result
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError,   setRouteError]   = useState(null);
  const [navActive,    setNavActive]    = useState(false);

  const voiceNav    = useVoiceNavigation();
  const fetchedRef  = useRef(false);  // prevent double-fetch in StrictMode

  const loadRoute = useCallback(() => {
    const hLat = hospital?.coordinates?.lat;
    const hLng = hospital?.coordinates?.lng;
    const hasCoords = hLat != null && hLng != null && !isNaN(hLat) && !isNaN(hLng);

    if (!userLocation || !hasCoords) return;

    fetchedRef.current = true;
    setRouteLoading(true);
    setRouteError(null);

    fetchWalkingRoute(userLocation.lat, userLocation.lng, hLat, hLng)
      .then(result => {
        if (result) setRoute(result);
        else setRouteError('Route unavailable — showing map with markers only.');
      })
      .catch(() => {
        setRouteError('Route unavailable — showing map with markers only.');
      })
      .finally(() => setRouteLoading(false));
  }, [userLocation, hospital]);

  // ── Fetch route when modal opens ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !fetchedRef.current) {
      setTimeout(loadRoute, 0);
    }
  }, [isOpen, loadRoute]);

  // ── Reset state when modal closes ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        fetchedRef.current = false;
        setRoute(null);
        setRouteError(null);
        setRouteLoading(false);
        setNavActive(false);
      }, 0);
    }
  }, [isOpen]);

  // ── Cleanup voice + GPS on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      voiceNav.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    voiceNav.stop();
    setNavActive(false);
    onClose();
  }, [voiceNav, onClose]);

  const handleStartNav = useCallback(() => {
    if (!route?.steps?.length) return;
    voiceNav.start(route.steps, hospital?.name);
    setNavActive(true);
  }, [voiceNav, route, hospital]);

  const handleStopNav = useCallback(() => {
    voiceNav.stop();
    setNavActive(false);
  }, [voiceNav]);

  if (!isOpen) return null;

  const hLat = hospital?.coordinates?.lat;
  const hLng = hospital?.coordinates?.lng;
  const hasHospitalCoords =
    hLat != null && hLng != null && !isNaN(hLat) && !isNaN(hLng);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Walking directions to ${hospital?.name}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background:  '#0D1117',
          border:      '1px solid #1E293B',
          maxHeight:   '92vh',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1E293B' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(37,99,235,0.15)' }}
            >
              <Navigation size={18} style={{ color: '#3B82F6' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                Walking to {hospital?.name}
              </p>
              {route && (
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                  {route.distance} km · ~{route.duration} min walk
                </p>
              )}
              {routeLoading && (
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                  Calculating route…
                </p>
              )}
            </div>
          </div>

          <button
            aria-label="Close directions modal"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
            style={{ color: '#64748B' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Map ────────────────────────────────────────────────────────── */}
        <div className="relative shrink-0" style={{ height: '320px' }}>
          {/* Loading overlay while OSRM fetches */}
          {routeLoading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ background: 'rgba(13,17,23,0.8)' }}
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin" style={{ color: '#3B82F6' }} />
                <p className="text-sm" style={{ color: '#64748B' }}>
                  Getting walking route…
                </p>
              </div>
            </div>
          )}

          {/* No location banner */}
          {!userLocation && !routeLoading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ background: '#0D1117' }}
            >
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <MapPin size={32} style={{ color: '#475569' }} />
                <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>
                  Enable location access to see walking directions.
                </p>
              </div>
            </div>
          )}

          {/* Map — key={hospital._id} forces remount on each modal open */}
          <Suspense fallback={<MapFallback />}>
            <DirectionsMap
              mapKey={hospital?._id}
              userLocation={userLocation}
              hospital={hospital}
              geometry={route?.geometry ?? null}
            />
          </Suspense>
        </div>

        {/* ── Body: error + voice controls + steps ───────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* OSRM error — degraded but working */}
          {routeError && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <AlertTriangle size={16} style={{ color: '#F59E0B', marginTop: 2, flexShrink: 0 }} />
              <p className="text-sm" style={{ color: '#F59E0B' }}>{routeError}</p>
            </div>
          )}

          {/* No hospital coords warning */}
          {!hasHospitalCoords && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <AlertTriangle size={16} style={{ color: '#F59E0B', marginTop: 2, flexShrink: 0 }} />
              <p className="text-sm" style={{ color: '#F59E0B' }}>
                Hospital coordinates not set. Contact admin to add GPS coordinates.
              </p>
            </div>
          )}

          {/* ── Voice navigation controls ─────────────────────────────── */}
          {voiceNav.isSupported && route?.steps?.length > 0 && (
            <div className="flex items-center gap-3">
              {!navActive ? (
                <button
                  aria-label="Start voice navigation"
                  onClick={handleStartNav}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    border:     '1px solid rgba(16,185,129,0.25)',
                    color:      '#10B981',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#10B981', e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.12)', e.currentTarget.style.color = '#10B981')}
                >
                  <Volume2 size={16} />
                  Start Voice Navigation
                </button>
              ) : (
                <button
                  aria-label="Stop voice navigation"
                  onClick={handleStopNav}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border:     '1px solid rgba(239,68,68,0.25)',
                    color:      '#EF4444',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EF4444', e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)', e.currentTarget.style.color = '#EF4444')}
                >
                  <VolumeX size={16} />
                  Stop Navigation
                </button>
              )}

              {navActive && (
                <span
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: '#10B981' }}
                >
                  <span
                    className="h-2 w-2 rounded-full animate-pulse"
                    style={{ background: '#10B981' }}
                  />
                  Navigating…
                </span>
              )}
            </div>
          )}

          {/* ── Turn-by-turn steps ────────────────────────────────────── */}
          {route?.steps?.length > 0 && (
            <div className="space-y-2">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: '#475569' }}
              >
                Turn-by-turn directions
              </p>

              {route.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: '#0F172A', border: '1px solid #1E293B' }}
                >
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                    style={{ background: '#1E293B', color: '#64748B' }}
                  >
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{step.instruction}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: '#475569' }}
                      >
                        <MapPin size={10} /> {step.distance}
                      </span>
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: '#475569' }}
                      >
                        <Clock size={10} /> {step.duration}
                      </span>
                    </div>
                  </div>

                  {i < route.steps.length - 1 && (
                    <ChevronRight
                      size={14}
                      style={{ color: '#334155', marginTop: 4, flexShrink: 0 }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state — location granted but no route yet */}
          {!routeLoading && !route && !routeError && userLocation && hasHospitalCoords && (
            <p className="text-sm text-center py-6" style={{ color: '#475569' }}>
              Fetching walking directions…
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(DirectionsModal);
