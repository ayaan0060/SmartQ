/**
 * useNearestHospital.js
 * ─────────────────────
 * GPS + Haversine nearest-hospital detection.
 *
 * Reads hospitals from the existing HospitalService (same API the rest of the
 * app uses). Does NOT make a duplicate call if hospitals are passed in.
 *
 * Returns:
 *   findNearest() → Promise<{ hospital, distanceKm, patientLat, patientLng } | null>
 *   hospitals     → Hospital[] (cached after first fetch)
 */

import { useState, useCallback, useRef } from 'react';
import { HospitalService } from '../features/hospital/HospitalService';

// ── Safe Haversine (km) ────────────────────────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some(v => v == null || isNaN(Number(v)))) return Infinity;
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Promise-wrap getCurrentPosition ───────────────────────────────────────────
const getGPS = () =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout:            8000,
      maximumAge:         0,
    })
  );

export const useNearestHospital = () => {
  const [hospitals, setHospitals] = useState([]);
  const hospitalsRef = useRef([]); // avoid stale closure in findNearest

  const findNearest = useCallback(async () => {
    // ── 1. Get GPS ─────────────────────────────────────────────────────────────
    const pos = await getGPS(); // throws GeolocationPositionError on failure
    const patientLat = pos.coords.latitude;
    const patientLng = pos.coords.longitude;

    // ── 2. Get hospitals (use cached if available) ─────────────────────────────
    let list = hospitalsRef.current;
    if (!list.length) {
      list = await HospitalService.getHospitals();
      hospitalsRef.current = list;
      setHospitals(list);
    }

    // ── 3. Filter hospitals with valid coords ──────────────────────────────────
    const withCoords = list.filter(h => {
      const lat = h.coordinates?.lat ?? h.lat;
      const lng = h.coordinates?.lng ?? h.lng;
      return lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
    });

    if (!withCoords.length) return null; // no hospitals have GPS coords

    // ── 4. Sort by Haversine distance ──────────────────────────────────────────
    const sorted = withCoords
      .map(h => ({
        hospital:    h,
        distanceKm:  haversine(
          patientLat, patientLng,
          Number(h.coordinates?.lat ?? h.lat),
          Number(h.coordinates?.lng ?? h.lng)
        ),
      }))
      .filter(x => x.distanceKm !== Infinity)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    if (!sorted.length) return null;

    return {
      hospital:   sorted[0].hospital,
      distanceKm: sorted[0].distanceKm,
      patientLat,
      patientLng,
      allHospitals: list, // expose full list for fallback dropdown
    };
  }, []);

  return { findNearest, hospitals };
};
