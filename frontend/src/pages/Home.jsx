import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ShieldCheck, Zap, Heart, Brain,
  Wifi, Lock, LogOut, QrCode, Moon, Sun, X, Stethoscope,
} from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';
import { AuthService } from '../features/auth/AuthService';
import { useTheme } from '../hooks/useTheme';
import Footer from '../components/Footer';

// TODO: Replace with real API data
const MOCK_STATS = { responseImprovement: '-42%', nodesMonitored: '1,240', uptime: '99.999%' };

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { theme, toggle } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);

  const handleLogout = () => { AuthService.logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-200/10 dark:border-zinc-700/30 glass-nav shadow-sm flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-black italic text-red-700 dark:text-red-400 tracking-tight">SmartQ</span>
          <div className="hidden md:flex gap-6 items-center">
            <Link to="/" className="text-red-700 dark:text-red-400 font-bold border-b-2 border-red-700 dark:border-red-400 text-sm">Home</Link>
            <Link to="/for-hospitals" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors px-3 py-1 rounded-md text-sm">For Hospitals</Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors px-3 py-1 rounded-md text-sm">Dashboard</Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-on-surface-variant" />}
          </button>

          {isAuthenticated ? (
            <>
              <span className="text-sm font-semibold text-secondary hidden sm:block">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-error hover:bg-error-container/30 transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="bg-primary text-on-primary px-5 py-2 rounded-2xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/10 text-primary font-bold text-xs uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Clinical Grade Intelligence
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-on-surface tracking-tight leading-[0.95] mb-8">
              Precision <span className="text-primary italic">Intelligence</span><br />for Life.
            </h1>
            <p className="text-xl text-secondary max-w-xl leading-relaxed mb-10">
              Transforming emergency response through automated triage, real-time vitals monitoring, and hyper-efficient clinical workflows.
            </p>
            <div className="flex flex-wrap gap-4">
              {isAuthenticated && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/dashboard" className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold text-lg hover:shadow-xl transition-all inline-flex items-center gap-2">
                    Open Dashboard
                    <ArrowRight size={18} />
                  </Link>
                </motion.div>
              )}
              {!isAuthenticated && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/register" className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold text-lg hover:shadow-xl transition-all inline-flex items-center gap-2">
                    Get Started Free
                    <ArrowRight size={18} />
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>

          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700">
              <div className="w-full h-[500px] bg-linear-to-br from-primary-container to-primary flex items-center justify-center">
                <div className="text-center text-on-primary">
                  <Heart size={80} className="mx-auto mb-4 opacity-80" />
                  <p className="text-2xl font-black">SmartQ</p>
                  <p className="text-sm opacity-80 mt-2">Clinical Intelligence Platform</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -left-10 bg-surface-container-lowest p-6 rounded-2xl shadow-xl max-w-xs border border-zinc-100 dark:border-zinc-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center">
                  <Zap size={24} className="text-on-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-tighter">Response Time</p>
                  <p className="text-2xl font-black text-primary">{MOCK_STATS.responseImprovement} Improvement</p>
                </div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">SmartQ automated triage protocols prioritize life-critical cases in under 12 seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Ticker */}
      <div className="w-full bg-primary-container py-3 overflow-hidden">
        <div className="flex whitespace-nowrap gap-12 items-center text-on-primary-container font-bold uppercase tracking-widest text-xs">
          <span>Critical Triage Active: Level 1 Trauma Response Initialized</span>
          <span>•</span>
          <span>Real-time Vitals Stream Stable: {MOCK_STATS.nodesMonitored} Nodes Monitored</span>
          <span>•</span>
          <span>SmartQ Alpha Update: HIPAA-v4 Compliance Verified</span>
        </div>
      </div>

      {/* Infrastructure Bento */}
      <section className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-black tracking-tight text-on-surface mb-4 uppercase">The Sentinel Infrastructure</h2>
              <p className="text-lg text-secondary">A robust foundation designed for zero-latency medical data processing.</p>
            </div>
            <Link to="/for-hospitals" className="text-primary font-bold flex items-center gap-2 group">
              Explore Architecture <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[600px]">
            {/* Large feature */}
            <motion.div
              whileHover={{ borderColor: 'rgba(203, 32, 45, 0.2)' }}
              className="md:col-span-2 md:row-span-2 bg-surface-container-lowest rounded-2xl p-10 flex flex-col justify-between border border-transparent transition-all"
            >
              <div>
                <Wifi size={48} className="text-primary mb-6" />
                <h3 className="text-3xl font-extrabold text-on-surface mb-4">Neural Data Mesh</h3>
                <p className="text-secondary leading-relaxed">SmartQ utilizes a proprietary decentralized data mesh to ensure {MOCK_STATS.uptime} uptime for hospital-wide communication, even during network degradation.</p>
              </div>
              <div className="mt-8 rounded-xl overflow-hidden bg-linear-to-br from-primary/10 to-tertiary/10 h-48 flex items-center justify-center">
                <Wifi size={64} className="text-primary opacity-30" />
              </div>
            </motion.div>

            {/* Small features */}
            <div className="md:col-span-2 bg-surface-container-highest rounded-2xl p-8 flex items-center gap-8 group">
              <div className="flex-1">
                <h4 className="text-xl font-bold mb-2">Biometric Verification</h4>
                <p className="text-sm text-secondary">Advanced biometric authentication integrated with HIPAA-compliant identity protocols.</p>
              </div>
              <div className="w-24 h-24 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-primary transition-colors">
                <ShieldCheck size={40} className="text-primary group-hover:text-on-primary transition-colors" />
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between">
              <Lock size={28} className="text-primary" />
              <div>
                <h4 className="text-lg font-bold mb-1">Audit Shield</h4>
                <p className="text-xs text-secondary">Real-time compliance monitoring and automated logging.</p>
              </div>
            </div>

            <div className="bg-primary-container rounded-2xl p-8 flex flex-col justify-between text-on-primary-container">
              <Zap size={28} />
              <div>
                <h4 className="text-lg font-bold mb-1">Zero Latency</h4>
                <p className="text-xs opacity-80">Instant data sync between field units and central hospital hub.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Triage Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-surface-container rounded-2xl p-4 shadow-xl">
                <div className="bg-surface-container-lowest rounded-xl p-8 border-l-4 border-primary">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Active Patient Vitals</h4>
                      <h5 className="text-2xl font-black text-on-surface">Patient #002-XC</h5>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-bold animate-pulse">URGENT</span>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mb-2">BPM Heart Rate</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tighter text-on-surface">114</span>
                        <Heart size={20} className="text-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mb-2">SpO2 Blood Oxygen</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tighter text-on-surface">92</span>
                        <span className="text-xs font-bold text-zinc-400">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-700">
                    <div className="w-full h-24 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                      <svg className="w-full h-full stroke-primary stroke-2 fill-none" viewBox="0 0 100 20">
                        <path d="M0,10 L10,10 L12,5 L14,15 L16,10 L30,10 L32,2 L34,18 L36,10 L50,10 L52,8 L54,12 L56,10 L70,10 L72,0 L74,20 L76,10 L90,10 L100,10" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-5xl font-black tracking-tight mb-8 text-on-surface">
                Automatic Triage <br /><span className="text-primary">Without the Guesswork</span>
              </h2>
              <div className="space-y-8">
                {[
                  { icon: Brain, title: 'Predictive Instability Scoring', desc: 'AI models analyze historical trends to predict patient instability up to 2 hours before vitals drop.' },
                  { icon: Wifi, title: 'Ubiquitous Monitoring', desc: 'Compatible with all major medical sensors including Masimo, Philips, and GE Healthcare systems.' },
                  { icon: ShieldCheck, title: 'Physician-Validated Logic', desc: 'Triage algorithms are built on peer-reviewed protocols and validated by senior ER faculty.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-6">
                    <div className="shrink-0 w-12 h-12 bg-surface-container-highest rounded-2xl flex items-center justify-center">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2 text-on-surface">{title}</h4>
                      <p className="text-secondary">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Control / App Download */}
      <section className="py-24 px-6 bg-zinc-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
            <div>
              <h2 className="text-5xl font-black tracking-tight mb-6">Patient Control <br />in Your Pocket.</h2>
              <p className="text-xl text-zinc-400 mb-10 leading-relaxed">Give patients and families peace of mind with real-time queue updates, treatment progress tracking, and direct clinician messaging.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 transition-colors px-6 py-3 rounded-2xl border border-zinc-700">
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Download on the</p>
                    <p className="text-lg font-bold leading-tight">App Store</p>
                  </div>
                </Link>
                <Link to="/register" className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 transition-colors px-6 py-3 rounded-2xl border border-zinc-700">
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Get it on</p>
                    <p className="text-lg font-bold leading-tight">Google Play</p>
                  </div>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-primary/20 absolute -inset-20 blur-[100px] rounded-full" />
              <div className="relative z-10 w-full max-w-sm mx-auto rounded-[3rem] shadow-2xl border-8 border-zinc-800 bg-linear-to-br from-primary to-primary-container h-[400px] flex items-center justify-center">
                <div className="text-center text-on-primary">
                  <QrCode size={80} className="mx-auto mb-4 opacity-80" />
                  <p className="text-xl font-black">SmartQ Mobile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Panel Preview */}
      <section className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-black uppercase tracking-tight text-on-surface mb-4 italic">Command &amp; Control</h2>
          <p className="text-secondary max-w-2xl mx-auto">The administrative dashboard designed for clinical directors who require absolute situational awareness.</p>
        </div>
        <div className="max-w-5xl mx-auto bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-700">
          <div className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">SmartQ Admin Portal — v4.8.2</div>
            <div className="w-10" />
          </div>
          <div className="p-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Total Hospitals', value: '50+', color: 'text-primary' },
              { label: 'Daily Tokens', value: '10K+', color: 'text-tertiary' },
              { label: 'Avg Rating', value: '4.8★', color: 'text-on-surface' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface-container rounded-2xl p-6 text-center">
                <p className={`text-4xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-secondary uppercase tracking-widest mt-2 font-bold">{label}</p>
              </div>
            ))}
          </div>
          <div className="px-8 pb-8">
            <Link to={isAuthenticated ? '/admin' : '/login'} className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-container transition-colors">
              {isAuthenticated ? 'Open Admin Dashboard' : 'Sign In to Access'} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── Floating Triage Chatbot Button ── */}
      <motion.button
        onClick={() => setChatOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-primary text-on-primary rounded-2xl shadow-2xl font-bold text-sm"
        style={{ boxShadow: '0 8px 32px rgba(203,32,45,0.4)' }}
      >
        <Stethoscope size={20} />
        AI Triage
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </motion.button>

      {/* ── Chatbot Overlay ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-4xl mx-4"
              style={{ height: '85vh' }}
            >
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 rounded-t-2xl border-b border-zinc-700">
                <div className="flex items-center gap-3">
                  <Stethoscope size={18} className="text-primary" />
                  <span className="font-bold text-white text-sm">Healthcare Triage Bot</span>
                  <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                  </span>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Iframe */}
              <iframe
                src={`${import.meta.env.VITE_TRIAGE_BOT_URL || 'http://localhost:3000'}?name=${encodeURIComponent(user?.name || '')}&role=${encodeURIComponent(user?.role || 'Patient')}`}
                className="w-full rounded-b-2xl border-0"
                style={{ height: 'calc(85vh - 52px)' }}
                title="Healthcare Triage Bot"
                allow="microphone"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
