import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Clock, Calendar, BarChart2,
  Settings, HelpCircle, AlertTriangle, ShieldCheck,
  LogOut, History,
} from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';
import { AuthService } from '../features/auth/AuthService';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/patient/dashboard' },
  { icon: Clock,           label: 'Queue',          to: '/patient/queue' },
  { icon: History,         label: 'Token History',  to: '/patient/history' },
  { icon: Calendar,        label: 'Appointments',   to: '/appointments' },
  { icon: BarChart2,       label: 'Analytics',      to: '/payments' },
  { icon: Settings,        label: 'Settings',       to: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSignOut = () => {
    AuthService.logout();
    navigate('/login');
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r border-zinc-200/10 bg-zinc-50 dark:bg-zinc-900 flex flex-col py-8 z-40">
      {/* Logo */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
            <AlertTriangle size={20} className="text-on-primary-container" />
          </div>
          <div>
            <h1 className="text-on-surface font-black tracking-tight leading-none text-xl">SmartQ</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Clinical Sentinel</p>
          </div>
        </div>
        {/* Patient name (BUG 3) */}
        {user && user.role === 'patient' && (
          <p className="text-sm font-semibold text-on-surface mt-3 pl-1">Welcome, {user.name}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-4 px-6 py-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-r-full mr-4 font-medium text-sm'
                : 'flex items-center gap-4 px-6 py-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium text-sm'
            }
          >
            {({ isActive }) => (
              <motion.div
                className="flex items-center gap-4 w-full"
                whileHover={!isActive ? { x: 4 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <Icon size={20} />
                <span>{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-6 mt-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/ambulance')}
          className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 mb-6 shadow-lg shadow-primary/20"
        >
          <AlertTriangle size={16} />
          Emergency Alert
        </motion.button>

        {/* Sign Out (BUG 5) */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-sm mb-4"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        <div className="space-y-4">
          <a href="#" className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors">
            <ShieldCheck size={16} />
            HIPAA Privacy
          </a>
          <a href="#" className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors">
            <HelpCircle size={16} />
            Support
          </a>
        </div>
      </div>
    </aside>
  );
}
