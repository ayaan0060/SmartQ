/**
 * DirectionsMap.jsx
 * ─────────────────
 * Pure Leaflet map component. Contains ALL leaflet imports so it can be
 * safely lazy-loaded via React.lazy (Vite) or next/dynamic (Next.js).
 *
 * NEVER import this file directly at the top of a page/layout.
 * Always load it through:
 *   const DirectionsMap = React.lazy(() => import('./DirectionsMap'))
 *
 * Props:
 *   userLocation  — { lat, lng } | null
 *   hospital      — { name, coordinates: { lat, lng } }
 *   geometry      — [[lat, lng], ...] polyline from OSRM | null
 */

import React, { useEffect, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Fix broken default marker icons in Vite/webpack (CDN, no local asset import) ──
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom emoji DivIcons ─────────────────────────────────────────────────────
const makeIcon = (emoji, bg) =>
  new L.DivIcon({
    html: `<div style="
      background:${bg};width:40px;height:40px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:20px;border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    ">${emoji}</div>`,
    className:   '',
    iconSize:    [40, 40],
    iconAnchor:  [20, 20],
    popupAnchor: [0, -22],
  });

const PATIENT_ICON  = makeIcon('📍', '#16A34A');
const HOSPITAL_ICON = makeIcon('🏥', '#2563EB');

// ── FitBounds — auto-zooms map to show both markers ──────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [50, 50] });
    }
  }, [map, positions]);
  return null;
}

// ── DirectionsMap ─────────────────────────────────────────────────────────────
const DirectionsMap = memo(({ userLocation, hospital, geometry, mapKey }) => {
  const hLat = hospital?.coordinates?.lat;
  const hLng = hospital?.coordinates?.lng;
  const hasHospitalCoords = hLat != null && hLng != null && !isNaN(hLat) && !isNaN(hLng);

  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : hasHospitalCoords
      ? [hLat, hLng]
      : [20.5937, 78.9629]; // India fallback

  const boundsPositions = [
    ...(userLocation ? [[userLocation.lat, userLocation.lng]] : []),
    ...(hasHospitalCoords ? [[hLat, hLng]] : []),
  ];

  return (
    // key prop is set by the parent (DirectionsModal) to force remount on reopen
    // which prevents the "Map container already initialised" Leaflet error
    <MapContainer
      key={mapKey}
      center={center}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      zoomControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
      />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={PATIENT_ICON}>
          <Popup>📍 You are here</Popup>
        </Marker>
      )}

      {hasHospitalCoords && (
        <Marker position={[hLat, hLng]} icon={HOSPITAL_ICON}>
          <Popup>🏥 {hospital?.name}</Popup>
        </Marker>
      )}

      {geometry?.length > 1 && (
        <Polyline
          positions={geometry}
          color="#2563EB"
          weight={4}
          opacity={0.85}
          dashArray="8,5"
        />
      )}

      {boundsPositions.length >= 2 && <FitBounds positions={boundsPositions} />}
    </MapContainer>
  );
});

DirectionsMap.displayName = 'DirectionsMap';
export default DirectionsMap;
