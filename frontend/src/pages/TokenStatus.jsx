import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Info, AlertCircle, Clock, CheckCircle2, Ticket, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../utils/motion';

// Stores & Services
import api from '../lib/api';
import socket from '../lib/socket';

// Components
import PageLayout from '../layouts/PageLayout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
import QueueList from '../components/QueueList';
import HeroHeader from '../components/HeroHeader';

const TokenStatus = () => {
  const { tokenId } = useParams();
  const [token, setToken] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!token?.tokenNumber) return;
    navigator.clipboard.writeText(token.tokenNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchQueue = useCallback(async (hospitalId, serviceId) => {
    try {
      const res = await api.get(`/tokens/status/${hospitalId}/${serviceId}`);
      // Backend now uses success() wrapper: { data: [...] }
      const payload = res.data?.data ?? res.data;
      setQueue(Array.isArray(payload) ? payload : []);
    } catch {
      console.error('Queue error');
    }
  }, []);

  const fetchToken = useCallback(async () => {
    try {
      const res = await api.get(`/tokens/${tokenId}`);
      // Backend now uses success() wrapper: { data: token }
      const tokenData = res.data?.data ?? res.data;
      setToken(tokenData);
      if (tokenData?.hospitalId) {
        const hId = tokenData.hospitalId._id || tokenData.hospitalId;
        const sId = tokenData.serviceId._id || tokenData.serviceId;
        if (!socket.connected) socket.connect();
        socket.emit('joinHospital', hId);
        // Join personal token room for direct notifications
        socket.emit('join:token', tokenData._id);
        fetchQueue(hId, sId);
      }
    } catch {
      toast.error('Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, [tokenId, fetchQueue]);

  useEffect(() => {
    fetchToken();

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleQueueUpdate = (updated) => {
      // If this update is for our token, update it directly
      if (updated?._id === token?._id || updated?.tokenNumber === token?.tokenNumber) {
        setToken(prev => ({ ...prev, ...updated }));
      }
      fetchToken();
    };

    const handleTokenCalled = ({ message }) => {
      toast.success(`🔔 ${message}`, { duration: 8000 });
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('SmartQ — Your Turn!', {
          body: message,
          icon: '/favicon.svg',
        });
      }
      setToken(prev => prev ? { ...prev, status: 'in-progress' } : prev);
    };

    const handleTokenDone = ({ status, message }) => {
      toast(message, { icon: status === 'completed' ? '✅' : '⏭️', duration: 6000 });
      setToken(prev => prev ? { ...prev, status } : prev);
    };

    socket.on('queue:update', handleQueueUpdate);
    socket.on('queue:add',    fetchToken);
    socket.on('token:called', handleTokenCalled);
    socket.on('token:done',   handleTokenDone);
    // legacy event support
    socket.on('queueUpdated', fetchToken);

    return () => {
      socket.off('queue:update', handleQueueUpdate);
      socket.off('queue:add',    fetchToken);
      socket.off('token:called', handleTokenCalled);
      socket.off('token:done',   handleTokenDone);
      socket.off('queueUpdated', fetchToken);
    };
  }, [fetchToken, token?._id, token?.tokenNumber]);

  if (loading) {
    return (
      <PageLayout className="space-y-12">
        <Skeleton className="h-64 rounded-4xl" />
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-96 rounded-4xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
          <Skeleton className="h-[600px] rounded-4xl" />
        </div>
      </PageLayout>
    );
  }

  if (!token) {
    return (
      <PageLayout className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-24 w-24 rounded-[2.5rem] bg-red-50 flex items-center justify-center text-red-500 mb-8 border-2 border-red-100/50">
          <AlertCircle size={48} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 font-display">Token Expired</h3>
        <p className="text-slate-500 max-w-sm mt-4 text-lg font-medium">The requested token session has either ended or could not be found in our records.</p>
        <Link to="/dashboard" className="mt-10">
          <Badge variant="primary" className="px-8 py-4 text-base rounded-2xl hover:scale-105 transition-transform">
            Return to Dashboard
          </Badge>
        </Link>
      </PageLayout>
    );
  }

  const isCompleted = token.status === 'completed';
  const isCalled = token.status === 'in-progress';
  const isSkipped = token.status === 'skipped';

  return (
    <PageLayout className="mx-auto max-w-6xl space-y-12 pb-24">
      <Link to="/dashboard" className="inline-flex items-center text-sm font-black text-slate-400 hover:text-primary transition-all gap-3 group px-4">
        <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        </div>
        BACK TO OVERVIEW
      </Link>

      <HeroHeader 
        title={token.serviceId?.name}
        subtitle={`Live monitoring for your queue position at ${token.hospitalId?.name || 'the clinic'}.`}
        icon={Ticket}
        iconClassName={isCompleted ? 'bg-success text-white' : 'bg-primary text-white'}
      />

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-12 lg:grid-cols-3"
      >
        <div className="lg:col-span-2 space-y-12">
          <motion.div variants={shouldReduceMotion ? {} : fadeUp}>
            <Card className="overflow-hidden border-none shadow-premium-dark p-0 rounded-[3rem]">
              <div className={`p-12 md:p-20 text-center space-y-10 ${
                isCompleted ? 'bg-success/10' : isCalled ? 'bg-yellow-500/10' : isSkipped ? 'bg-red-500/10' : 'bg-slate-800/60'
              }`} aria-live="polite">

                {/* Called banner */}
                {isCalled && (
                  <div className="animate-bounce rounded-2xl bg-yellow-500/20 border border-yellow-500/40 px-6 py-3 text-yellow-300 font-black text-sm tracking-wide">
                    🔔 YOUR TURN — PLEASE PROCEED TO THE COUNTER
                  </div>
                )}
                <div className="flex justify-center">
                  <Badge 
                    variant={isCompleted ? 'success' : 'primary'} 
                    className={`px-6 py-2 rounded-full uppercase tracking-[0.2em] font-black text-[10px] border-2 ${isCompleted ? 'border-success/20' : 'border-primary/20'}`}
                  >
                    {token.status.replace('-', ' ')}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <h2 className={`text-[8rem] sm:text-[10rem] md:text-[12rem] leading-none font-black tracking-tighter drop-shadow-2xl font-display ${
                    isCompleted ? 'text-success' : isCalled ? 'text-yellow-400' : isSkipped ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {token.tokenNumber}
                  </h2>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-sm sm:text-base font-black text-slate-300 uppercase tracking-widest">Your Private Access Key</p>
                    <button
                      onClick={handleCopy}
                      title="Copy token"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10"
                    >
                      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-10 pt-4">
                  <div className="text-center group">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Wait Time</div>
                    <div className="text-3xl font-black text-white font-display mt-1">~12m</div>
                  </div>
                  <div className="w-px h-12 bg-white/20" />
                  <div className="text-center group">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Current Position</div>
                    <div className="text-3xl font-black text-white font-display mt-1">#{token.position || '2'}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 md:p-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/80">
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10 flex items-center justify-center text-slate-300 shadow-inner">
                    <Clock size={28} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reservation Time</div>
                    <div className="text-base font-black text-white mt-0.5">{new Date(token.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
                {isCompleted ? (
                  <div className="flex items-center gap-3 text-success font-black text-xs sm:text-sm md:text-base bg-success/10 px-6 py-3 rounded-2xl border border-success/20 w-full md:w-auto justify-center">
                    <CheckCircle2 size={24} />
                    CONSULTATION FINISHED
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                    <div className="h-3 w-3 rounded-full bg-primary animate-ping" />
                    <span className="text-sm font-black text-primary uppercase tracking-widest">Updating Live</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={shouldReduceMotion ? {} : fadeUp}>
            <Card className="bg-slate-900 border-none p-6 md:p-10 flex flex-col md:flex-row gap-8 rounded-[2.5rem] relative overflow-hidden group hover:scale-[1.01] transition-transform">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] -mr-32 -mt-32 rounded-full" />
              <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-white/10 text-white shadow-2xl backdrop-blur-xl border border-white/10">
                <Info size={32} />
              </div>
              <div className="relative z-10 space-y-3">
                <h4 className="text-xl font-black text-white font-display uppercase tracking-tight">Real-time Stream Active</h4>
                <p className="text-base text-slate-400 font-medium leading-relaxed max-w-xl">
                  Maintain this connection for instant status pushes. Our system will trigger haptic feedback and visual alerts the moment your token is called by the medical officer.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={shouldReduceMotion ? {} : fadeUp} className="lg:col-span-1">
          <QueueList tokens={queue} currentTokenId={token._id} />
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default TokenStatus;
