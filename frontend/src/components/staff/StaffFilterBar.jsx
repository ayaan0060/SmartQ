import React from 'react';
import { STAFF_ROLE_FILTERS } from '../../features/staff/staffRoleConfig';

export default function StaffFilterBar({ active, onChange, roleCounts = {} }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STAFF_ROLE_FILTERS.map((item) => {
        const count = item.id === 'all' ? null : (roleCounts[item.id] ?? 0);
        const isOn = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200"
            style={{
              background: isOn ? 'rgba(37,99,235,0.2)' : '#0F172A',
              border: isOn ? '1px solid rgba(59,130,246,0.45)' : '1px solid #1E293B',
              color: isOn ? '#E2E8F0' : '#94A3B8',
            }}
            title={item.hint || item.label}
          >
            {item.emoji ? <span className="text-sm leading-none">{item.emoji}</span> : null}
            <span>{item.label}</span>
            {count != null && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: '#111827', color: '#64748B' }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
