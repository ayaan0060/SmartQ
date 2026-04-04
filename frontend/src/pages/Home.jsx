import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import {
  Zap, Building2, LayoutDashboard, History, CreditCard,
  Users, Stethoscope, BarChart3, Settings, ArrowRight,
  ShieldCheck, Clock, Star, LogIn, UserPlus, Activity,
  Hospital, QrCode, Sparkles, TrendingUp, ChevronRight,
  FileText, DollarSign, Search, LogOut, Grid3x3,
  Layers, BarChart2, Cog, Menu, X, Briefcase,
} from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';
import { useHospitalStore } from '../features/hospital/useHospitalStore';
import { AuthService } from '../features/auth/AuthService';
import EmergencyPill from '../components/home/EmergencyPill';
import SOSModal      from '../components/home/SOSModal';

/* ── animation presets ───────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
};
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

/* ════════════════════════════════════════════
   PRIMITIVES
════════════════════════════════════════════ */

/** Full-width top nav */
function TopNav({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-10 h-16"
      style={{
        background: 'rgba(8,12,23,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'linear-gradient(145deg,#1a45c8,#3B82F6)' }}>
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="font-display text-lg font-black tracking-tight text-white">SmartQ</span>
      </div>

      {/* Desktop actions */}
      <div className="hidden md:flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>{user.name}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
              onMouseEnter={e => { e.currentTarget.style.background='#EF4444'; e.currentTarget.style.color='#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.color='#EF4444'; }}
            >
              <LogOut size={13}/> Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ color: '#D1D5DB', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
            >Sign In</Link>
            <Link to="/register"
              className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#3B82F6)', boxShadow: '0 2px 12px rgba(59,130,246,0.35)' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
            >Get Started</Link>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button className="md:hidden text-white" onClick={() => setMenuOpen(o => !o)}>
        {menuOpen ? <X size={22}/> : <Menu size={22}/>}
      </button>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 inset-x-0 p-4 flex flex-col gap-2 md:hidden"
            style={{ background: 'rgba(8,12,23,0.98)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            {user ? (
              <button onClick={() => { setMenuOpen(false); onLogout(); }}
                className="w-full py-3 rounded-xl text-sm font-bold text-red-400 bg-red-500/10">Sign Out</button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="py-3 rounded-xl text-center text-sm font-semibold text-white bg-white/5">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="py-3 rounded-xl text-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#3B82F6)' }}>Get Started</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Section wrapper with consistent horizontal padding */
function Section({ children, className = '', style = {} }) {
  return (
    <div className={`w-full px-6 lg:px-10 ${className}`} style={style}>
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </div>
  );
}

/** Section heading */
function SectionHeader({ title, subtitle, seeAllTo, light }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className={`text-xl font-black tracking-tight leading-none ${light ? 'text-white' : 'text-white'}`}>{title}</h2>
        {subtitle && <p className="text-sm mt-1.5" style={{ color: '#6B7280' }}>{subtitle}</p>}
      </div>
      {seeAllTo && (
        <Link to={seeAllTo} className="flex items-center gap-1 text-sm font-semibold transition-all shrink-0" style={{ color: '#3B82F6' }}>
          See all <ChevronRight size={14}/>
        </Link>
      )}
    </div>
  );
}

/* ────── Hero Carousel ────── */
const SLIDES = [
  {
    badge: 'Healthcare Platform',
    headline: 'Skip the Wait,\nNot the Care.',
    sub: 'AI-powered queue management that saves patients hours every day across 50+ hospitals.',
    primary:   { label: 'Get Started — Free', to: '/register' },
    secondary: { label: 'Browse Hospitals',   to: '/select-hospital' },
    c1: '#3B82F6', c2: '#6366f1',
  },
  {
    badge: 'For Hospitals',
    headline: 'Modernize Your\nQueue System.',
    sub: 'Join 50+ hospitals already running smarter, faster, and paperless with SmartQ.',
    primary:   { label: 'Register Hospital',  to: '/register-hospital' },
    secondary: { label: 'Learn More',         to: '/for-hospitals' },
    c1: '#10B981', c2: '#0891b2',
  },
  {
    badge: 'Enterprise Ready',
    headline: 'Full Platform\nControl.',
    sub: 'Multi-hospital analytics, real-time queue monitoring, and role-based access control.',
    primary:   { label: 'Sign In',            to: '/login' },
    secondary: { label: 'Create Account',     to: '/register' },
    c1: '#8B5CF6', c2: '#EC4899',
  },
];

function HeroCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const s = SLIDES[active];

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: '420px' }}>
      {/* Background gradient */}
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${s.c1}1a 0%, ${s.c2}14 50%, rgba(8,12,23,0) 100%)`, transition: 'background 0.8s ease' }} />
      {/* Ambient orb right */}
      <div className="absolute right-0 top-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${s.c1}20 0%, transparent 65%)`, transform: 'translate(30%,-30%)' }} />
      {/* Ambient orb left */}
      <div className="absolute left-0 bottom-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${s.c2}14 0%, transparent 65%)`, transform: 'translate(-30%,30%)' }} />

      <Section className="relative z-10 flex flex-col justify-center" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.16,1,0.3,1] }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: `${s.c1}18`, border: `1px solid ${s.c1}30` }}>
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: s.c1 }} />
              <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: s.c1 }}>{s.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-black text-white leading-[1.08] tracking-[-0.03em] whitespace-pre-line mb-4"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
              {s.headline}
            </h1>

            <p className="mb-8 max-w-xl" style={{ color: '#9CA3AF', fontSize: '1.0625rem', lineHeight: '1.65' }}>
              {s.sub}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link to={s.primary.to}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-extrabold text-white transition-all"
                style={{ background: `linear-gradient(135deg,${s.c1},${s.c2})`, boxShadow: `0 4px 20px ${s.c1}40` }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 28px ${s.c1}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 20px ${s.c1}40`; }}
              >
                {s.primary.label} <ArrowRight size={17}/>
              </Link>
              <Link to={s.secondary.to}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E5E7EB' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
              >
                {s.secondary.label}
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide dots */}
        <div className="flex gap-2 mt-12">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="rounded-full transition-all duration-300"
              style={{ height: '4px', width: i === active ? '28px' : '8px', background: i === active ? s.c1 : 'rgba(255,255,255,0.18)' }}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ────── Category card (Amazon style) ────── */
function CategoryCard({ icon: Icon, iconColor, iconBg, title, items, exploreTo, delay = 0 }) { // eslint-disable-line no-unused-vars
  return (
    <motion.div variants={fadeUp} custom={delay} whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      className="group flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(15,20,35,0.75)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3.5 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconBg }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        <h3 className="text-sm font-extrabold text-white tracking-tight">{title}</h3>
      </div>

      {/* Items */}
      <div className="flex flex-col px-3 py-2 flex-1">
        {items.map((item, i) => (
          <Link key={i} to={item.to}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='#F3F4F6'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#9CA3AF'; }}
          >
            <item.icon size={14} style={{ color: item.color || iconColor, opacity: 0.7 }} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Footer */}
      {exploreTo && (
        <Link to={exploreTo}
          className="flex items-center gap-1.5 px-5 py-3 text-sm font-semibold transition-all"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: iconColor }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
        >
          Explore all <ChevronRight size={13}/>
        </Link>
      )}
    </motion.div>
  );
}

/* ────── Compact card ────── */
function CompactCard({ icon: Icon, iconColor, iconBg, title, subtitle, to, onClick, badge, delay = 0 }) { // eslint-disable-line no-unused-vars
  const inner = (
    <motion.div variants={fadeUp} custom={delay}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.45)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      className="group flex items-center gap-4 p-4 rounded-2xl cursor-pointer"
      style={{
        background: 'rgba(15,20,35,0.75)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
        style={{ background: iconBg }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{title}</p>
        {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>{subtitle}</p>}
      </div>
      {badge && (
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
          {badge}
        </span>
      )}
      <ChevronRight size={15} className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: iconColor }} />
    </motion.div>
  );
  if (onClick) return <div onClick={onClick}>{inner}</div>;
  return <Link to={to}>{inner}</Link>;
}

/* ────── Pill strip (horizontal scroll) ────── */
function QuickStrip({ items }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
      {items.map((item, i) => (
        <Link key={i} to={item.to}
          className="flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
          style={{ background: `${item.c}10`, border: `1px solid ${item.c}25`, color: item.c }}
          onMouseEnter={e => e.currentTarget.style.background=`${item.c}20`}
          onMouseLeave={e => e.currentTarget.style.background=`${item.c}10`}
        >
          <item.icon size={14}/> {item.label}
        </Link>
      ))}
    </div>
  );
}

/* ────── Stats bar ────── */
function StatsBar({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl px-5 py-4"
          style={{
            background: `radial-gradient(ellipse at 0% 50%, ${s.c}12 0%, rgba(15,20,35,0.8) 60%)`,
            border: `1px solid ${s.c}1e`,
          }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${s.c}15` }}>
            <s.icon size={20} style={{ color: s.c }} />
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-none tracking-tight">{s.value}</p>
            <p className="text-xs font-semibold mt-0.5 uppercase tracking-wider" style={{ color: '#4B5563' }}>{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────── Divider ────── */
function Divider() {
  return <div className="w-full" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />;
}

/* ════════════════════════════════════════════
   MAIN
════════════════════════════════════════════ */
export default function Home() {
  const navigate       = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { selectedHospital, clearSelectedHospital } = useHospitalStore();
  const [sosOpen, setSosOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super-admin';
  const isHospAdmin  = user?.role === 'hospital-admin';
  const isStaff      = user?.role === 'staff';

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  /* ─── GUEST VIEW ─────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full" style={{ background: '#080C17' }}>
        <TopNav user={null} onLogout={handleLogout} />

        {/* ① HERO */}
        <HeroCarousel />

        <Divider />

        {/* ② QUICK ACCESS */}
        <Section className="py-10">
          <SectionHeader title="Quick Access" subtitle="Jump directly to what you need" />
          <QuickStrip items={[
            { icon: LogIn,     label: 'Sign In',          to: '/login',             c: '#3B82F6' },
            { icon: UserPlus,  label: 'Register',          to: '/register',          c: '#8B5CF6' },
            { icon: Building2, label: 'Browse Hospitals',  to: '/select-hospital',   c: '#10B981' },
            { icon: TrendingUp,label: 'For Hospitals',     to: '/for-hospitals',     c: '#F59E0B' },
            { icon: Sparkles,  label: 'List Your Hospital',to: '/register-hospital', c: '#EC4899' },
          ]} />
        </Section>

        <Divider />

        {/* ③ CATEGORY GRID */}
        <Section className="py-12">
          <SectionHeader title="Explore SmartQ" subtitle="Everything you need on one intelligent platform" />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CategoryCard icon={Users}         iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.14)" title="Patient Portal"
              items={[
                { icon: QrCode,    label: 'Book a Token',     to: '/select-hospital', color: '#8B5CF6' },
                { icon: Clock,     label: 'View Queue Status', to: '/select-hospital' },
                { icon: History,   label: 'Token History',     to: '/history' },
                { icon: CreditCard,label: 'Payments',          to: '/payments' },
              ]}
              exploreTo="/register" delay={0}
            />
            <CategoryCard icon={Building2}     iconColor="#10B981" iconBg="rgba(16,185,129,0.14)" title="Hospital Mgmt"
              items={[
                { icon: Briefcase,   label: 'Staff',           to: '/admin/staff',               color: '#10B981' },
                { icon: Users,      label: 'Patients',         to: '/admin/patients' },
                { icon: QrCode,     label: 'Live Queue',       to: '/admin/queue' },
                { icon: BarChart3,  label: 'Analytics',        to: '/admin/analytics' },
              ]}
              exploreTo="/for-hospitals" delay={1}
            />
            <CategoryCard icon={LayoutDashboard} iconColor="#3B82F6" iconBg="rgba(59,130,246,0.14)" title="Admin Panel"
              items={[
                { icon: Building2, label: 'All Hospitals',    to: '/admin/hospitals', color: '#3B82F6' },
                { icon: BarChart3, label: 'Platform Stats',   to: '/admin/analytics' },
                { icon: Settings,  label: 'Configuration',    to: '/admin/settings' },
              ]}
              exploreTo="/login" delay={2}
            />
            <CategoryCard icon={TrendingUp}    iconColor="#F59E0B" iconBg="rgba(245,158,11,0.14)" title="For Hospitals"
              items={[
                { icon: Sparkles,    label: 'Register Hospital',to: '/register-hospital', color: '#F59E0B' },
                { icon: FileText,    label: 'Learn More',       to: '/for-hospitals' },
                { icon: ShieldCheck, label: 'HIPAA Ready',      to: '/for-hospitals' },
              ]}
              exploreTo="/for-hospitals" delay={3}
            />
          </motion.div>
        </Section>

        <Divider />

        {/* ④ STATS */}
        <Section className="py-12">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <StatsBar stats={[
              { icon: Hospital,  value: '50+',   label: 'Hospitals',    c: '#3B82F6' },
              { icon: Activity,  value: '10K+',  label: 'Daily Tokens', c: '#10B981' },
              { icon: Star,      value: '4.8★',  label: 'Avg Rating',   c: '#F59E0B' },
            ]}/>
          </motion.div>
        </Section>

        <Divider />

        {/* ⑤ FOR PATIENTS */}
        <Section className="py-12">
          <SectionHeader title="For Patients" subtitle="Book, track, and manage your healthcare — all in one place" />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CompactCard icon={QrCode}     iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.13)" title="Book a Token"      subtitle="Select hospital & service"  to="/select-hospital"  delay={0} />
            <CompactCard icon={History}    iconColor="#3B82F6" iconBg="rgba(59,130,246,0.13)"  title="Token History"    subtitle="Your past appointments"      to="/history"          delay={1} />
            <CompactCard icon={CreditCard} iconColor="#10B981" iconBg="rgba(16,185,129,0.13)"  title="Payment History"  subtitle="Transaction records"         to="/payments"         delay={2} />
            <CompactCard icon={Building2}  iconColor="#F59E0B" iconBg="rgba(245,158,11,0.13)"  title="Browse Hospitals" subtitle="Find a facility near you"    to="/select-hospital"  delay={3} />
          </motion.div>
        </Section>

        <Divider />

        {/* ⑥ FOR HOSPITALS */}
        <Section className="py-12">
          <SectionHeader title="For Hospitals" subtitle="Modernize your queue management — free to join" seeAllTo="/for-hospitals" />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompactCard icon={Sparkles}   iconColor="#EC4899" iconBg="rgba(236,72,153,0.13)"  title="Register Hospital" subtitle="Join SmartQ for free"      to="/register-hospital" badge="Free" delay={0} />
            <CompactCard icon={TrendingUp} iconColor="#F59E0B" iconBg="rgba(245,158,11,0.13)"  title="Platform Benefits"  subtitle="Why hospitals choose us"   to="/for-hospitals"     delay={1} />
            <CompactCard icon={ShieldCheck}iconColor="#10B981" iconBg="rgba(16,185,129,0.13)"  title="HIPAA Compliant"    subtitle="Enterprise-grade security" to="/for-hospitals"     delay={2} />
          </motion.div>
        </Section>

        {/* ⑦ FOOTER */}
        <Divider />
        <Section className="py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'linear-gradient(145deg,#1a45c8,#3B82F6)' }}>
                <Zap size={13} className="text-white" fill="white" />
              </div>
              <span className="font-display font-black text-white text-sm">SmartQ</span>
            </div>
            <div className="flex items-center gap-6 text-xs" style={{ color: '#4B5563' }}>
              <span className="flex items-center gap-1.5"><ShieldCheck size={12}/> HIPAA Ready</span>
              <span className="flex items-center gap-1.5"><Clock size={12}/> 99.9% Uptime</span>
              <span>© {new Date().getFullYear()} SmartQ</span>
            </div>
          </div>
        </Section>
      </div>
    );
  }

  /* ─── SUPER ADMIN VIEW ───────────────── */
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen w-full" style={{ background: '#080C17' }}>
        <TopNav user={user} onLogout={handleLogout} />

        {/* Hero banner */}
        <div className="relative w-full overflow-hidden" style={{ paddingTop: '64px' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.14) 0%, transparent 65%)' }} />
          <Section className="py-16 relative z-10">
            <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
              <p className="text-xs font-black uppercase tracking-[0.2em] mb-2" style={{ color: '#3B82F6' }}>Super Admin Dashboard</p>
              <h1 className="font-display font-black text-white leading-tight mb-3"
                style={{ fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.03em' }}>
                Welcome back, {user?.name?.split(' ')[0]}.
              </h1>
              <p className="mb-6" style={{ color: '#6B7280', fontSize: '1.0625rem' }}>Full platform control — hospitals, doctors, patients, analytics.</p>
              <div className="flex gap-3">
                <Link to="/admin"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold text-white"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#3B82F6)', boxShadow: '0 4px 20px rgba(59,130,246,0.35)' }}>
                  <LayoutDashboard size={16}/> Open Dashboard
                </Link>
                <Link to="/admin/analytics"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#D1D5DB' }}>
                  <BarChart3 size={16}/> Analytics
                </Link>
              </div>
            </motion.div>
          </Section>
        </div>

        <Divider />

        {/* Quick strip */}
        <Section className="py-10">
          <SectionHeader title="Quick Navigation" />
          <QuickStrip items={[
            { icon: LayoutDashboard, label: 'Overview',    to: '/admin',             c: '#3B82F6' },
            { icon: Building2,       label: 'Hospitals',   to: '/admin/hospitals',   c: '#10B981' },
            { icon: Briefcase,       label: 'Staff',       to: '/admin/staff',                 c: '#8B5CF6' },
            { icon: Users,           label: 'Patients',    to: '/admin/patients',    c: '#F59E0B' },
            { icon: QrCode,          label: 'Queue',       to: '/admin/queue',       c: '#EC4899' },
            { icon: BarChart3,       label: 'Analytics',   to: '/admin/analytics',   c: '#06b6d4' },
            { icon: Settings,        label: 'Settings',    to: '/admin/settings',    c: '#94A3B8' },
          ]} />
        </Section>

        <Divider />

        {/* Platform management grid */}
        <Section className="py-12">
          <SectionHeader title="Platform Management" subtitle="Manage all aspects of SmartQ" />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CategoryCard icon={Building2}      iconColor="#3B82F6" iconBg="rgba(59,130,246,0.14)" title="Hospitals"
              items={[
                { icon: Building2,  label: 'All Hospitals',    to: '/admin/hospitals',  color: '#3B82F6' },
                { icon: Sparkles,   label: 'Register New',     to: '/register-hospital'},
                { icon: BarChart2,  label: 'Hospital Stats',   to: '/admin/analytics'  },
              ]} exploreTo="/admin/hospitals" delay={0}/>
            <CategoryCard icon={Users}          iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.14)" title="People"
              items={[
                { icon: Stethoscope,label: 'Doctors',          to: '/admin/staff?role=doctor',    color: '#8B5CF6' },
                { icon: Users,      label: 'Patients',         to: '/admin/patients'   },
              ]} exploreTo="/admin/patients" delay={1}/>
            <CategoryCard icon={BarChart3}      iconColor="#10B981" iconBg="rgba(16,185,129,0.14)" title="Analytics"
              items={[
                { icon: BarChart3,  label: 'Platform Insights',to: '/admin/analytics',  color: '#10B981' },
                { icon: QrCode,     label: 'Live Queue',       to: '/admin/queue'      },
                { icon: Activity,   label: 'Performance',      to: '/admin/analytics'  },
              ]} exploreTo="/admin/analytics" delay={2}/>
            <CategoryCard icon={Grid3x3}        iconColor="#F59E0B" iconBg="rgba(245,158,11,0.14)" title="Operations"
              items={[
                { icon: QrCode,     label: 'Queue Monitor',   to: '/admin/queue',       color: '#F59E0B' },
                { icon: Layers,     label: 'Departments',      to: '/admin/departments' },
              ]} exploreTo="/admin/queue" delay={3}/>
            <CategoryCard icon={Cog}            iconColor="#94A3B8" iconBg="rgba(148,163,184,0.12)" title="Configuration"
              items={[
                { icon: Settings,   label: 'Platform Settings',to: '/admin/settings',   color: '#94A3B8' },
                { icon: ShieldCheck,label: 'Security',         to: '/admin/settings'   },
              ]} exploreTo="/admin/settings" delay={4}/>
            <CategoryCard icon={TrendingUp}     iconColor="#EC4899" iconBg="rgba(236,72,153,0.14)" title="Growth"
              items={[
                { icon: Building2,  label: 'Onboard Hospital', to: '/register-hospital',color: '#EC4899' },
                { icon: FileText,   label: 'For Hospitals',    to: '/for-hospitals'    },
              ]} exploreTo="/for-hospitals" delay={5}/>
          </motion.div>
        </Section>

        <Divider />

        {/* All modules compact */}
        <Section className="py-12">
          <SectionHeader title="All Modules" seeAllTo="/admin" />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompactCard icon={LayoutDashboard} iconColor="#3B82F6" iconBg="rgba(59,130,246,0.13)"  title="Overview"   subtitle="Platform dashboard"     to="/admin"              delay={0} />
            <CompactCard icon={Building2}       iconColor="#10B981" iconBg="rgba(16,185,129,0.13)"  title="Hospitals"  subtitle="All facilities"         to="/admin/hospitals"    delay={1} />
            <CompactCard icon={Briefcase}      iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.13)"  title="Staff"     subtitle="Doctors & team"           to="/admin/staff"                  delay={2} />
            <CompactCard icon={Users}           iconColor="#F59E0B" iconBg="rgba(245,158,11,0.13)"  title="Patients"   subtitle="Patient records"        to="/admin/patients"     delay={3} />
            <CompactCard icon={QrCode}          iconColor="#EC4899" iconBg="rgba(236,72,153,0.13)"  title="Queue"      subtitle="Live monitoring"        to="/admin/queue"        delay={4} />
            <CompactCard icon={BarChart3}       iconColor="#06b6d4" iconBg="rgba(6,182,212,0.13)"   title="Analytics"  subtitle="Platform insights"      to="/admin/analytics"    delay={5} />
          </motion.div>
        </Section>

        <AdminFooter onLogout={handleLogout} />
      </div>
    );
  }

  /* ─── HOSPITAL ADMIN / STAFF VIEW ───── */
  if (isHospAdmin || isStaff) {
    const green1 = '#10B981';
    return (
      <div className="min-h-screen w-full" style={{ background: '#080C17' }}>
        <TopNav user={user} onLogout={handleLogout} />

        <div className="relative w-full overflow-hidden" style={{ paddingTop: '64px' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 70% 50%, ${green1}18 0%, transparent 65%)` }} />
          <Section className="py-16 relative z-10">
            <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
              <p className="text-xs font-black uppercase tracking-[0.2em] mb-2" style={{ color: green1 }}>
                {isHospAdmin ? 'Hospital Admin' : 'Staff'}
              </p>
              <h1 className="font-display font-black text-white leading-tight mb-3"
                style={{ fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.03em' }}>
                Welcome, {user?.name?.split(' ')[0]}.
              </h1>
              <p className="mb-6" style={{ color: '#6B7280', fontSize: '1.0625rem' }}>Hospital operations & management.</p>
              <div className="flex gap-3">
                <Link to="/admin"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold text-white"
                  style={{ background: `linear-gradient(135deg,#065f46,${green1})`, boxShadow: `0 4px 20px ${green1}30` }}>
                  <LayoutDashboard size={16}/> Open Dashboard
                </Link>
                <Link to="/admin/queue"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#D1D5DB' }}>
                  <QrCode size={16}/> Live Queue
                </Link>
              </div>
            </motion.div>
          </Section>
        </div>

        <Divider />

        <Section className="py-10">
          <SectionHeader title="Quick Navigation" />
          <QuickStrip items={[
            { icon: LayoutDashboard, label: 'Dashboard',  to: '/admin',             c: green1 },
            { icon: Briefcase,       label: 'Staff',      to: '/admin/staff',                 c: '#3B82F6' },
            { icon: Users,           label: 'Patients',   to: '/admin/patients',    c: '#8B5CF6' },
            { icon: QrCode,          label: 'Queue',      to: '/admin/queue',       c: '#F59E0B' },
            { icon: BarChart3,       label: 'Analytics',  to: '/admin/analytics',   c: '#EC4899' },
            ...(isHospAdmin ? [{ icon: Settings, label: 'Settings', to: '/admin/settings', c: '#94A3B8' }] : []),
          ]} />
        </Section>

        <Divider />

        <Section className="py-12">
          <SectionHeader title="Hospital Management" subtitle="Manage your facility operations" />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CategoryCard icon={Stethoscope} iconColor="#3B82F6" iconBg="rgba(59,130,246,0.14)" title="Medical Staff"
              items={[
                { icon: Stethoscope,label: 'All Doctors',       to: '/admin/staff?role=doctor',   color: '#3B82F6' },
                { icon: Users,      label: 'By Department',     to: '/admin/departments'       },
              ]} exploreTo="/admin/staff?role=doctor" delay={0}/>
            <CategoryCard icon={Users}       iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.14)" title="Patients"
              items={[
                { icon: Users,      label: 'Patient Records',   to: '/admin/patients',  color: '#8B5CF6' },
                { icon: History,    label: 'Visit History',     to: '/admin/patients'  },
              ]} exploreTo="/admin/patients" delay={1}/>
            <CategoryCard icon={QrCode}      iconColor="#F59E0B" iconBg="rgba(245,158,11,0.14)" title="Queue Monitor"
              items={[
                { icon: QrCode,     label: 'Live Monitor',      to: '/admin/queue',     color: '#F59E0B' },
                { icon: Activity,   label: 'Queue Stats',       to: '/admin/analytics' },
              ]} exploreTo="/admin/queue" delay={2}/>
            <CategoryCard icon={BarChart3}   iconColor="#EC4899" iconBg="rgba(236,72,153,0.14)" title="Analytics"
              items={[
                { icon: BarChart3,  label: 'Hospital Insights', to: '/admin/analytics', color: '#EC4899' },
                { icon: TrendingUp, label: 'Performance',       to: '/admin/analytics' },
              ]} exploreTo="/admin/analytics" delay={3}/>
          </motion.div>
        </Section>

        <Divider />

        <Section className="py-12">
          <SectionHeader title="All Modules" />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CompactCard icon={Briefcase}  iconColor="#3B82F6" iconBg="rgba(59,130,246,0.13)"  title="Staff"     subtitle="Roster & doctors" to="/admin/staff"              delay={0} />
            <CompactCard icon={Users}       iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.13)"  title="Patients"  subtitle="Patient records" to="/admin/patients"  delay={1} />
            <CompactCard icon={QrCode}      iconColor="#F59E0B" iconBg="rgba(245,158,11,0.13)"  title="Queue"     subtitle="Live monitor"    to="/admin/queue"     delay={2} />
            <CompactCard icon={BarChart3}   iconColor="#EC4899" iconBg="rgba(236,72,153,0.13)"  title="Analytics" subtitle="Insights"        to="/admin/analytics" delay={3} />
            {isHospAdmin && (
              <CompactCard icon={Settings}  iconColor="#94A3B8" iconBg="rgba(148,163,184,0.1)"  title="Settings"  subtitle="Configuration"   to="/admin/settings"  delay={4} />
            )}
          </motion.div>
        </Section>

        <AdminFooter onLogout={handleLogout} />
      </div>
    );
  }

  /* ─── PATIENT VIEW ───────────────────── */
  return (
    <div className="min-h-screen w-full" style={{ background: '#080C17' }}>
      <TopNav user={user} onLogout={handleLogout} />

      {/* Patient hero */}
      <div className="relative w-full overflow-hidden" style={{ paddingTop: '64px' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(139,92,246,0.15) 0%, transparent 60%)' }} />
        <Section className="py-16 relative z-10">
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-2" style={{ color: '#8B5CF6' }}>Patient Portal</p>
            <h1 className="font-display font-black text-white leading-tight mb-3"
              style={{ fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.03em' }}>
              Hello, {user?.name?.split(' ')[0]}.
            </h1>
            <p className="mb-6" style={{ color: '#6B7280', fontSize: '1.0625rem' }}>
              {selectedHospital ? `Currently at ${selectedHospital.name}` : 'Select a hospital to get started.'}
            </p>
            <div className="flex gap-3">
              {selectedHospital ? (
                <Link to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold text-white"
                  style={{ background: 'linear-gradient(135deg,#4c1d95,#8B5CF6)', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}>
                  <QrCode size={16}/> Book a Token
                </Link>
              ) : (
                <Link to="/select-hospital"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold text-white"
                  style={{ background: 'linear-gradient(135deg,#4c1d95,#8B5CF6)', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}>
                  <Building2 size={16}/> Browse Hospitals
                </Link>
              )}
              <Link to="/history"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#D1D5DB' }}>
                <History size={16}/> Token History
              </Link>
            </div>
          </motion.div>
        </Section>
      </div>

      <Divider />

      {/* Quick strip */}
      <Section className="py-10">
        <SectionHeader title="Quick Access" />
        {/* EmergencyPill is prepended BEFORE the strip as a button (not a Link) */}
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          <EmergencyPill onClick={() => setSosOpen(true)} disabled={sosOpen} />
          {[
            { icon: QrCode,     label: 'Book Token',    to: '/select-hospital', c: '#8B5CF6' },
            { icon: History,    label: 'Token History', to: '/history',         c: '#3B82F6' },
            { icon: CreditCard, label: 'Payments',      to: '/payments',        c: '#10B981' },
            { icon: Building2,  label: 'Hospitals',     to: '/select-hospital', c: '#F59E0B' },
            { icon: TrendingUp, label: 'For Hospitals', to: '/for-hospitals',   c: '#EC4899' },
          ].map((item, i) => (
            <Link key={i} to={item.to}
              className="flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
              style={{ background: `${item.c}10`, border: `1px solid ${item.c}25`, color: item.c }}
              onMouseEnter={e => e.currentTarget.style.background=`${item.c}20`}
              onMouseLeave={e => e.currentTarget.style.background=`${item.c}10`}
            >
              <item.icon size={14}/> {item.label}
            </Link>
          ))}
        </div>
      </Section>

      {/* SOS Modal */}
      <SOSModal isOpen={sosOpen} onClose={() => setSosOpen(false)} />

      <Divider />

      {/* Category grid */}
      <Section className="py-12">
        <SectionHeader title="Patient Portal" subtitle="Everything you need in one place" />
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CategoryCard icon={QrCode}   iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.14)" title="Appointments"
            items={[
              { icon: Building2, label: 'Choose Hospital',  to: '/select-hospital', color: '#8B5CF6' },
              { icon: QrCode,    label: 'Book Token',       to: '/select-hospital' },
              { icon: Clock,     label: 'Queue Status',     to: '/select-hospital' },
            ]} exploreTo="/select-hospital" delay={0}/>
          <CategoryCard icon={History}  iconColor="#3B82F6" iconBg="rgba(59,130,246,0.14)" title="My Records"
            items={[
              { icon: History,   label: 'Token History',   to: '/history',          color: '#3B82F6' },
              { icon: CreditCard,label: 'Payment History', to: '/payments'         },
              { icon: FileText,  label: 'Receipts',        to: '/payments'         },
            ]} exploreTo="/history" delay={1}/>
        </motion.div>
      </Section>

      <Divider />

      {/* Quick actions */}
      <Section className="py-12">
        <SectionHeader title="Quick Actions" />
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CompactCard icon={QrCode}     iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.13)"  title="Book Token"       subtitle="Select hospital & service"  to="/select-hospital"  delay={0} />
          <CompactCard icon={History}    iconColor="#3B82F6" iconBg="rgba(59,130,246,0.13)"  title="Token History"     subtitle="Past appointments"          to="/history"          delay={1} />
          <CompactCard icon={CreditCard} iconColor="#10B981" iconBg="rgba(16,185,129,0.13)"  title="Payments"          subtitle="Transaction records"         to="/payments"         delay={2} />
          {selectedHospital ? (
            <CompactCard
              icon={Building2} iconColor="#F59E0B" iconBg="rgba(245,158,11,0.13)"
              title="Change Hospital"
              subtitle={`Now: ${selectedHospital.name}`}
              onClick={() => { clearSelectedHospital(); navigate('/select-hospital'); }}
              delay={3}
            />
          ) : (
            <CompactCard icon={Building2} iconColor="#F59E0B" iconBg="rgba(245,158,11,0.13)" title="Find Hospital" subtitle="Browse facilities" to="/select-hospital" delay={3}/>
          )}
        </motion.div>
      </Section>

      <Divider />

      {/* Discover */}
      <Section className="py-12">
        <SectionHeader title="Discover" subtitle="Learn more about SmartQ" />
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CompactCard icon={TrendingUp} iconColor="#F59E0B" iconBg="rgba(245,158,11,0.13)"  title="For Hospitals" subtitle="SmartQ for your facility"     to="/for-hospitals"     delay={0} />
          <CompactCard icon={Sparkles}   iconColor="#EC4899" iconBg="rgba(236,72,153,0.13)"  title="Register Hospital" subtitle="Join SmartQ — free"       to="/register-hospital" badge="Free" delay={1} />
        </motion.div>
      </Section>

      <AdminFooter onLogout={handleLogout} />
    </div>
  );
}

/* ── shared footer ── */
function AdminFooter({ onLogout }) {
  return (
    <>
      <Divider />
      <Section className="py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(145deg,#1a45c8,#3B82F6)' }}>
              <Zap size={13} className="text-white" fill="white" />
            </div>
            <span className="font-display font-black text-white text-sm">SmartQ</span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: '#4B5563' }}>
            <span className="flex items-center gap-1.5"><ShieldCheck size={12}/> HIPAA Ready</span>
            <span className="flex items-center gap-1.5"><Clock size={12}/> 99.9% Uptime</span>
            <span>© {new Date().getFullYear()} SmartQ</span>
            <button onClick={onLogout} className="transition-colors hover:text-red-400">Sign out</button>
          </div>
        </div>
      </Section>
    </>
  );
}
