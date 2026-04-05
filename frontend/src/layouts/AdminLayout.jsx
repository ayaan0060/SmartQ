import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Building2, Users, Settings, LogOut,
  Activity, UserCog, Menu, X, Network, Bell,
  Search, Ambulance, Briefcase, AlertTriangle,
  ShieldCheck, HelpCircle, Moon, Sun,
} from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';
import { useTheme } from '../hooks/useTheme';
import Footer from '../components/Footer';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',   to: '/admin',             end: true },
  { icon: Building2,       label: 'Hospitals',   to: '/admin/hospitals',   superAdminOnly: true },
  { icon: Network,         label: 'Departments', to: '/admin/departments', hospitalAdminOnly: true },
  { icon: Briefcase,       label: 'Staff',       to: '/admin/staff',       hospitalAdminOnly: true },
  { icon: Users,           label: 'Patients',    to: '/admin/patients',    hospitalAdminOnly: true },
  { icon: Activity,        label: 'Queue',       to: '/admin/queue',       hospitalAdminOnly: true },
  { icon: Ambulance,       label: 'Ambulances',  to: '/admin/ambulances',  hospitalAdminOnly: true },
  { icon: UserCog,         label: 'Analytics',   to: '/admin/analytics' },
  { icon: Settings,        label: 'Settings',    to: '/admin/settings' },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isSuperAdmin, hospitalName } = useAuthStore();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = NAV_ITEMS.filter(item => {
    if (isSuperAdmin()) return !item.hospitalAdminOnly;
    return !item.superAdminOnly;
  });

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 mb-10 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-on-primary-container" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface leading-none">Clinical Sentinel</h2>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">
              {isSuperAdmin() ? 'Super Admin' : (hospitalName || 'High-Authority Care')}
            </p>
          </div>
        </div>
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-zinc-500">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ icon: Icon, label, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && setMobileOpen(false)}
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
      <div className="px-6 mt-auto pb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-2xl bg-primary text-on-primary font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mb-6"
        >
          <AlertTriangle size={14} />
          Emergency Alert
        </motion.button>

        <div className="space-y-3">
          <a href="#" className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors">
            <ShieldCheck size={14} /> HIPAA Privacy
          </a>
          <a href="#" className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors">
            <HelpCircle size={14} /> Support
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors w-full"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden transition-transform duration-300 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200/10"
        style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <SidebarContent mobile />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200/10 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 glass-nav border-b border-zinc-200/10 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-zinc-500">
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-xl font-black text-on-surface tracking-tight">
                {isSuperAdmin() ? 'Platform Overview' : 'Clinical Sentinel Overview'}
              </h2>
              <p className="text-sm text-secondary font-medium mt-0.5">
                {isSuperAdmin() ? 'Super Admin Dashboard' : (hospitalName || 'Hospital Admin')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search systems..."
                className="pl-9 pr-4 py-2 bg-surface-container-highest border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-56 text-on-surface"
              />
            </div>

            {/* Dark mode */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggle}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} className="text-on-surface-variant" /> : <Moon size={18} className="text-on-surface-variant" />}
            </motion.button>

            {/* Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              <Bell size={18} className="text-on-surface-variant" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </motion.button>

            {/* Avatar */}
            <div className="flex items-center gap-3 pl-3 border-l border-outline-variant/30">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
