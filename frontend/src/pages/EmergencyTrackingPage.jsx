import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Phone, ArrowLeft, Loader2, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import socket from '../lib/socket';
import { ambulanceIcon, hospitalIcon, patientIcon } from '../components/leafletIcons';
import { fetchRoute, haversineDistance } from '../services/osrmService';
import DirectionsModal from '../components/DirectionsModal';

// Smoothly re-center map when ambulance moves
function MapFly({ center }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (!center) return;
    if (first.current) { map.setView(center, 14); first.current = false; }
    else map.flyTo(center, map.getZoom(), { duration: 1.2 });
  }, [center, map]);
  return null;
}

const STATUS_CONFIG = {
  requested:    { color: '#DC2626', bg: 'rgba(220,38,38,0.1)',  border: 'rgba(220,38,38,0.25)',  pulse: true,  label: '🔴 Sending emergency alert...' },
  acknowledged: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', pulse: false, label: '🟡 Hospital acknowledged. Dispatching...' },
  dispatched:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', pulse: true,  label: '🚑 Ambulance is on the way!' },
  arrived:      { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', pulse: false, label: '✅ Ambulance has arrived!' },
  completed:    { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', pulse: false, label: '✅ You have been assisted. Stay safe.' },
  cancelled:    { color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', pulse: false, label: '❌ Request cancelled.' },
};

export default function EmergencyTrackingPage() {
  const { requestId } = useParams();
  const [request,          setRequest]          = useState(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);
  const [routeCoords,      setRouteCoords]      = useState([]);
  const [eta,              setEta]              = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [showDirections,   setShowDirections]   = useState(false);
  const prevLocRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    api.get(`/emergency/requests/${requestId}/track`)
      .then(r => {
        const d = r.data.data;
        setRequest(d);
        if (d.ambulanceLocation?.lat) {
          setAmbulanceLocation(d.ambulanceLocation);
          if (d.patientLocation?.lat) {
            fetchRoute(d.ambulanceLocation.lat, d.ambulanceLocation.lng, d.patientLocation.lat, d.patientLocation.lng)
              .then(result => { if (result) { setRouteCoords(result.coordinates); setEta(result.durationMin); } });
          }
        }
      })
      .catch(() => toast.error('Failed to load tracking info'))
      .finally(() => setLoading(false));
  }, [requestId]);

  // Socket: join rooms + listen
  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.emit('join:emergency', requestId);

    const onStatus = (data) => {
      if (data.requestId?.toString() !== requestId) return;
      setRequest(prev => prev ? { ...prev, status: data.status } : prev);
      if (data.status === 'dispatched') toast.success('🚑 Ambulance dispatched!');
      if (data.status === 'arrived')    toast.success('✅ Ambulance has arrived!');
    };

    const onDispatched = (data) => {
      setRequest(prev => prev ? { ...prev, status: 'dispatched', ambulance: data } : prev);
      socket.emit('join:ambulance', data.ambulanceId);
      toast.success('🚑 Ambulance is on the way!');
    };

    const onLocation = async (data) => {
      const newLoc = { lat: data.lat, lng: data.lng };
      setAmbulanceLocation(newLoc);

      const prev = prevLocRef.current;
      const moved = prev ? haversineDistance(prev.lat, prev.lng, newLoc.lat, newLoc.lng) : Infinity;

      if (moved > 50) {
        setRequest(prev => {
          if (!prev?.patientLocation?.lat) return prev;
          fetchRoute(newLoc.lat, newLoc.lng, prev.patientLocation.lat, prev.patientLocation.lng)
            .then(result => { if (result) { setRouteCoords(result.coordinates); setEta(result.durationMin); } });
          return prev;
        });
      }
      prevLocRef.current = newLoc;
    };

    socket.on('emergency:status:updated', onStatus);
    socket.on('emergency:dispatched',     onDispatched);
    socket.on('ambulance:location:updated', onLocation);

    // If already dispatched, join ambulance room
    if (request?.ambulance?._id) socket.emit('join:ambulance', request.ambulance._id);

    return () => {
      socket.off('emergency:status:updated', onStatus);
      socket.off('emergency:dispatched',     onDispatched);
      socket.off('ambulance:location:updated', onLocation);
    };
  }, [requestId, request?.ambulance?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0F19' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: '#DC2626' }} />
          <p className="text-sm" style={{ color: '#64748B' }}>Loading emergency tracking...</p>
        </div>
      </div>
    );
  }

  const status     = request?.status || 'requested';
  const cfg        = STATUS_CONFIG[status] || STATUS_CONFIG.requested;
  const pLat       = request?.patientLocation?.lat;
  const pLng       = request?.patientLocation?.lng;
  const mapCenter  = ambulanceLocation
    ? [ambulanceLocation.lat, ambulanceLocation.lng]
    : pLat ? [pLat, pLng] : [20.5937, 78.9629];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B0F19' }}>

      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: '#0D1117', borderBottom: '1px solid #1E293B' }}>
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors" style={{ color: '#64748B' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-sm font-semibold text-white">Emergency Tracking</p>
          <p className="text-xs" style={{ color: '#475569' }}>Request #{requestId?.slice(-6).toUpperCase()}</p>
        </div>
      </header>

      {/* Status bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}
      >
        {cfg.pulse && <span className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse" style={{ background: cfg.color }} />}
        {!cfg.pulse && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />}
        <p className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
        {eta && status === 'dispatched' && (
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
            ETA ~{eta} min
          </span>
        )}
      </div>

      {/* Map */}
      <div style={{ height: '380px', flexShrink: 0 }}>
        <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          />
          {pLat && (
            <Marker position={[pLat, pLng]} icon={patientIcon}>
              <Popup>📍 Your location</Popup>
            </Marker>
          )}
          {ambulanceLocation && (
            <>
              <Marker position={[ambulanceLocation.lat, ambulanceLocation.lng]} icon={ambulanceIcon}>
                <Popup>🚑 Ambulance en route</Popup>
              </Marker>
              <MapFly center={[ambulanceLocation.lat, ambulanceLocation.lng]} />
            </>
          )}
          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} color="#DC2626" weight={4} opacity={0.85} dashArray="8,5" />
          )}
        </MapContainer>
      </div>

      {/* Info card */}
      <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto">
        {request?.ambulance ? (
          <div className="rounded-2xl p-4" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#475569' }}>Ambulance Details</p>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-bold text-white">{request.ambulance.vehicleNumber}</p>
                <p className="text-sm" style={{ color: '#94A3B8' }}>Driver: {request.ambulance.driverName || 'N/A'}</p>
              </div>
              {request.ambulance.driverPhone && (
                <a
                  href={`tel:${request.ambulance.driverPhone}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: '#16A34A' }}
                >
                  <Phone size={15} /> Call Driver
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 text-center" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
            <p className="text-sm" style={{ color: '#64748B' }}>Waiting for ambulance to be dispatched...</p>
          </div>
        )}

        {/* Directions button */}
        <button
          onClick={() => setShowDirections(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.1)'; e.currentTarget.style.color = '#60A5FA'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#94A3B8'; }}
        >
          <Navigation size={15} /> Get Walking Directions to Hospital
        </button>

        <Link to="/history" className="block text-center text-xs" style={{ color: '#475569' }}>
          View all my tokens →
        </Link>
      </div>

      <DirectionsModal
        isOpen={showDirections}
        onClose={() => setShowDirections(false)}
        hospital={request?.hospital}
      />
    </div>
  );
}
