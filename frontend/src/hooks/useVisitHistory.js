/**
 * useVisitHistory.js
 * ──────────────────
 * Fetches all tokens for a single patient using the dedicated endpoint:
 *   GET /api/patients/:patientId/visits
 *
 * Falls back to GET /api/queue/patient/:patientId (queue controller route)
 * when patientId is a raw ObjectId but no Patient record exists.
 *
 * Returns:
 *   visits   — Token[] sorted newest-first
 *   stats    — { totalVisits, departments, avgDurationMin, lastVisit }
 *   loading  — boolean
 *   error    — string | null
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export function useVisitHistory(patientId, userId) {
  const [visits,  setVisits]  = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    if (!patientId && !userId) return;

    setLoading(true);
    setError(null);

    try {
      let tokens = [];

      if (patientId) {
        // Primary: dedicated patient visits endpoint (server-side filtered, all statuses)
        const res = await api.get(
          `/patients/${patientId}/visits`
        );
        tokens = res.data?.data?.tokens || [];
      }

      // If no results via patientId, try the queue controller route with userId fallback
      if (tokens.length === 0 && userId) {
        const res = await api.get(
          `/queue/history?userId=${userId}&limit=500`
        );
        tokens = res.data?.data?.tokens || [];
      }

      // Sort newest-first (endpoint already does this, but guard against edge cases)
      tokens.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setVisits(tokens);

      // Compute summary stats
      const departments = [
        ...new Set(tokens.map(t => t.serviceId?.name).filter(Boolean)),
      ];

      const durations = tokens
        .map(t => t.waitTime)
        .filter(d => d != null && !isNaN(d) && d > 0);

      const avgDurationMin = durations.length
        ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
        : null;

      setStats({
        totalVisits:    tokens.length,
        departments:    departments.length,
        avgDurationMin,
        lastVisit:      tokens[0]?.createdAt || null,
      });
    } catch (err) {
      setError(err.displayMessage || 'Failed to load visit history');
    } finally {
      setLoading(false);
    }
  }, [patientId, userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { visits, stats, loading, error };
}
