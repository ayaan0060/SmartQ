import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Returns { getPosition, position, loading, error }
 * Call getPosition() to trigger a one-shot GPS read.
 */
export function useGeolocation() {
  const [position, setPosition] = useState(null); // { lat, lng }
  const [loading,  setLoading]  = useState(false);
  const [geoError, setGeoError] = useState(null);

  const getPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser.';
        toast.error(msg);
        setGeoError(msg);
        reject(new Error(msg));
        return;
      }

      setLoading(true);
      setGeoError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          setLoading(false);
          let msg;
          if (err.code === 1) msg = 'Location access denied. Please enable GPS in your browser settings.';
          else if (err.code === 2) msg = 'Location unavailable. Check your GPS signal.';
          else msg = 'Location request timed out. Please try again.';
          toast.error(msg);
          setGeoError(msg);
          reject(new Error(msg));
        },
        { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
      );
    });
  }, []);

  return { getPosition, position, loading, geoError };
}
