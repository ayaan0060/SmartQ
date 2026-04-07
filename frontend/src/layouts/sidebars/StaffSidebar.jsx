import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Bell, Calendar, LogOut, Stethoscope } from 'lucide-react';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { disconnectSocket } from '../../services/socket';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/staff/dashboard' },
  { icon: ClipboardList,   label: 'My Tasks',      to: '/staff/tasks' },
  { icon: Bell,            label: 'Announcements', to: '/staff/announcements' },
  { icon: Calendar,        label: 'My Schedule',   to: '/staff/schedule' },
];

export default function StaffSidebar({ mobile = false, onClose }) {
  const { logout, hospitalName } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-(--smartq-red) rounded-xl flex items-center justify-center">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-(--foreground) leading-none truncate">SmartQ</h2>
            <p className="text-[10px] text-(--muted) mt-0.5 truncate">{hospitalName || 'Staff Portal'}</p>
          </div>
        </div>
      </div>

      {/* Nav — ONLY these 4 items */}
      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => mobile && onClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-red-50 dark:bg-red-500/10 text-(--smartq-red) dark:text-red-400 font-semibold'
                  : 'text-(--muted) hover:bg-gray-100 dark:hover:bg-white/5 hover:text-(--foreground)'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sign Out — ONE only, at bottom */}
      <div className="px-3 pb-4 mt-auto">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
