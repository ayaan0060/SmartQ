/**
 * LiveTrackingMap.jsx
 * ───────────────────
 * STATE C — full-screen Leaflet map with:
 *   - Patient marker (static blue pin)
 *   - Ambulance marker (live, updates via socket)
 *   - OSRM route polyline (refetched every 100m of ambulance movement)
 *   - Auto-fit bounds to show both markers
 *   - BottomSheet overlay (Uber-style ETA card)
 *
 * All leaflet imports are here — loaded via React.lazy from AmbulancePage.
 */

import React, { useEffect, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BottomSheet from './BottomSheet';

// ── Fix Leaflet default icons (CDN — no Vite asset pipeline issues) ───────────
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom icons ──────────────────────────────────────────────────────────────
const makeIcon = (emoji, bg, pulse = false) =>
  new L.DivIcon({
    html: `<div style="
      background:${bg};width:44px;height:44px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:22px;border:3px solid white;
      box-shadow:0 2px 10px rgba(0,0,0,0.4);
      ${pulse ? 'animation:markerPulse 1.5s ease-in-out infinite;' : ''}
    ">${emoji}</div>`,
    className:   '',
    iconSize:    [44, 44],
    iconAnchor:  [22, 22],
    popupAnchor: [0, -24],
  });

const PATIENT_ICON    = makeIcon('📍', '#2563EB', true);
const AMBULANCE_ICON  = makeIcon('🚑', '#DC2626');

// ── FitBounds helper ──────────────────────────────────────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [60, 60] });
    }
  }, [map, positions]);
  return null;
}

// ── LiveTrackingMap ───────────────────────────────────────────────────────────
const LiveTrackingMap = ({
  patientLocation,
  ambulanceLocation,
  routeCoords,
  eta,
  status,
  ambulance,
  onCancel,
  cancelling,
  mapKey,
}) => {
  const pLat = patientLocation?.lat;
  const pLng = patientLocation?.lng;
  const aLat = ambulanceLocation?.lat;
  const aLng = ambulanceLocation?.lng;

  const center = aLat ? [aLat, aLng] : pLat ? [pLat, pLng] : [20.5937, 78.9629];

  const boundsPositions = [
    ...(pLat ? [[pLat, pLng]] : []),
    ...(aLat ? [[aLat, aLng]] : []),
  ];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        />

        {/* Patient marker */}
        {pLat && (
          <Marker position={[pLat, pLng]} icon={PATIENT_ICON}>
            <Popup>📍 Your location</Popup>
          </Marker>
        )}

        {/* Ambulance marker */}
        {aLat && (
          <Marker position={[aLat, aLng]} icon={AMBULANCE_ICON}>
            <Popup>🚑 {ambulance?.vehicleNumber || 'Ambulance'}</Popup>
          </Marker>
        )}

        {/* OSRM route polyline */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            color="#DC2626"
            weight={4}
            opacity={0.85}
            dashArray="8,5"
          />
        )}

        {/* Auto-fit bounds */}
        {boundsPositions.length >= 2 && <FitBounds positions={boundsPositions} />}
      </MapContainer>

      {/* Uber-style bottom sheet overlaid on map */}
      <BottomSheet
        ambulance={ambulance}
        eta={eta}
        status={status}
        onCancel={onCancel}
        cancelling={cancelling}
      />

      <style>{`
        @keyframes markerPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.5); }
          50%       { box-shadow: 0 0 0 10px rgba(37,99,235,0); }
        }
      `}</style>
    </div>
  );
};

export default memo(LiveTrackingMap);
