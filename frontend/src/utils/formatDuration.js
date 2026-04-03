/**
 * formatDuration.js
 * ─────────────────
 * Converts a duration value to a human-readable string.
 *
 * @param {number|null|undefined} value  — duration in seconds
 * @param {'seconds'|'minutes'}   unit   — input unit (default: 'seconds')
 * @returns {string}  e.g. "< 1 min" | "5 min" | "1 hr 12 min" | "—"
 */
export function formatDuration(value, unit = 'seconds') {
  if (value == null || isNaN(value) || value <= 0) return '—';

  const totalSeconds = unit === 'minutes' ? Math.round(value * 60) : Math.round(value);
  const totalMinutes = Math.floor(totalSeconds / 60);

  if (totalMinutes < 1) return '< 1 min';

  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

/**
 * Returns elapsed seconds between a start Date/string and now.
 * Returns 0 if startTime is invalid.
 */
export function elapsedSeconds(startTime) {
  if (!startTime) return 0;
  const diff = Date.now() - new Date(startTime).getTime();
  return diff > 0 ? Math.floor(diff / 1000) : 0;
}
