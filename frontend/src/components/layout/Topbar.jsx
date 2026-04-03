import React, { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../features/auth/useAuthStore';

export default function Topbar() {
  const { user, isSuperAdmin, hospitalName } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header
      className="flex items-center justify-between px-6 py-3 glass-nav"
      style={{ minHeight: '60px', position: 'sticky', top: 0, zIndex: 40 }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
        <input
          type="text"
          placeholder="Search..."
          className="input pl-9 py-2 text-sm"
          style={{ background: '#111827', fontSize: '13px' }}
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/5"
          style={{ color: '#9CA3AF' }}
        >
          <Bell size={18} />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ background: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }}
          />
        </button>

        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
          <span className="text-xs font-semibold" style={{ color: '#10B981' }}>Live</span>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-white/5"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{user?.name || 'Admin'}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280', maxWidth: '140px' }}>
                {isSuperAdmin() ? 'Super Admin' : (hospitalName || 'Hospital Admin')}
              </p>
            </div>
            <ChevronDown size={14} style={{ color: '#6B7280' }} />
          </button>
        </div>
      </div>
    </header>
  );
}
