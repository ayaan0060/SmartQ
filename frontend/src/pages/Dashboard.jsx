import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Clock, Star, ShieldCheck, Users, ArrowRight, Building2 } from 'lucide-react';
import { staggerContainer, fadeUp } from '../utils/motion';

// Stores & Services
import { useAuthStore } from '../features/auth/useAuthStore';
import { useHospitalStore } from '../features/hospital/useHospitalStore';
import { HospitalService } from '../features/hospital/HospitalService';
import api from '../lib/api';

// Components
import ServiceCard from '../components/ServiceCard';
import Skeleton from '../components/Skeleton';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import PageLayout from '../layouts/PageLayout';
import PaymentModal from '../components/PaymentModal';
import EmergencyButton from '../components/EmergencyButton';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedHospital } = useHospitalStore();
  const [paymentModal, setPaymentModal] = useState({ open: false, data: null });

  // ✅ FIX 1: Call useReducedMotion as a hook (was imported but never called)
  const shouldReduceMotion = useReducedMotion();

  // Redirect admin users to the admin panel
  useEffect(() => {
    const adminRoles = ['super-admin', 'hospital-admin', 'staff'];
    if (user && adminRoles.includes(user.role)) {
      navigate('/admin');
    }
  }, [user, navigate]);

  // Fetch services using TanStack Query
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', selectedHospital?._id],
    queryFn: async () => {
      const data = await HospitalService.getHospitalServices(selectedHospital?._id);
      return Array.isArray(data) ? data : (data ?? []);
    },
    enabled: !!selectedHospital?._id,
  });

  // ✅ FIX 2: Define handleBookToken (was used in JSX but never defined)
  const handleBookToken = async (service) => {
    try {
      const res = await api.post('/tokens/book', {
        serviceId: service._id,
        hospitalId: selectedHospital?._id,
      });
      setPaymentModal({ open: true, data: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to book token. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <PageLayout className="space-y-12 py-10">
        <Skeleton className="h-64 rounded-4xl" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-4xl" />)}
        </div>
      </PageLayout>
    );
  }

  if (!selectedHospital) return null;

  return (
    <PageLayout className="space-y-16 pb-20">
      {/* Emergency Button */}
      <EmergencyButton hospitalId={selectedHospital?._id} />

      {/* Quick ambulance booking link */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚑</span>
          <div>
            <p className="text-sm font-bold text-white">Book an Ambulance</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Track live — like Uber, for emergencies</p>
          </div>
        </div>
        <a
          href="/ambulance"
          className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
          style={{ background: '#DC2626' }}
        >
          Request
        </a>
      </div>

      {/* Premium Hero Header */}
      <header className="relative overflow-hidden rounded-[3rem] bg-slate-900 border-none shadow-premium-dark p-10 md:p-16 text-white">
        <div className="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-12">
          <div className="space-y-8 max-w-2xl">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-lg">
                <Building2 size={32} className="text-primary" />
              </div>
              <div>
                <Badge variant="primary" className="bg-white/10 text-white border-white/20 backdrop-blur-md uppercase tracking-[0.15em] text-[10px] font-black py-1.5">
                  Verified Partner
                </Badge>
                <div className="flex items-center gap-2 mt-1 text-yellow-500">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-black tracking-tight">{selectedHospital?.rating || '4.8'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter font-display leading-[0.9]">
                {selectedHospital?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-8 pt-2">
                <div className="flex items-center gap-2.5 group">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <MapPin size={20} className="text-primary group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-base font-bold text-slate-400 group-hover:text-white transition-colors">{selectedHospital?.location}</span>
                </div>
                <div className="flex items-center gap-2.5 group">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-success transition-colors">
                    <Clock size={20} className="text-success group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-base font-bold text-slate-400 group-hover:text-white transition-colors">{selectedHospital?.timings}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            className="h-14 md:h-20 rounded-4xl px-10 text-lg font-black group bg-white text-slate-900 border-none shadow-2xl hover:bg-primary hover:text-white transition-all scale-100 hover:scale-[1.05]"
          >
            Hospital Stats
            <ArrowRight size={24} className="ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-8 md:grid-cols-3"
      >
        {[
          { icon: Users, label: 'Active Services', value: services.length, color: 'primary' },
          { icon: Clock, label: 'Average Wait', value: '~12m', color: 'success' },
          { icon: ShieldCheck, label: 'Safety Priority', value: 'High', color: 'warning' }
        ].map((stat, idx) => (
          <motion.div key={idx} variants={shouldReduceMotion ? {} : fadeUp}>
            <Card hoverable className="p-6 md:p-8 border-none bg-white shadow-premium-subtle flex items-center gap-4 md:gap-6 rounded-[2.5rem] group h-full">
              <div className={`h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-2xl bg-${stat.color}/10 text-${stat.color} flex items-center justify-center group-hover:bg-${stat.color} group-hover:text-white transition-all shadow-sm`}>
                <stat.icon size={28} className="md:w-8 md:h-8" />
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-black text-slate-900 leading-none font-display tracking-tight">{stat.value}</div>
                <div className="mt-1 md:mt-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Services Section */}
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-6">
            <div className="h-14 w-2 bg-primary rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]" />
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 font-display">Available Services</h2>
              <p className="text-base font-medium text-slate-500">Pick a department and skip the physical queue instantly.</p>
            </div>
          </div>
          <Badge variant="neutral" className="bg-slate-100 text-slate-500 border-none font-black text-[10px] uppercase tracking-widest px-4 py-2">
            Real-time Availability
          </Badge>
        </div>
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* ✅ FIX 3: Replaced undefined `memoizedServices` with `services` */}
          {services.map((service) => (
            <motion.div key={service._id} variants={shouldReduceMotion ? {} : fadeUp}>
              <ServiceCard 
                service={service} 
                onBook={handleBookToken} 
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <PaymentModal
        isOpen={paymentModal.open}
        paymentData={paymentModal.data}
        onClose={() => setPaymentModal({ open: false, data: null })}
      />
    </PageLayout>
  );
};

export default Dashboard;
