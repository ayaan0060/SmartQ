import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const TABS = ['All', 'Pending', 'In Progress', 'Completed'];

const STATUS_MAP = {
  'Pending':     'pending',
  'In Progress': 'in_progress',
  'Completed':   'completed',
};

const STATUS_COLORS = {
  pending:     'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed:   'bg-green-50 text-green-700',
};

const PRIORITY_COLORS = {
  normal: 'bg-gray-100 text-gray-600',
  high:   'bg-orange-50 text-orange-700',
  urgent: 'bg-red-50 text-red-700',
};

const SkeletonCard = () => (
  <div className="bg-(--card) rounded-xl border border-(--border) p-5 animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-full" />
    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
    <div className="flex gap-2 pt-1">
      <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-16" />
      <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-20 ml-auto" />
    </div>
  </div>
);

export default function StaffTasks() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/staff-portal/tasks');
        setTasks(data.data || []);
      } catch { setTasks([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const updateStatus = useCallback(async (taskId, status) => {
    setUpdating(taskId + status);
    try {
      await api.patch(`/staff-portal/tasks/${taskId}/status`, { status });
      setTasks(ts => ts.map(t => t._id === taskId ? { ...t, status } : t));
    } catch { /* silent */ }
    finally { setUpdating(null); }
  }, []);

  const filtered = tasks.filter(t => {
    if (activeTab === 'All') return true;
    return t.status === STATUS_MAP[activeTab];
  });

  const emptyMessages = {
    All:         'No tasks assigned yet',
    Pending:     'No pending tasks — you\'re all caught up!',
    'In Progress': 'No tasks currently in progress',
    Completed:   'No completed tasks yet',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg px-2 py-1.5 transition-all"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-(--foreground) mb-6">My Tasks</h1>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-white/10 text-(--foreground) shadow-sm'
                : 'text-(--muted) hover:text-(--foreground)'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList size={40} className="text-(--muted) mb-3 opacity-40" />
          <p className="text-sm text-(--muted)">{emptyMessages[activeTab]}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(task => (
            <div key={task._id} className="bg-(--card) rounded-xl border border-(--border) p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-semibold text-(--foreground)">{task.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  {task.priority && (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal}`}>
                      {task.priority}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] || STATUS_COLORS.pending}`}>
                    {task.status === 'in_progress' ? 'In Progress' : task.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-(--muted) line-clamp-2 mb-3">{task.description}</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--muted) mb-4">
                {task.assignedBy?.name && <span>Assigned by <span className="font-medium text-(--foreground)">{task.assignedBy.name}</span></span>}
                {task.dueTime && (
                  <span>Due <span className="font-medium text-(--foreground)">
                    {new Date(task.dueTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span></span>
                )}
              </div>

              {task.status !== 'completed' && (
                <div className="flex gap-2">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(task._id, 'in_progress')}
                      disabled={!!updating}
                      className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-50"
                    >
                      {updating === task._id + 'in_progress' ? '...' : 'Start'}
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(task._id, 'completed')}
                    disabled={!!updating}
                    className="px-4 py-2 bg-(--smartq-red) text-white rounded-lg text-sm font-semibold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {updating === task._id + 'completed' ? '...' : 'Mark Done'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
