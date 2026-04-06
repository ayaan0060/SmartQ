import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Clock, Users, TrendingUp, ShieldCheck,
  Zap, ArrowRight, CheckCircle, Star, Phone, MapPin,
  BarChart3, CalendarClock, Bell, ChevronRight,
} from 'lucide-react';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ─── data ─── */
const FEATURES = [
  {
    icon: Zap,
    color: 'bg-amber-50 text-amber-500',
    title: 'Instant Queue Management',
    desc: 'Real-time digital queues eliminate physical crowding. Patients receive live position updates on their phones.',
  },
  {
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-500',
    title: 'Powerful Analytics',
    desc: 'Live dashboards give admins full visibility into token counts, wait times, and service performance.',
  },
  {
    icon: Bell,
    color: 'bg-violet-50 text-violet-500',
    title: 'Smart Notifications',
    desc: 'Automated alerts keep patients informed so they arrive at the right time — reducing no-shows significantly.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-emerald-50 text-emerald-500',
    title: 'Secure & Reliable',
    desc: 'End-to-end encrypted data with 99.9% uptime ensures your hospital operations are never disrupted.',
  },
  {
    icon: CalendarClock,
    color: 'bg-pink-50 text-pink-500',
    title: 'Multi-Service Support',
    desc: 'Manage queues for OPD, lab, pharmacy, and more — each with independent counters and timings.',
  },
  {
    icon: Users,
    color: 'bg-cyan-50 text-cyan-500',
    title: 'Better Patient Experience',
    desc: 'Higher patient satisfaction scores and fewer complaints by giving people control of their wait time.',
  },
];

const STEPS = [
  { num: '01', title: 'Register your hospital', desc: 'Fill a quick form with your hospital details. It takes under 3 minutes.', icon: Building2 },
  { num: '02', title: 'Set up your services', desc: 'Add OPD departments, labs, or any service with custom operating hours.', icon: CalendarClock },
  { num: '03', title: 'Go live instantly', desc: 'Patients can discover your hospital and join queues the same day.', icon: Zap },
];

const STATS = [
  { value: '50+', label: 'Hospitals Onboarded' },
  { value: '10k+', label: 'Daily Tokens Issued' },
  { value: '4.8★', label: 'Average Patient Rating' },
  { value: '60%', label: 'Reduction in Wait Times' },
];

const TESTIMONIALS = [
  {
    name: 'Dr. Priya Mehta',
    role: 'Medical Director, Apollo Clinics',
    text: 'SmartQ transformed how we manage patient flow. Our OPD wait times dropped by 55% in the first month.',
    initials: 'PM',
    color: 'bg-blue-500',
  },
  {
    name: 'Rajan Sharma',
    role: 'Admin Head, Global Hospitals',
    text: 'Onboarding was seamless. We were live within hours and our patients absolutely love the virtual queue.',
    initials: 'RS',
    color: 'bg-violet-500',
  },
];

/* ─── component ─── */
const ForHospitals = () => {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md group-hover:scale-105 transition-transform">
              <Building2 size={18} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 font-display">SmartQ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden md:block text-sm font-bold text-slate-600 hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-slate-50" id="nav-login-link">
              Sign In
            </Link>
            <Link
              to="/register-hospital"
              id="nav-register-cta"
              className="btn btn-primary text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.03] transition-transform"
            >
              Register Hospital
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-20 md:py-32 flex flex-col items-center text-center gap-8">
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-widest backdrop-blur-sm"
          >
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            Trusted by 50+ hospitals across India
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-5xl md:text-7xl font-black tracking-tight font-display leading-[1.05] max-w-4xl"
          >
            Modernise Your{' '}
            <span className="bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Patient Flow
            </span>{' '}
            with SmartQ
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed"
          >
            Join hundreds of hospitals eliminating physical queues, reducing wait times, and delighting patients — all from a single dashboard.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center gap-4 mt-2"
          >
            <Link
              to="/select-hospital"
              id="hero-demo-btn"
              className="btn btn-primary text-base px-8 py-4 rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 transition-transform flex items-center gap-2"
            >
              See It In Action
              <ChevronRight size={18} />
            </Link>
          </motion.div>

          {/* stats row */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl"
          >
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <span className="text-3xl font-black text-white font-display">{s.value}</span>
                <span className="text-xs font-semibold text-slate-400 text-center leading-tight">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-primary">Simple Onboarding</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-slate-900 font-display">Get live in 3 steps</h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto">No complex integrations. No IT team needed. Start managing queues the same day.</p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* connector line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-linear-to-r from-primary/30 via-primary to-primary/30" />

            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="relative flex flex-col items-center text-center gap-5 bg-white rounded-3xl p-8 shadow-card border border-slate-100"
                >
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/30">
                    <Icon size={36} />
                    <span className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-black shadow-lg">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-primary">Everything You Need</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-slate-900 font-display">Built for modern hospitals</h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto">Every feature designed to help your staff work smarter and your patients wait shorter.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i % 3}
                  className="group flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-card hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${f.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-primary">What Hospitals Say</span>
            <h2 className="mt-3 text-4xl font-black text-slate-900 font-display">Trusted by real doctors</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="flex flex-col gap-6 p-8 rounded-3xl bg-white shadow-card border border-slate-100"
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 font-medium leading-relaxed text-sm">"{t.text}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white text-sm font-black ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 bg-linear-to-br from-primary via-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 md:px-8 text-center flex flex-col items-center gap-8">
          <h2 className="text-4xl md:text-5xl font-black text-white font-display leading-[1.1]">
            Ready to transform your hospital?
          </h2>
          <p className="text-blue-100 text-lg max-w-xl">
            Join SmartQ today — it's completely free to register. Your patients will thank you.
          </p>
          <div className="flex items-center gap-2 text-blue-100 text-sm font-semibold">
            <CheckCircle size={16} className="text-blue-200" />
            No credit card required
          </div>

          {/* quick info pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {[
              { icon: Clock,      text: 'Live in < 1 hour' },
              { icon: Phone,    text: 'Dedicated support' },
              { icon: MapPin,   text: 'Pan-India coverage' },
              { icon: TrendingUp, text: 'Free forever plan' },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.text} className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur-sm">
                  <Icon size={12} />
                  <span>{p.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 bg-white py-10 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building2 size={16} />
            </div>
            <span className="font-black text-slate-900 font-display">SmartQ</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">© {new Date().getFullYear()} SmartQ. Intelligent Wait Management.</p>
          <div className="flex items-center gap-6 text-xs font-bold text-slate-500">
            <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-primary transition-colors">Patient Register</Link>
            <Link to="/register-hospital" className="hover:text-primary transition-colors">Hospital Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default ForHospitals;
