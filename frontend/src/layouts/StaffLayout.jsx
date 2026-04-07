import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { X } from 'lucide-react';
import ReceptionistSidebar from './sidebars/ReceptionistSidebar';
import NurseSidebar from './sidebars/NurseSidebar';
import StaffSidebar from './sidebars/StaffSidebar';
import TopBar from '../components/TopBar';
import { useAuthStore } from '../features/auth/useAuthStore';

const SIDEBAR_MAP = {
  receptionist: ReceptionistSidebar,
  nurse: NurseSidebar,
  staff: StaffSidebar,
};

export default function StaffLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, hospitalName } = useAuthStore();

  const SidebarComponent = SIDEBAR_MAP[user?.role] || ReceptionistSidebar;

  const roleLabel = {
    receptionist: 'Front Desk',
    nurse: 'Nursing Station',
    staff: 'Staff Portal',
  }[user?.role] || 'Staff Portal';

  return (
    <div className="flex h-screen bg-(--bg)">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-60 lg:hidden transition-transform duration-300 bg-(--card) border-r border-(--border)"
        style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-(--muted)">
          <X size={18} />
        </button>
        <SidebarComponent mobile onClose={() => setMobileOpen(false)} />
      </aside>

       {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-(--card) border-r border-(--border) h-screen sticky top-0">
        <SidebarComponent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar
          title={hospitalName || 'SmartQ'}
          subtitle={roleLabel}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
