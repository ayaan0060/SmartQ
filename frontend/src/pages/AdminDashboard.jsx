import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { Users, CheckCircle2, XCircle, RefreshCcw, Play, Terminal, Building2, MapPin } from 'lucide-react';
import { staggerContainer, fadeUp } from '../utils/motion';

// Stores & Hooks
import { useAuthStore } from '../features/auth/useAuthStore';
import { useQueue } from '../features/hospital/useQueue';
import { HospitalService } from '../features/hospital/HospitalService';
import api from '../lib/api';

// Components
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import QueueList from '../components/QueueList';
import PageLayout from '../layouts/PageLayout';
import HeroHeader from '../components/HeroHeader';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState('');
  const [services, setServices] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  // Auth & Initial Data
  useEffect(() => {
    const adminRoles = ['super-admin', 'hospital-admin', 'staff'];
    if (!user || !adminRoles.includes(user.role)) {
      navigate('/');
      return;
    }

    const loadInitialData = async () => {
      try {
        const [servicesData, hospitalRes] = await Promise.all([
          HospitalService.getHospitalServices(user.hospitalId),
          api.get(`/hospitals/${user.hospitalId}`)
        ]);
        setServices(servicesData);
        if (servicesData.length > 0) setSelectedService(servicesData[0]._id);
        // Hospital endpoint returns { data: { hospital, stats } }
        const hospitalPayload = hospitalRes.data?.data?.hospital ?? hospitalRes.data?.data ?? hospitalRes.data;
        setHospital(hospitalPayload);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoadingServices(false);
      }
    };
    loadInitialData();
  }, [user, navigate]);

  const { queue: tokens } = useQueue(user?.hospitalId, selectedService);

  const handleStatusUpdate = async (tokenId, status) => {
    try {
      const promise = api.patch(`/tokens/${tokenId}`, { status });
      await toast.promise(promise, {
        loading: 'Updating status...',
        success: 'Queue updated!',
        error: 'Failed to update token',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const stats = useMemo(() => {
    const current = tokens.find(t => t.status === 'in-progress');
    const waiting = tokens.filter(t => t.status === 'waiting');
    const completed = tokens.filter(t => t.status === 'completed').length;
    return { current, waiting, completed };
  }, [tokens]);

  if (loadingServices) {
    return (
      <PageLayout className="space-y-12 py-10">
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <Skeleton className="h-[500px] rounded-4xl" />
      </PageLayout>
    );
  }

  if (!user?.hospitalId) {
    return (
      <PageLayout className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-24 w-24 rounded-[2.5rem] bg-amber-50 flex items-center justify-center text-amber-500 mb-8 border-2 border-amber-100/50">
          <CheckCircle2 size={48} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 font-display">No Hospital Assigned</h3>
        <p className="text-slate-500 max-w-sm mt-4 text-lg font-medium">Your administrator account has not been linked to a specific hospital yet.</p>
        <Button onClick={() => navigate('/')} className="mt-10">
          Return Home
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="space-y-12 pb-20">
      {/* Hospital Identity Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Building2 size={28} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">You are managing</p>
            <h2 className="text-2xl font-black text-white font-display">
              {hospital?.name ?? 'Loading…'}
            </h2>
            {hospital?.location && (
              <p className="text-sm text-slate-400 font-bold flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" />
                {hospital.location}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-black">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-black text-white">{user?.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hospital Admin</p>
          </div>
        </div>
      </div>

      <HeroHeader 
        title="Command Center" 
        subtitle={`Real-time queue management for ${hospital?.name ?? 'your hospital'}.`}
        icon={Terminal}
        iconClassName="bg-slate-900 text-white"
      >
        <div className="w-full max-w-sm mt-8 mx-auto">
          <div className="relative group">
            <select 
              value={selectedService} 
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl px-6 text-base font-black text-slate-700 shadow-premium-subtle focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all appearance-none cursor-pointer"
            >
              {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-primary transition-colors">
              <RefreshCcw size={20} />
            </div>
          </div>
        </div>
      </HeroHeader>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-8 md:grid-cols-3"
      >
        {[
          { label: 'Total Tokens', value: tokens.length, color: 'slate' },
          { label: 'Waiting', value: stats.waiting.length, color: 'primary' },
          { label: 'Completed', value: stats.completed, color: 'success' }
        ].map((stat, idx) => (
          <motion.div key={idx} variants={shouldReduceMotion ? {} : fadeUp}>
            <Card hoverable className="p-6 md:p-10 border-none bg-white shadow-premium flex flex-col items-center justify-center gap-4 group h-full rounded-[2.5rem]">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</span>
              <span className={`text-6xl font-black font-display leading-none text-${stat.color === 'slate' ? 'slate-900' : stat.color}`}>
                {stat.value}
              </span>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="h-full min-h-[600px] flex flex-col border-none bg-white shadow-premium overflow-hidden rounded-[3rem]">
            <div className="border-b border-slate-50 bg-slate-50/50 px-6 md:px-10 py-6 md:py-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                Active Serving Station
              </h3>
            </div>
            
            <div className="grow flex flex-col items-center justify-center p-6 sm:p-8 md:p-12" aria-live="important">
              {stats.current ? (
                <div className="w-full max-w-md text-center space-y-16">
                  <div className="animate-in zoom-in duration-700 scale-110">
                    <div className="inline-block relative">
                      <div className="text-[8rem] sm:text-[10rem] md:text-[12rem] leading-none font-black tracking-tighter text-slate-900 font-display drop-shadow-2xl">
                        {stats.current.tokenNumber}
                      </div>
                      <Badge variant="primary" className="absolute -top-6 -right-12 px-5 py-2 text-lg rounded-2xl shadow-2xl shadow-primary/30 font-black uppercase tracking-widest border-2 border-white">
                        Serving
                      </Badge>
                    </div>
                    <div className="mt-8 space-y-2">
                      <p className="text-3xl font-black text-slate-900 font-display">{stats.current.userId?.name || 'Guest User'}</p>
                      <p className="text-base font-bold text-slate-400 uppercase tracking-widest">Priority Lane Access</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-12 w-full">
                    <Button 
                      onClick={() => handleStatusUpdate(stats.current._id, 'completed')}
                      className="h-20 bg-success hover:bg-emerald-600 border-none shadow-2xl shadow-success/20 rounded-3xl text-lg font-black"
                      leftIcon={<CheckCircle2 size={28} />}
                    >
                      Complete
                    </Button>
                    <Button 
                      onClick={() => handleStatusUpdate(stats.current._id, 'skipped')}
                      variant="outline"
                      className="h-20 rounded-3xl hover:bg-slate-50 border-2 border-slate-100 text-slate-600 text-lg font-black"
                      leftIcon={<XCircle size={28} />}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-10 max-w-sm mx-auto">
                  <div className="relative mx-auto h-40 w-40 sm:h-48 sm:w-48 rounded-[3rem] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
                    <Users size={80} />
                    <div className="absolute inset-0 rounded-[3rem] border-4 border-dashed border-slate-200 animate-[spin_20s_linear_infinite]" />
                  </div>
                  <div className="space-y-4 px-4">
                    <h4 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">Ready for Next</h4>
                    <p className="text-sm sm:text-base font-medium text-slate-400">The counter is standing by. Call the next patient to begin consultation.</p>
                  </div>
                  {stats.waiting.length > 0 && (
                    <Button 
                      onClick={() => handleStatusUpdate(stats.waiting[0]._id, 'in-progress')}
                      className="w-full h-20 text-xl font-black rounded-3xl shadow-2xl shadow-primary/30 group hover:scale-[1.05] transition-all"
                      leftIcon={<Play size={32} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />}
                    >
                      Serve Next Patient
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-slate-900 p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 w-12 rounded-2xl border-4 border-slate-900 bg-slate-800 shadow-lg" />
                ))}
                <div className="h-12 w-12 rounded-2xl border-4 border-slate-900 bg-primary text-white text-xs font-black flex items-center justify-center shadow-lg">
                  +{stats.waiting.length}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Real-time Synchronization Active
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <QueueList tokens={tokens} currentTokenId={stats.current?._id} />
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminDashboard;
