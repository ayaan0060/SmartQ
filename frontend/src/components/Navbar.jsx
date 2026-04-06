import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Sun, AlertTriangle, Menu, X, LogOut,
  LayoutDashboard, Clock, Calendar, Settings,
} from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';
import { AuthService } from '../features/auth/AuthService';
import { useTheme } from '../hooks/useTheme';

const NAV_LINKS = [
  { label: 'Dashboard',    to: '/patient/dashboard' },
  { label: 'Queue',        to: '/patient/queue' },
  { label: 'Appointments', to: '/appointments' },
];

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="fixed top-0 w-full z-50 border-b border-zinc-200/10 glass-nav shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-black italic text-red-700 tracking-tight">
            SmartQ
          </Link>

          {/* Desktop nav links */}
          {isAuthenticated && user?.role === 'patient' && (
            <nav className="hidden md:flex gap-6 items-center">
              {NAV_LINKS.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-red-700 font-bold border-b-2 border-red-700 pb-0.5 text-sm'
                      : 'text-zinc-600 hover:bg-zinc-100 transition-colors px-3 py-1 rounded-lg text-sm'
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Emergency */}
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/ambulance')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              <AlertTriangle size={14} />
              Emergency
            </motion.button>
          )}

          {/* Dark mode toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggle}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} className="text-on-surface-variant" /> : <Moon size={18} className="text-on-surface-variant" />}
          </motion.button>

          {/* User avatar */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-3 border-l border-outline-variant/30">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-on-surface leading-none">{user?.name}</p>
                <p className="text-[10px] text-secondary uppercase tracking-widest mt-0.5">{user?.role}</p>
              </div>
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm cursor-pointer">
                  {initials}
                </div>
                {/* Dropdown */}
                <div className="absolute right-0 top-12 w-44 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-error hover:bg-error-container/30 rounded-2xl transition-colors"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-bold bg-primary text-on-primary rounded-2xl shadow-md hover:bg-primary-container transition-colors">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-surface-container-lowest border-t border-outline-variant/20"
          >
            <div className="px-6 py-4 flex flex-col gap-2">
              {isAuthenticated && NAV_LINKS.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-4 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                >
                  {label}
                </Link>
              ))}
              {isAuthenticated && (
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="py-3 px-4 rounded-xl text-sm font-medium text-error hover:bg-error-container/30 text-left transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
