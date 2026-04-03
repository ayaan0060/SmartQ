/**
 * PatientCalendar.jsx
 * ───────────────────
 * Dropdown date picker with prev/next/today navigation.
 * Uses react-day-picker v9 (no paid deps, no API key).
 * Dropdown closes on outside click and Escape key.
 *
 * Props:
 *   selectedDate — Date
 *   onChange     — (date: Date) => void
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isToday, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import 'react-day-picker/style.css';

const PatientCalendar = ({ selectedDate, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handlePrev  = useCallback(() => onChange(subDays(selectedDate, 1)), [onChange, selectedDate]);
  const handleNext  = useCallback(() => onChange(addDays(selectedDate, 1)), [onChange, selectedDate]);
  const handleToday = useCallback(() => { onChange(new Date()); setOpen(false); }, [onChange]);

  const handleSelect = useCallback((date) => {
    if (date) { onChange(date); setOpen(false); }
  }, [onChange]);

  const todayActive = isToday(selectedDate);

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end" ref={ref}>
      {/* Prev day */}
      <button
        onClick={handlePrev}
        aria-label="Previous day"
        className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
        style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
        onMouseEnter={e => e.currentTarget.style.color = '#F9FAFB'}
        onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Date display / picker trigger */}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Open date picker"
          aria-expanded={open}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: open ? 'rgba(59,130,246,0.15)' : '#1E293B',
            color:      open ? '#3B82F6' : '#F9FAFB',
            border:     `1px solid ${open ? 'rgba(59,130,246,0.4)' : '#334155'}`,
          }}
        >
          <Calendar size={14} />
          {format(selectedDate, 'dd MMM yyyy')}
          {todayActive && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}
            >
              Today
            </span>
          )}
        </button>

        {/* Dropdown calendar */}
        {open && (
          <div
            className="absolute right-0 mt-2 rounded-2xl shadow-2xl z-50"
            style={{
              background: '#0D1117',
              border:     '1px solid #1E293B',
              minWidth:   '280px',
            }}
          >
            {/* Calendar header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #1E293B' }}
            >
              <p className="text-sm font-semibold text-white">Select Date</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close calendar"
                className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors"
                style={{ color: '#64748B' }}
                onMouseEnter={e => e.currentTarget.style.color = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
              >
                <X size={13} />
              </button>
            </div>

            {/* react-day-picker v9 */}
            <div className="p-3 rdp-dark">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                disabled={{ after: new Date() }}
                showOutsideDays
              />
            </div>

            {/* Today shortcut */}
            {!todayActive && (
              <div
                className="px-4 pb-3"
                style={{ borderTop: '1px solid #1E293B', paddingTop: '12px' }}
              >
                <button
                  onClick={handleToday}
                  className="w-full h-8 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    color:      '#3B82F6',
                    border:     '1px solid rgba(59,130,246,0.2)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                >
                  Jump to Today
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next day (disabled if today) */}
      <button
        onClick={handleNext}
        disabled={todayActive}
        aria-label="Next day"
        className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
        style={{
          background: '#1E293B',
          color:      todayActive ? '#334155' : '#94A3B8',
          border:     '1px solid #334155',
          cursor:     todayActive ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => { if (!todayActive) e.currentTarget.style.color = '#F9FAFB'; }}
        onMouseLeave={e => { if (!todayActive) e.currentTarget.style.color = '#94A3B8'; }}
      >
        <ChevronRight size={16} />
      </button>

      {/* Today quick button */}
      {!todayActive && (
        <button
          onClick={handleToday}
          className="h-9 px-3 rounded-xl text-xs font-bold transition-all"
          style={{
            background: 'rgba(59,130,246,0.1)',
            color:      '#3B82F6',
            border:     '1px solid rgba(59,130,246,0.2)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
        >
          Today
        </button>
      )}
    </div>
  );
};

export default memo(PatientCalendar);
