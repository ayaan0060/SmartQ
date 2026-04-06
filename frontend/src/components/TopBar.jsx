import React from 'react';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';
import { useTheme } from '../hooks/useTheme';

export default function TopBar({ title, subtitle, onMenuClick }) {
  const { user } = useAuthStore();
  const { theme, toggle } = useTheme();

  return (
    <header className="h-16 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-50 border-b border-(--border) flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button onClick={onMenuClick} className="lg:hidden text-(--muted) hover:text-(--foreground)">
            <Menu size={22} />
          </button>
        )}
        <div>
           {title && <h2 className="text-lg font-bold text-(--foreground) tracking-tight">{title}</h2>}
           {subtitle && <p className="text-xs text-(--muted)">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
           {theme === 'dark' ? <Sun size={18} className="text-(--muted)" /> : <Moon size={18} className="text-(--muted)" />}
        </button>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
           <Bell size={18} className="text-(--muted)" />
        </button>
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
