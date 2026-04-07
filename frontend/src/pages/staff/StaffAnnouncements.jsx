import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Bell, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const TABS = ['All', 'Unread', 'Important'];

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const formatRelative = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const SkeletonCard = () => (
  <div className="bg-(--card) rounded-xl border border-(--border) p-5 animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-full" />
    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/3" />
  </div>
);

export default function StaffAnnouncements() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/staff-portal/announcements');
        setAnnouncements(data.data || []);
      } catch { setAnnouncements([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/staff-portal/announcements/${id}/read`);
      setAnnouncements(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch { /* silent */ }
  };

  const filtered = announcements.filter(a => {
    if (activeTab === 'Unread')    return !a.isRead;
    if (activeTab === 'Important') return a.priority === 'important';
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg px-2 py-1.5 transition-all"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-(--foreground) mb-6">Announcements</h1>

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
            {tab === 'Unread' && announcements.filter(a => !a.isRead).length > 0 && (
              <span className="ml-1.5 bg-(--smartq-red) text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {announcements.filter(a => !a.isRead).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell size={40} className="text-(--muted) mb-3 opacity-40" />
          <p className="text-sm text-(--muted)">No announcements yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(ann => (
            <div
              key={ann._id}
              onClick={() => { if (!ann.isRead) markRead(ann._id); }}
              className={`bg-(--card) rounded-xl border p-5 transition-all cursor-default ${
                !ann.isRead
                  ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50/30 dark:bg-blue-500/5'
                  : 'border-(--border)'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-(--foreground)">{ann.title}</h3>
                    {ann.priority === 'important' && (
                      <span className="flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <AlertCircle size={10} /> Important
                      </span>
                    )}
                    {!ann.isRead && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
                    )}
                  </div>

                  {/* Posted by */}
                  <p className="text-xs text-(--muted) mt-0.5">
                    Posted by <span className="font-medium text-(--foreground)">{ann.postedBy?.name || 'Admin'}</span>
                    {ann.postedBy?.role && ` · ${ann.postedBy.role}`}
                    {' · '}{formatDate(ann.createdAt)}
                    {'  '}<span className="opacity-60">({formatRelative(ann.createdAt)})</span>
                  </p>
                </div>
              </div>

              {/* Body */}
              <p className="text-sm text-(--foreground)/80 leading-relaxed whitespace-pre-line">{ann.message}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
