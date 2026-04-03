import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, Users, LayoutDashboard,
  Settings, LogOut, Activity, UserCog, Menu, X,
  Network, ChevronLeft, ChevronRight, Zap, Bell,
  Search, Ambulance, Briefcase,
} from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';

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
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const { user, logout, isSuperAdmin, hospitalName } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = NAV_ITEMS.filter(item => {
    if (isSuperAdmin()) return !item.hospitalAdminOnly;
    return !item.superAdminOnly;
  });

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4 shrink-0"
        style={{ borderBottom: '1px solid #1E293B' }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
        >
          <Zap size={18} className="text-white" fill="white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-none">SmartQ</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#475569' }}>
              {isSuperAdmin() ? 'Super Admin' : (hospitalName || 'Hospital Admin')}
            </p>
          </div>
        )}
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200"
            style={{ color: '#64748B' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ icon: Icon, label, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && setMobileOpen(false)}
            title={collapsed && !mobile ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed && !mobile ? 'justify-center' : ''
              } ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(37,99,235,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(37,99,235,0.2)' : '1px solid transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className="shrink-0" style={{ color: isActive ? '#3B82F6' : undefined }} />
                {(!collapsed || mobile) && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user + actions */}
      <div className="shrink-0 p-3 space-y-1" style={{ borderTop: '1px solid #1E293B' }}>
        {/* User card */}
        {(!collapsed || mobile) && (
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2"
            style={{ background: '#0F172A', border: '1px solid #1E293B' }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user?.name || 'Admin'}</p>
              <p className="truncate text-xs" style={{ color: '#475569' }}>{user?.email || user?.phone}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${collapsed && !mobile ? 'justify-center' : ''}`}
          style={{ color: '#EF4444' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#F87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#EF4444'; }}
        >
          <LogOut size={16} className="shrink-0" />
          {(!collapsed || mobile) && <span>Logout</span>}
        </button>

        {/* Collapse toggle (desktop only) */}
        {!mobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
            style={{ color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#94A3B8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0B0F19' }}>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden transition-transform duration-300"
        style={{
          background: '#0D1117',
          borderRight: '1px solid #1E293B',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <SidebarContent mobile />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex flex-col shrink-0 transition-all duration-300"
        style={{
          width: collapsed ? '68px' : '232px',
          background: '#0D1117',
          borderRight: '1px solid #1E293B',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header
          className="flex items-center justify-between px-4 md:px-6 shrink-0"
          style={{
            minHeight: '60px',
            background: 'rgba(13,17,23,0.95)',
            borderBottom: '1px solid #1E293B',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Left: hamburger (mobile) + search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 shrink-0"
              style={{ color: '#64748B' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#94A3B8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
            >
              <Menu size={20} />
            </button>

            <div className="relative hidden sm:block max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: '#0F172A',
                  border: '1px solid #1E293B',
                  color: '#E2E8F0',
                }}
                onFocus={e => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                onBlur={e => { e.target.style.border = '1px solid #1E293B'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Right: live indicator + bell + avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>

            {/* Bell */}
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200"
              style={{ color: '#64748B' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#94A3B8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
            >
              <Bell size={18} />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ background: '#EF4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}
              />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2.5 pl-2" style={{ borderLeft: '1px solid #1E293B' }}>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-white leading-none">{user?.name || 'Admin'}</p>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                  {isSuperAdmin() ? 'Super Admin' : (hospitalName || 'Hospital Admin')}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
