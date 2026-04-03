/**
 * useVoiceNavigation.js
 * ─────────────────────
 * Manages browser SpeechSynthesis + GPS watchPosition for turn-by-turn
 * voice navigation. All side-effects are cleaned up on stop() or unmount.
 *
 * Usage:
 *   const { start, stop, isSupported } = useVoiceNavigation();
 *   start(steps, hospitalName)   // steps: [{ lat, lng, instruction }]
 *   stop()                       // cancels speech + GPS watch
 */

import { useRef, useCallback } from 'react';

// ── Haversine (km) ────────────────────────────────────────────────────────────
const getDistance = (lat1, lng1, lat2, lng2) => {
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

export const useVoiceNavigation = () => {
  const watchIdRef    = useRef(null);
  const stepIndexRef  = useRef(0);
  const stepsRef      = useRef([]);
  const isSupported   = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // ── speak ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = 0.95;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }, [isSupported]);

  // ── stop ───────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (isSupported) speechSynthesis.cancel();
  }, [isSupported]);

  // ── start ──────────────────────────────────────────────────────────────────
  const start = useCallback((steps, hospitalName) => {
    if (!isSupported || !steps?.length) return;

    // Cancel any previous session first
    stop();

    stepsRef.current   = steps;
    stepIndexRef.current = 0;

    speak(`Navigation started. Head towards ${hospitalName}.`);

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: userLat, longitude: userLng } = pos.coords;
        const currentStep = stepsRef.current[stepIndexRef.current];
        if (!currentStep) return;

        const distKm = getDistance(userLat, userLng, currentStep.lat, currentStep.lng);

        if (distKm < 0.03) { // within 30 metres
          speak(currentStep.instruction);
          stepIndexRef.current += 1;

          if (stepIndexRef.current >= stepsRef.current.length) {
            speak('You have arrived at your destination.');
            stop();
          }
        }
      },
      (err) => console.warn('[VoiceNav] GPS error:', err.message),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  }, [isSupported, speak, stop]);

  return { start, stop, isSupported };
};
