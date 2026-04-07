import React, { useEffect, useRef, useState } from 'react';
import { Menu, Moon, Sun, Bell, X, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';
import { useTheme } from '../hooks/useTheme';
import { useNotificationStore } from '../store/notificationStore';
import { getSocket } from '../services/socket';

// ── Notification type → icon colour ──────────────────────────────────────────
const typeColour = {
  appointment: '#3B82F6',
  queue:       '#10B981',
  emergency:   '#EF4444',
  general:     '#8B5CF6',
  system:      '#6B7280',
};

// Minimal relative-time helper (no external dependency)
function ago(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return '';
  }
}

export default function TopBar({ title, subtitle, onMenuClick }) {
  const { user } = useAuthStore();
  const { theme, toggle } = useTheme();
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();
  const fetchRef = useRef(useNotificationStore.getState().fetch);
  const pushRef  = useRef(useNotificationStore.getState().push);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Fetch notifications on mount
  useEffect(() => {
    if (user?._id) fetchRef.current();
  }, [user?._id]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?._id) return;
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    // Join personal room
    const joinRoom = () => socket.emit('join:user', user._id);
    joinRoom();
    socket.on('connect', joinRoom);

    socket.on('notification:new', (notification) => {
      pushRef.current(notification);
    });

    return () => {
      socket.off('connect', joinRoom);
      socket.off('notification:new');
    };
  }, [user?._id]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <header className="h-16 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-50 border-b border-(--border) flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button onClick={onMenuClick} className="lg:hidden text-(--muted) hover:text-(--foreground)">
            <Menu size={22} />
          </button>
        )}
        <div>
          {title    && <h2 className="text-lg font-bold text-(--foreground) tracking-tight">{title}</h2>}
          {subtitle && <p className="text-xs text-(--muted)">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          {theme === 'dark'
            ? <Sun  size={18} className="text-(--muted)" />
            : <Moon size={18} className="text-(--muted)" />}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-(--muted)" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 text-[9px] font-black bg-(--smartq-red) text-white rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-(--card) border border-(--border) rounded-2xl shadow-xl overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-(--border)">
                <span className="text-sm font-bold text-(--foreground)">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-(--smartq-red) font-semibold hover:opacity-80"
                    >
                      <CheckCheck size={13} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-(--muted) hover:text-(--foreground)">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-(--border)">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={28} className="mx-auto mb-2 text-(--muted) opacity-30" />
                    <p className="text-sm text-(--muted)">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n._id}
                      onClick={() => !n.read && markRead(n._id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex gap-3 items-start ${!n.read ? 'bg-blue-50/40 dark:bg-blue-500/5' : ''}`}
                    >
                      {/* dot */}
                      <span
                        className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                        style={{ background: n.read ? 'transparent' : (typeColour[n.type] || typeColour.general) }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-(--foreground) leading-snug">{n.title}</p>
                        <p className="text-xs text-(--muted) mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-(--muted) opacity-60 mt-1">{ago(n.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-(--border)">
          <div className="w-8 h-8 rounded-full bg-(--smartq-red) flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:block text-sm font-medium text-(--foreground)">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
