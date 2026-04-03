/**
 * HospitalCard.jsx
 * ────────────────
 * Hospital selection card.
 *
 * New props (all optional, zero breaking changes):
 *   isNearest       — boolean  → green border + "Nearest" badge
 *   distanceKm      — string   → "1.4 km" shown below name
 *   onGetDirections — () => void → opens DirectionsModal
 */

import React, { memo, useCallback } from 'react';
import { MapPin, Star, Phone, ArrowRight, Building2, Navigation } from 'lucide-react';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import { cn } from '../utils/cn';

const HospitalCard = ({ hospital, onSelect, isNearest = false, distanceKm, onGetDirections }) => {
  const handleDirectionsClick = useCallback((e) => {
    e.stopPropagation();
    onGetDirections?.(hospital);
  }, [onGetDirections, hospital]);

  const handleSelectClick = useCallback((e) => {
    e.stopPropagation();
    onSelect(hospital);
  }, [onSelect, hospital]);

  return (
    <Card
      hoverable
      onClick={() => onSelect(hospital)}
      className={cn(
        'group p-3 border shadow-premium cursor-pointer rounded-2xl flex flex-col h-full bg-slate-800/80 hover:bg-slate-800 relative',
        isNearest
          ? 'border-emerald-500/60 shadow-emerald-500/10'
          : 'border-transparent'
      )}
      aria-label={`Select ${hospital.name} at ${hospital.location}`}
    >
      {/* ── Nearest badge ─────────────────────────────────────────────── */}
      {isNearest && (
        <span
          className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
          style={{
            background: 'rgba(16,185,129,0.15)',
            border:     '1px solid rgba(16,185,129,0.35)',
            color:      '#10B981',
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: '#10B981' }}
          />
          Nearest
        </span>
      )}

      {/* ── Icon row ──────────────────────────────────────────────────── */}
      <div className="mb-2 flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
          <Building2 size={16} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="warning" className="gap-1 px-1.5 py-0.5 text-[9px]">
            <Star size={9} fill="currentColor" />
            {hospital.rating || '4.8'}
          </Badge>
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
            {hospital.timings}
          </span>
        </div>
      </div>

      {/* ── Info ──────────────────────────────────────────────────────── */}
      <div className="grow space-y-0.5">
        <h3 className="text-sm font-black text-white group-hover:text-primary transition-colors font-display line-clamp-1">
          {hospital.name}
        </h3>
        <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <MapPin size={9} className="text-primary" />
          {hospital.location}
        </p>
        {distanceKm != null && (
          <p className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: isNearest ? '#10B981' : '#64748B' }}>
            <Navigation size={9} />
            {distanceKm} km away
          </p>
        )}
        <div className="mt-2 pt-2 border-t border-slate-700">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <Phone size={9} />
            {hospital.contact}
          </div>
        </div>
      </div>

      {/* ── Action buttons ────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-col gap-1.5">
        <Button
          className="w-full h-8 rounded-lg gap-1.5 text-xs shadow-lg shadow-primary/20"
          onClick={handleSelectClick}
        >
          Book Appointment
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
        </Button>
        {onGetDirections && (
          <button
            onClick={handleDirectionsClick}
            className="w-full h-7 rounded-lg flex items-center justify-center gap-1 text-[10px] font-semibold transition-all"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#3B82F6' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; }}
          >
            <Navigation size={11} /> Get Directions
          </button>
        )}
      </div>
    </Card>
  );
};

export default memo(HospitalCard);
