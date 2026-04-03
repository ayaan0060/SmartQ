const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** Same summarization as backend staffController for doctor weekly schedule. */
export function summarizeDoctorSchedule(schedule) {
  if (!schedule) return '—';
  const parts = [];
  for (const d of DAY_KEYS) {
    const s = schedule[d];
    if (s?.available && s?.start && s?.end) {
      parts.push(`${d.slice(0, 3)} ${s.start}–${s.end}`);
    }
  }
  return parts.length ? parts.join('; ') : '—';
}
