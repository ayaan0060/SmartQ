import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Bell, Clock, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/useAuthStore';
import api from '../../lib/api';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatRelative = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
};

const PRIORITY_COLORS = {
  urgent:  'bg-red-50 text-red-700',
  high:    'bg-orange-50 text-orange-700',
  normal:  'bg-gray-100 text-gray-600',
};

const STATUS_COLORS = {
  pending:     'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed:   'bg-green-50 text-green-700',
};

const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-3 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/4 ml-auto" />
  </div>
);

export default function StaffDashboard() {
  const { user, hospitalName } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] || 'Staff';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [updatingTask, setUpdatingTask] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/staff-portal/tasks');
        setTasks(data.data || []);
      } catch { setTasks([]); }
      finally { setLoadingTasks(false); }
    })();

    (async () => {
      try {
        const { data } = await api.get('/staff-portal/announcements');
        setAnnouncements(data.data || []);
      } catch { setAnnouncements([]); }
      finally { setLoadingAnnouncements(false); }
    })();
  }, []);

  const markDone = async (taskId) => {
    setUpdatingTask(taskId);
    try {
      await api.patch(`/staff-portal/tasks/${taskId}/status`, { status: 'completed' });
      setTasks(ts => ts.map(t => t._id === taskId ? { ...t, status: 'completed' } : t));
    } catch { /* silent */ }
    finally { setUpdatingTask(null); }
  };

  const todayTasks = tasks.filter(t => {
    if (!t.date) return true;
    const d = new Date(t.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const pendingTasks    = todayTasks.filter(t => t.status !== 'completed').length;
  const unreadAnnounce  = announcements.filter(a => !a.isRead).length;
  const currentShift    = (() => {
    const h = new Date().getHours();
    if (h >= 6 && h < 14)  return 'Morning  6:00 AM – 2:00 PM';
    if (h >= 14 && h < 22) return 'Evening  2:00 PM – 10:00 PM';
    return 'Night  10:00 PM – 6:00 AM';
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-(--foreground)">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-(--muted) mt-1">
          {hospitalName || 'City General Hospital'} — {user?.wardAssigned || 'General Ward'}
        </p>
        <p className="text-xs text-(--muted) mt-0.5">{today}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: ClipboardList, label: 'My Tasks Today',  value: pendingTasks,      sub: 'pending', color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { icon: Bell,          label: 'Announcements',   value: unreadAnnounce,    sub: 'unread',  color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { icon: Clock,         label: 'My Shift',        value: null, shiftLabel: currentShift, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-500/10' },
        ].map(({ icon: Icon, label, value, sub, shiftLabel, color, bg }) => (
          <div key={label} className="bg-(--card) rounded-xl border border-(--border) p-5 flex items-center gap-4">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-xs text-(--muted) font-medium">{label}</p>
              {shiftLabel
                ? <p className="text-sm font-semibold text-(--foreground) leading-tight mt-0.5">{shiftLabel}</p>
                : <p className="text-2xl font-bold text-(--foreground)">{value} <span className="text-sm font-normal text-(--muted)">{sub}</span></p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Today's Tasks (60%) */}
        <div className="lg:col-span-3 bg-(--card) rounded-xl border border-(--border) p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-(--foreground)">Today's Tasks</h2>
            <Link to="/staff/tasks" className="text-xs text-(--smartq-red) font-semibold hover:underline flex items-center gap-0.5">
              View All <ChevronRight size={13} />
            </Link>
          </div>

          {loadingTasks ? (
            <div className="divide-y divide-(--border)">
              {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList size={36} className="text-(--muted) mb-3 opacity-50" />
              <p className="text-sm text-(--muted)">No tasks assigned for today</p>
            </div>
          ) : (
            <div className="divide-y divide-(--border)">
              {todayTasks.map(task => (
                <div key={task._id} className="flex items-start gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-(--foreground) truncate">{task.title}</p>
                    {task.dueTime && (
                      <p className="text-xs text-(--muted) mt-0.5">
                        {new Date(task.dueTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] || STATUS_COLORS.pending}`}>
                      {task.status === 'in_progress' ? 'In Progress' : task.status === 'completed' ? 'Done' : 'Pending'}
                    </span>
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => markDone(task._id)}
                        disabled={updatingTask === task._id}
                        className="text-[11px] font-semibold text-(--smartq-red) hover:underline disabled:opacity-50"
                      >
                        {updatingTask === task._id ? '...' : 'Mark Done'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Latest Announcements (40%) */}
        <div className="lg:col-span-2 bg-(--card) rounded-xl border border-(--border) p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-(--foreground)">Announcements</h2>
            <Link to="/staff/announcements" className="text-xs text-(--smartq-red) font-semibold hover:underline flex items-center gap-0.5">
              View All <ChevronRight size={13} />
            </Link>
          </div>

          {loadingAnnouncements ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell size={36} className="text-(--muted) mb-3 opacity-50" />
              <p className="text-sm text-(--muted)">No announcements</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.slice(0, 5).map(ann => (
                <div key={ann._id} className="border-b border-(--border) pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-(--foreground) truncate">{ann.title}</p>
                      <p className="text-xs text-(--muted) mt-0.5 line-clamp-2">{ann.message}</p>
                    </div>
                    {ann.priority === 'important' && (
                      <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-[10px] text-(--muted) mt-1">{formatRelative(ann.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
