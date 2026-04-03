import React, { useState, useEffect } from 'react';
import { History, Calendar, Clock, Building, ChevronRight, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../utils/motion';

// Stores & Services
import api from '../lib/api';

// Components
import PageLayout from '../layouts/PageLayout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';

const TokenHistory = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/tokens/history');
        // Backend success() wrapper: { success, data: [...] }
        const payload = res.data?.data ?? res.data;
        setTokens(Array.isArray(payload) ? payload : []);
      } catch {
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <PageLayout className="space-y-8 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="max-w-4xl mx-auto space-y-10 pb-12">
      <header className="flex items-center gap-6 px-2">
        <div className="h-16 w-16 flex items-center justify-center rounded-4xl bg-slate-800 text-white shadow-xl">
          <History size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-white font-display">Your History</h1>
          <p className="text-slate-400 font-medium">Review your past appointments and checkups.</p>
        </div>
      </header>

      <div className="space-y-6">
        {tokens.length === 0 ? (
          <Card className="p-16 text-center flex flex-col items-center justify-center border-none bg-slate-800/60 shadow-premium rounded-4xl">
            <div className="h-24 w-24 rounded-full bg-slate-700 flex items-center justify-center text-slate-500 mb-8">
              <Ticket size={48} />
            </div>
            <h3 className="text-2xl font-bold text-white font-display">No bookings found</h3>
            <p className="text-slate-400 max-w-xs mt-3 font-medium">You haven't booked any tokens yet. Your journey with SmartQ starts here.</p>
            <Link 
              to="/" 
              className="mt-10 px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
            >
              Book First Token
            </Link>
          </Card>
        ) : (
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4"
          >
            {tokens.map((token) => (
              <motion.div key={token._id} variants={shouldReduceMotion ? {} : fadeUp}>
                <Link to={`/status/${token._id}`} className="block group">
                  <Card className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 border-none bg-slate-800/60 shadow-premium hover:shadow-2xl hover:scale-[1.01] transition-all rounded-3xl group-hover:ring-2 group-hover:ring-primary/20">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                      <div className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">No.</span>
                        <span className="text-xl md:text-2xl font-black leading-none font-display">{token.tokenNumber}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building size={14} className="text-primary" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{token.hospitalId?.name}</span>
                        </div>
                        <h4 className="text-xl font-bold text-white">{token.serviceId?.name}</h4>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            {format(new Date(token.createdAt), 'MMM dd, yyyy')}
                          </span>
                          <div className="h-1 w-1 rounded-full bg-slate-600" />
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {format(new Date(token.createdAt), 'hh:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 md:mt-0 flex items-center justify-between md:justify-end gap-6 border-t border-slate-700 pt-6 md:border-0 md:pt-0">
                      <Badge variant={token.status === 'completed' ? 'success' : token.status === 'waiting' ? 'primary' : 'warning'}>
                        {token.status.toUpperCase()}
                      </Badge>
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-700 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ChevronRight size={20} className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
};

export default TokenHistory;
