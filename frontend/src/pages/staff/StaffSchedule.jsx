import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SHIFT_CONFIG = {
  morning: { label: 'Morning', time: '6:00 AM – 2:00 PM', color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
  evening: { label: 'Evening', time: '2:00 PM – 10:00 PM', color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
  night:   { label: 'Night',   time: '10:00 PM – 6:00 AM', color: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300' },
  off:     { label: 'Off',     time: '',                   color: 'bg-gray-100 text-gray-400 dark:bg-white/5' },
};

// Get Mon–Sun for current week
const getCurrentWeek = () => {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const formatDay = (date) =>
  date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const isToday = (date) => {
  const t = new Date();
  return date.toDateString() === t.toDateString();
};

export default function StaffSchedule() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const weekDates = getCurrentWeek();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/staff-portal/schedule');
        setSchedule(data.data || null);
      } catch { setSchedule(null); }
      finally { setLoading(false); }
    })();
  }, []);

  // Build a date→shift lookup from schedule.shifts
  const shiftByDate = {};
  if (schedule?.shifts) {
    schedule.shifts.forEach(s => {
      const key = new Date(s.date).toDateString();
      shiftByDate[key] = s;
    });
  }

  // Upcoming shifts (next 7 days from today)
  const upcoming = (schedule?.shifts || [])
    .filter(s => {
      const d = new Date(s.date);
      const today = new Date(); today.setHours(0,0,0,0);
      const d0 = new Date(d); d0.setHours(0,0,0,0);
      const diff = (d0 - today) / 86400000;
      return diff >= 0 && diff <= 7 && s.type !== 'off';
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg px-2 py-1.5 transition-all"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-(--foreground)">My Schedule</h1>
        <span className="text-xs text-(--muted) bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-1">View only — contact admin to edit</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-(--card) rounded-xl border border-(--border) p-5 animate-pulse h-40" />
          <div className="bg-(--card) rounded-xl border border-(--border) p-5 animate-pulse h-32" />
        </div>
      ) : !schedule ? (
        <div className="bg-(--card) rounded-xl border border-(--border) p-10 flex flex-col items-center justify-center text-center">
          <Calendar size={40} className="text-(--muted) mb-3 opacity-40" />
          <p className="text-sm font-medium text-(--foreground)">No schedule assigned yet</p>
          <p className="text-xs text-(--muted) mt-1.5">Contact your administrator to set up your shift schedule</p>
        </div>
      ) : (
        <>
          {/* Weekly Grid */}
          <div className="bg-(--card) rounded-xl border border-(--border) p-5 mb-6 overflow-x-auto">
            <p className="text-sm font-semibold text-(--foreground) mb-4">This Week</p>
            <div className="grid grid-cols-7 gap-2 min-w-[560px]">
              {weekDates.map((date, i) => {
                const shift = shiftByDate[date.toDateString()];
                const type = shift?.type || 'off';
                const cfg = SHIFT_CONFIG[type] || SHIFT_CONFIG.off;
                const today = isToday(date);
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase ${today ? 'text-(--smartq-red)' : 'text-(--muted)'}`}>
                      {DAYS[i]}
                    </span>
                    <span className={`text-xs font-medium ${today ? 'text-(--smartq-red)' : 'text-(--muted)'}`}>
                      {formatDay(date)}
                    </span>
                    <div className={`w-full text-center text-[11px] font-semibold px-1 py-2 rounded-lg ${cfg.color} ${today ? 'ring-2 ring-(--smartq-red)/40' : ''}`}>
                      {cfg.label}
                      {shift?.ward && <p className="text-[9px] font-normal opacity-70 mt-0.5 truncate">{shift.ward}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-(--border)">
              {Object.entries(SHIFT_CONFIG).map(([key, { label, color }]) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-(--muted)">
                  <span className={`w-3 h-3 rounded-sm ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Upcoming Shifts */}
          <div className="bg-(--card) rounded-xl border border-(--border) p-5">
            <p className="text-sm font-semibold text-(--foreground) mb-4">Upcoming Shifts (next 7 days)</p>
            {upcoming.length === 0 ? (
              <p className="text-sm text-(--muted) text-center py-6">No upcoming shifts</p>
            ) : (
              <div className="divide-y divide-(--border)">
                {upcoming.map((s, i) => {
                  const cfg = SHIFT_CONFIG[s.type] || SHIFT_CONFIG.morning;
                  const d = new Date(s.date);
                  return (
                    <div key={i} className="flex items-center gap-4 py-3">
                      <div className="w-12 text-center">
                        <p className="text-xs font-bold text-(--muted) uppercase">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                        <p className="text-lg font-black text-(--foreground) leading-none">{d.getDate()}</p>
                        <p className="text-[10px] text-(--muted)">{d.toLocaleDateString('en-IN', { month: 'short' })}</p>
                      </div>
                      <div className="flex-1">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${cfg.color}`}>
                          {cfg.label} Shift
                        </span>
                        <p className="text-xs text-(--muted)">
                          {s.startTime && s.endTime ? `${s.startTime} – ${s.endTime}` : cfg.time}
                        </p>
                        {s.ward && <p className="text-xs text-(--foreground) font-medium mt-0.5">{s.ward}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
