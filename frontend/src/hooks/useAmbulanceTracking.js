import { useState, useEffect, useRef } from 'react';
import socket from '../lib/socket';
import { fetchRoute, haversineDistance } from '../services/osrmService';

/**
 * Tracks a dispatched ambulance in real-time via Socket.IO.
 * Also fetches/updates the driving route via OSRM whenever the
 * ambulance moves more than 50 metres.
 *
 * @param {string} requestId   - EmergencyRequest _id
 * @param {string} ambulanceId - Ambulance _id (null until dispatched)
 * @param {{ lat, lng }} patientLocation
 */
export function useAmbulanceTracking(requestId, ambulanceId, patientLocation) {
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);
  const [routeCoords,       setRouteCoords]        = useState([]);
  const [eta,               setEta]                = useState(null);
  const [requestStatus,     setRequestStatus]      = useState(null);
  const prevLocRef = useRef(null);

  // Join emergency room to receive status updates
  useEffect(() => {
    if (!requestId) return;
    if (!socket.connected) socket.connect();
    socket.emit('join:emergency', requestId);

    const onStatus = (data) => {
      if (data.requestId?.toString() === requestId?.toString()) {
        setRequestStatus(data.status);
      }
    };
    socket.on('emergency:status:updated', onStatus);
    socket.on('emergency:dispatched',     onStatus);

    return () => {
      socket.off('emergency:status:updated', onStatus);
      socket.off('emergency:dispatched',     onStatus);
    };
  }, [requestId]);

  // Join ambulance room to receive live location
  useEffect(() => {
    if (!ambulanceId) return;
    socket.emit('join:ambulance', ambulanceId);

    const onLocation = async (data) => {
      if (data.ambulanceId?.toString() !== ambulanceId?.toString()) return;

      const newLoc = { lat: data.lat, lng: data.lng };
      setAmbulanceLocation(newLoc);

      // Only re-fetch route if moved > 50 m (OSRM rate-limit guard)
      const prev = prevLocRef.current;
      const moved = prev
        ? haversineDistance(prev.lat, prev.lng, newLoc.lat, newLoc.lng)
        : Infinity;

      if (moved > 50 && patientLocation?.lat) {
        const result = await fetchRoute(newLoc.lat, newLoc.lng, patientLocation.lat, patientLocation.lng);
        if (result) {
          setRouteCoords(result.coordinates);
          setEta(result.durationMin);
        }
      }
      prevLocRef.current = newLoc;
    };

    socket.on('ambulance:location:updated', onLocation);
    return () => socket.off('ambulance:location:updated', onLocation);
  }, [ambulanceId, patientLocation]);

  return { ambulanceLocation, routeCoords, eta, requestStatus };
}
