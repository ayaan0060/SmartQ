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
    const lat = hospital?.latitude ?? hospital?.coordinates?.lat;
    const lng = hospital?.longitude ?? hospital?.coordinates?.lng;
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else {
      onGetDirections?.(hospital);
    }
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
        'group p-6 md:p-8 border shadow-premium cursor-pointer rounded-4xl flex flex-col h-full bg-slate-800/80 hover:bg-slate-800 relative',
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
      <div className="mb-6 flex items-center justify-between">
        <div className="h-14 w-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
          <Building2 size={28} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="warning" className="gap-1.5 px-3 py-1.5">
            <Star size={14} fill="currentColor" />
            {hospital.rating || '4.8'}
          </Badge>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {hospital.timings}
          </span>
        </div>
      </div>

      {/* ── Info ──────────────────────────────────────────────────────── */}
      <div className="grow space-y-2">
        <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors font-display line-clamp-1">
          {hospital.name}
        </h3>

        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-400 uppercase tracking-wider">
          <MapPin size={14} className="text-primary" />
          {hospital.location}
        </p>

        {/* Distance badge — only shown when GPS is available */}
        {distanceKm != null && (
          <p
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: isNearest ? '#10B981' : '#64748B' }}
          >
            <Navigation size={12} />
            {distanceKm} km away
          </p>
        )}

        <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <div className="h-6 w-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
              <Phone size={12} />
            </div>
            {hospital.contact}
          </div>
        </div>
      </div>

      {/* ── Action buttons ────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col gap-3">
        <Button
          className="w-full h-14 rounded-2xl gap-3 text-base shadow-lg shadow-primary/20"
          onClick={handleSelectClick}
          aria-label={`Book appointment at ${hospital.name}`}
        >
          Book Appointment
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </Button>

        {/* Get Directions — only rendered when handler is provided */}
        {onGetDirections && (
          <button
            onClick={handleDirectionsClick}
            aria-label={`Get walking directions to ${hospital.name}`}
            className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all"
            style={{
              background: 'rgba(59,130,246,0.08)',
              border:     '1px solid rgba(59,130,246,0.2)',
              color:      '#3B82F6',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.18)';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
            }}
          >
            <Navigation size={16} />
            Get Directions
          </button>
        )}
      </div>
    </Card>
  );
};

export default memo(HospitalCard);
