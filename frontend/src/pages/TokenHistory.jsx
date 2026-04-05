import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Stethoscope, Download, History } from 'lucide-react';
import api from '../lib/api';
import PageLayout from '../layouts/PageLayout';
import Skeleton from '../components/Skeleton';

// TODO: Replace with real API data
const MOCK_STATS = { total: 24, completed: 21, cancelled: 3 };

export default function TokenHistory() {
  const [tokens, setTokens]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  useEffect(() => {
    api.get('/tokens/history')
      .then(r => {
        const payload = r.data?.data ?? r.data;
        setTokens(Array.isArray(payload) ? payload : []);
      })
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">Medical Records</span>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mt-2">Token History</h1>
            <p className="text-secondary text-sm mt-2 max-w-md">Detailed log of your clinical visits and diagnostic queues across the SmartQ network.</p>
          </div>

          {/* Date filter */}
          <div className="bg-surface-container-low p-4 rounded-2xl flex flex-wrap items-center gap-4 border-l-4 border-primary shadow-sm">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">Date Range</label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="bg-surface-container-lowest border-none rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-primary/20 outline-none text-on-surface" />
                <span className="text-zinc-400">to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="bg-surface-container-lowest border-none rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-primary/20 outline-none text-on-surface" />
              </div>
            </div>
            <button className="bg-primary-container text-on-primary-container px-6 py-2 rounded-xl font-bold text-sm h-fit self-end flex items-center gap-2 hover:opacity-90 transition-opacity">
              Apply
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Visits', value: tokens.length || MOCK_STATS.total, icon: Stethoscope, color: 'text-primary', bg: 'bg-primary/10', border: '' },
            { label: 'Completed',    value: tokens.filter(t => t.status === 'completed').length || MOCK_STATS.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-l-4 border-green-600' },
            { label: 'Cancelled',    value: tokens.filter(t => t.status === 'cancelled').length || MOCK_STATS.cancelled, icon: XCircle, color: 'text-zinc-400', bg: 'bg-zinc-100', border: '', dim: true },
          ].map(({ label, value, icon: Icon, color, bg, border, dim }) => (
            <div key={label} className={`bg-surface-container-low p-6 rounded-2xl ${border} ${dim ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
                  <h3 className="text-4xl font-black text-on-surface mt-1">{value}</h3>
                </div>
                <span className={`${bg} ${color} p-2 rounded-xl`}>
                  <Icon size={20} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 mb-4">
          {['Date & Time', 'Clinic / Facility', 'Token ID', 'Status', 'Documents'].map((h, i) => (
            <div key={h} className={`text-[10px] uppercase font-bold tracking-widest text-zinc-400 ${i === 0 ? 'col-span-2' : i === 1 ? 'col-span-4' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-2' : 'col-span-2 text-right'}`}>
              {h}
            </div>
          ))}
        </div>

        {/* History entries */}
        <div className="space-y-4">
          {tokens.length === 0 ? (
            <div className="text-center py-24">
              <History size={64} className="mx-auto text-outline-variant mb-4" />
              <h3 className="text-2xl font-black text-on-surface">No history yet</h3>
              <p className="text-secondary mt-2">Your token history will appear here after your first visit.</p>
            </div>
          ) : (
            tokens.map(token => (
              <motion.div
                key={token._id}
                whileHover={{ boxShadow: '0 4px 16px rgba(26,28,28,0.08)' }}
                className={`group bg-surface-container-lowest p-6 md:px-8 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 items-center gap-4 ${token.status === 'completed' ? 'border-l-4 border-primary' : ''}`}
              >
                <div className="col-span-2">
                  <p className="font-bold text-on-surface text-sm">{format(new Date(token.createdAt), 'MMM dd, yyyy')}</p>
                  <p className="text-zinc-500 text-xs">{format(new Date(token.createdAt), 'hh:mm a')}</p>
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <Stethoscope size={18} className={token.status === 'completed' ? 'text-primary' : 'text-zinc-400'} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">{token.hospitalId?.name || 'Hospital'}</p>
                    <p className="text-zinc-500 text-xs">{token.serviceId?.name || 'General'}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className={`font-mono font-black text-lg tracking-tighter ${token.status === 'completed' ? 'text-primary' : 'text-zinc-400'}`}>
                    #{token.tokenNumber}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    token.status === 'completed' ? 'bg-green-50 text-green-700' :
                    token.status === 'cancelled' ? 'bg-zinc-100 text-zinc-500' :
                    'bg-primary-fixed text-primary'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                      token.status === 'completed' ? 'bg-green-500' :
                      token.status === 'cancelled' ? 'bg-zinc-400' : 'bg-primary'
                    }`} />
                    {token.status.charAt(0).toUpperCase() + token.status.slice(1)}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  {token.status === 'completed' ? (
                    <button className="inline-flex items-center gap-2 text-primary hover:text-primary-container font-bold text-sm transition-colors">
                      <Download size={14} /> Receipt
                    </button>
                  ) : (
                    <button className="inline-flex items-center gap-2 text-zinc-400 cursor-not-allowed font-bold text-sm">
                      N/A
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {tokens.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button className="px-8 py-3 rounded-2xl border-2 border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2">
              <History size={16} /> Load More Records
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
