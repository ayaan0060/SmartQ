/**
 * usePatientsByDate.js
 * ────────────────────
 * Fetches all queue tokens for a given calendar date.
 *
 * Strategy:
 *  - GET /api/queue/history?date=YYYY-MM-DD  → completed / skipped / cancelled
 *  - GET /api/queue?date=YYYY-MM-DD          → waiting / in-progress (today only)
 *  Both endpoints now accept a ?date= param and populate doctorId.
 *
 * Returns:
 *   rows     — Token[] (all statuses, newest-first)
 *   loading  — boolean
 *   error    — string | null
 *   refetch  — () => void
 */

import { useState, useEffect, useCallback } from 'react';
import { format, isToday } from 'date-fns';
import api from '../lib/api';

export function usePatientsByDate(selectedDate) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const dateStr  = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const dateIsToday = selectedDate ? isToday(selectedDate) : true;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const requests = [
        api.get(`/queue/history?date=${dateStr}`),
      ];

      // For today also pull active (waiting / in-progress) tokens
      if (dateIsToday) {
        requests.push(api.get(`/queue?date=${dateStr}`));
      }

      const results = await Promise.all(requests);

      const historyTokens = results[0].data?.data?.tokens || [];
      const activeTokens  = results[1]?.data?.data?.tokens || [];

      // Merge, deduplicate by _id, sort newest-first
      const seen   = new Set();
      const merged = [...activeTokens, ...historyTokens].filter(t => {
        if (seen.has(t._id)) return false;
        seen.add(t._id);
        return true;
      });

      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRows(merged);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load patient appointments');
    } finally {
      setLoading(false);
    }
  }, [dateStr, dateIsToday]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { rows, loading, error, refetch: fetch };
}
