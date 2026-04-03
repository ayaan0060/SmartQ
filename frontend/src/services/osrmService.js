/**
 * osrmService.js
 * ──────────────
 * Free routing via OSRM public server — no API key needed.
 * Uses AbortController to cancel stale in-flight requests when the user
 * opens a new modal before the previous fetch completes.
 *
 * Exports:
 *   fetchWalkingRoute(pLat, pLng, hLat, hLng)
 *     → { geometry, distance, duration, steps } | null
 *
 *   fetchRoute(fromLat, fromLng, toLat, toLng, mode)   ← kept for back-compat
 *     → { coordinates, distanceKm, durationMin, steps } | null
 *
 *   haversineDistanceKm(lat1, lng1, lat2, lng2) → number (km)
 *   geocodeAddress(address) → { lat, lng } | null
 */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

// ── AbortController singleton ─────────────────────────────────────────────────
let abortController = null;

// ── Haversine (km) ─────────────────────────────────────────────────────────────
export const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some(v => v == null || isNaN(v))) return Infinity;
  const R = 6371;
  const toRad = deg => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── haversineDistance (metres) — kept for back-compat with ambulance tracking ──
export const haversineDistance = (lat1, lng1, lat2, lng2) =>
  haversineDistanceKm(lat1, lng1, lat2, lng2) * 1000;

// ── fetchWalkingRoute ─────────────────────────────────────────────────────────
/**
 * Fetches a walking route from OSRM.
 * Cancels any previous in-flight request automatically.
 *
 * Returns:
 *   geometry  — [[lat, lng], ...] polyline for Leaflet
 *   distance  — "1.4" (km string)
 *   duration  — 18 (minutes number)
 *   steps     — [{ instruction, lat, lng, distance, duration }, ...]
 *               lat/lng on each step = maneuver location for voice proximity check
 */
export const fetchWalkingRoute = async (pLat, pLng, hLat, hLng) => {
  if (abortController) abortController.abort();
  abortController = new AbortController();

  const url =
    `${OSRM_BASE}/foot/` +
    `${pLng},${pLat};${hLng},${hLat}` +
    `?overview=full&geometries=geojson&steps=true`;

  try {
    const res = await fetch(url, { signal: abortController.signal });
    if (!res.ok) throw new Error(`OSRM responded ${res.status}`);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;

    const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const distance = (route.distance / 1000).toFixed(1);
    const duration = Math.ceil(route.duration / 60);

    const steps = (route.legs[0]?.steps || []).map(s => ({
      instruction: s.maneuver?.instruction || s.name || 'Continue',
      lat:         s.maneuver?.location?.[1] ?? null,
      lng:         s.maneuver?.location?.[0] ?? null,
      distance:    Math.round(s.distance) + ' m',
      duration:    Math.ceil(s.duration / 60) + ' min',
    }));

    return { geometry, distance, duration, steps };
  } catch (err) {
    if (err.name === 'AbortError') return null; // silently ignore cancelled requests
    throw err;
  }
};

// ── fetchRoute — back-compat wrapper used by existing components ──────────────
export const fetchRoute = async (fromLat, fromLng, toLat, toLng, mode = 'driving') => {
  const profile = mode === 'walking' ? 'foot' : 'driving';

  if (abortController) abortController.abort();
  abortController = new AbortController();

  const url =
    `${OSRM_BASE}/${profile}/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson&steps=true`;

  try {
    const res  = await fetch(url, { signal: abortController.signal });
    const data = await res.json();
    if (!data.routes?.[0]) return null;

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const distanceKm  = (route.distance / 1000).toFixed(1);
    const durationMin = Math.ceil(route.duration / 60);

    const steps = (route.legs[0]?.steps || []).map(step => ({
      instruction: step.name || 'Continue',
      distance:    Math.round(step.distance) + 'm',
      duration:    Math.ceil(step.duration / 60) + ' min',
    }));

    return { coordinates, distanceKm, durationMin, steps };
  } catch (err) {
    if (err.name === 'AbortError') return null;
    throw err;
  }
};

// ── geocodeAddress — Nominatim (free, no key) ─────────────────────────────────
export const geocodeAddress = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  return null;
};
