/**
 * usePatientTracking.js
 * ─────────────────────
 * Manages all real-time state for the patient ambulance tracking view.
 *
 * Responsibilities:
 *  - Joins/leaves the emergency socket room (request:{id})
 *  - Listens for emergency:dispatched, emergency:status:updated, ambulance:location:updated
 *  - Fetches OSRM route, debounced to only refetch when ambulance moves > 100m
 *  - Haversine proximity detection: arriving < 200m, arrived < 50m
 *  - AbortController on every OSRM call — no race conditions
 *  - Full cleanup on unmount
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../lib/socket';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

// ── Haversine (km) ─────────────────────────────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some(v => v == null || isNaN(v))) return Infinity;
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export function usePatientTracking(requestId, initialData) {
  // ambulance info set on dispatch
  const [ambulance,         setAmbulance]         = useState(initialData?.ambulance || null);
  // live GPS position of ambulance
  const [ambulanceLocation, setAmbulanceLocation] = useState(initialData?.ambulanceLocation || null);
  // OSRM polyline
  const [routeCoords,       setRouteCoords]       = useState([]);
  // { distKm, etaMin }
  const [eta,               setEta]               = useState(null);
  // mirrors EmergencyRequest.status
  const [status,            setStatus]            = useState(initialData?.status || 'requested');

  const patientLocation = initialData?.patientLocation;

  // Refs for cleanup
  const abortRef        = useRef(null);
  const lastFetchPosRef = useRef(null); // position at last OSRM fetch

  // ── OSRM route fetch ─────────────────────────────────────────────────────────
  const fetchRoute = useCallback(async (ambLat, ambLng) => {
    if (!patientLocation?.lat || !patientLocation?.lng) return;

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const url =
      `${OSRM_BASE}/driving/` +
      `${ambLng},${ambLat};${patientLocation.lng},${patientLocation.lat}` +
      `?overview=full&geometries=geojson&steps=false`;

    try {
      const res  = await fetch(url, { signal: abortRef.current.signal });
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) return;

      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distKm = (route.distance / 1000).toFixed(1);
      const etaMin = Math.ceil(route.duration / 60);

      setRouteCoords(coords);
      setEta({ distKm, etaMin });
      lastFetchPosRef.current = { lat: ambLat, lng: ambLng };
    } catch (err) {
      if (err.name === 'AbortError') return; // silently ignore cancelled
      // Fallback: straight line
      if (patientLocation?.lat) {
        setRouteCoords([
          [ambLat, ambLng],
          [patientLocation.lat, patientLocation.lng],
        ]);
      }
    }
  }, [patientLocation]);

  // ── Socket setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!requestId) return;

    if (!socket.connected) socket.connect();
    socket.emit('join:emergency', requestId);

    // ── emergency:dispatched ─────────────────────────────────────────────────
    const onDispatched = (data) => {
      if (data.requestId?.toString() !== requestId.toString()) return;
      setAmbulance({
        _id:           data.ambulanceId,
        vehicleNumber: data.vehicleNumber,
        driverName:    data.driverName,
        driverPhone:   data.driverPhone,
      });
      setStatus('dispatched');
      // Ask server to bridge ambulance location events into this room
      socket.emit('dispatch:bridgeLocation', {
        requestId,
        ambulanceId: data.ambulanceId?.toString(),
      });
    };

    // ── emergency:status:updated ─────────────────────────────────────────────
    const onStatusUpdate = (data) => {
      if (data.requestId?.toString() !== requestId.toString()) return;
      setStatus(data.status);
    };

    // ── ambulance:location:updated ───────────────────────────────────────────
    const onLocation = (data) => {
      const newLoc = { lat: data.lat, lng: data.lng };
      setAmbulanceLocation(newLoc);

      // Proximity detection (Haversine, client-side)
      if (patientLocation?.lat) {
        const distKm = haversine(newLoc.lat, newLoc.lng, patientLocation.lat, patientLocation.lng);
        if (distKm < 0.05) {
          setStatus(prev => (prev !== 'arrived' && prev !== 'completed' && prev !== 'cancelled') ? 'arrived' : prev);
        } else if (distKm < 0.2) {
          setStatus(prev => (prev === 'dispatched' || prev === 'en_route') ? 'arriving' : prev);
        }
      }

      // OSRM refetch only when ambulance has moved > 100m from last fetch point
      const last = lastFetchPosRef.current;
      const movedEnough = !last || haversine(last.lat, last.lng, newLoc.lat, newLoc.lng) > 0.1;
      if (movedEnough) fetchRoute(newLoc.lat, newLoc.lng);
    };

    socket.on('emergency:dispatched',       onDispatched);
    socket.on('emergency:status:updated',   onStatusUpdate);
    socket.on('ambulance:location:updated', onLocation);

    // If already dispatched on mount, bridge location immediately
    if (initialData?.ambulance?._id) {
      socket.emit('dispatch:bridgeLocation', {
        requestId,
        ambulanceId: initialData.ambulance._id.toString(),
      });
      // Fetch initial route if ambulance location is known
      if (initialData.ambulanceLocation?.lat) {
        setTimeout(() => {
          fetchRoute(initialData.ambulanceLocation.lat, initialData.ambulanceLocation.lng);
        }, 0);
      }
    }

    return () => {
      socket.off('emergency:dispatched',       onDispatched);
      socket.off('emergency:status:updated',   onStatusUpdate);
      socket.off('ambulance:location:updated', onLocation);
      // Cancel any in-flight OSRM request
      if (abortRef.current) abortRef.current.abort();
    };
  }, [requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ambulance, ambulanceLocation, routeCoords, eta, status, setStatus };
}
