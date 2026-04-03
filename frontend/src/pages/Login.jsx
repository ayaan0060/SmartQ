import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Phone, Mail, Lock, Zap,
  Clock, ShieldCheck, Users, ArrowRight,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../features/auth/useAuthStore';

const FEATURES = [
  { icon: Clock,       title: 'Skip the physical queue',    desc: 'Book your token online and arrive when it\'s your turn.' },
  { icon: Users,       title: 'Real-time queue updates',    desc: 'Live position tracking so you\'re never left guessing.' },
  { icon: ShieldCheck, title: 'Trusted by hospitals',       desc: 'Used across multiple hospitals for seamless patient flow.' },
];

export default function Login() {
  const [form, setForm]               = useState({ phone: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [mode, setMode]               = useState('phone'); // 'phone' | 'email'
  const [errors, setErrors]           = useState({});
  const { setAuth, token: authToken } = useAuthStore();
  const navigate                      = useNavigate();

  useEffect(() => {
    if (authToken) {
      const { user } = useAuthStore.getState();
      if (user?.role === 'receptionist') navigate('/reception', { replace: true });
      else if (['super-admin', 'hospital-admin', 'staff'].includes(user?.role)) navigate('/admin', { replace: true });
      else navigate('/home', { replace: true });
    }
  }, [authToken, navigate]);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (mode === 'phone' && !form.phone.trim()) e.phone = 'Phone number is required';
    if (mode === 'email' && !form.email.trim()) e.email = 'Email address is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = mode === 'phone'
        ? { phone: form.phone.trim(), password: form.password }
        : { email: form.email.trim(), password: form.password };

      const r = await api.post('/auth/login', payload);
      const { user, token } = r.data.data;
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name}!`);

      if (user.role === 'receptionist') {
        navigate('/reception');
      } else if (['super-admin', 'hospital-admin', 'staff'].includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/select-hospital');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      toast.error(msg);
      setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0B0F19' }}>

      {/* ── Left panel (desktop only) ─────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between p-12 shrink-0"
        style={{
          background: 'linear-gradient(160deg, #0f1e3d 0%, #0B0F19 60%, #0d1a2e 100%)',
          borderRight: '1px solid rgba(59,130,246,0.12)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">SmartQ</span>
        </div>

        {/* Hero text */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'rgba(37,99,235,0.15)', color: '#60A5FA', border: '1px solid rgba(37,99,235,0.25)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              Healthcare Queue Management
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              The smarter way<br />
              <span style={{ color: '#60A5FA' }}>to manage queues</span>
            </h1>
            <p className="text-base leading-relaxed" style={{ color: '#94A3B8' }}>
              Skip the wait. Book your token online and get real-time updates on your queue position.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5"
                  style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}
                >
                  <Icon size={18} style={{ color: '#60A5FA' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748B' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-xs" style={{ color: '#334155' }}>
          © {new Date().getFullYear()} SmartQ. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold text-white">SmartQ</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-sm mt-1.5" style={{ color: '#64748B' }}>Sign in to your account to continue</p>
          </div>

          {/* Mode toggle */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: '#1E293B', border: '1px solid #334155' }}
          >
            {['phone', 'email'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setErrors({}); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200"
                style={{
                  background: mode === m ? '#2563EB' : 'transparent',
                  color: mode === m ? '#FFFFFF' : '#64748B',
                }}
              >
                {m === 'phone' ? <Phone size={14} /> : <Mail size={14} />}
                {m}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4" noValidate>

            {/* Phone / Email */}
            {mode === 'phone' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                  <input
                    type="tel"
                    placeholder="07XXXXXXXXX"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    autoComplete="tel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 transition-all duration-200 outline-none"
                    style={{
                      background: '#0F172A',
                      border: errors.phone ? '1px solid #EF4444' : '1px solid #1E293B',
                      boxShadow: errors.phone ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
                    }}
                    onFocus={e => { if (!errors.phone) e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
                    onBlur={e => { e.target.style.border = errors.phone ? '1px solid #EF4444' : '1px solid #1E293B'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-400 flex items-center gap-1">{errors.phone}</p>}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                  <input
                    type="email"
                    placeholder="admin@hospital.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 transition-all duration-200 outline-none"
                    style={{
                      background: '#0F172A',
                      border: errors.email ? '1px solid #EF4444' : '1px solid #1E293B',
                    }}
                    onFocus={e => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
                    onBlur={e => { e.target.style.border = errors.email ? '1px solid #EF4444' : '1px solid #1E293B'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 transition-all duration-200 outline-none"
                  style={{
                    background: '#0F172A',
                    border: errors.password ? '1px solid #EF4444' : '1px solid #1E293B',
                    boxShadow: errors.password ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
                  }}
                  onFocus={e => { if (!errors.password) e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
                  onBlur={e => { e.target.style.border = errors.password ? '1px solid #EF4444' : '1px solid #1E293B'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: '#475569' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] mt-2"
              style={{
                background: loading ? '#1E3A8A' : 'linear-gradient(135deg, #1D4ED8, #2563EB)',
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              }}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#1E293B' }} />
            <span className="text-xs font-medium" style={{ color: '#334155' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#1E293B' }} />
          </div>

          {/* Footer links */}
          <div className="space-y-3 text-center">
            <p className="text-sm" style={{ color: '#475569' }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold transition-colors duration-200"
                style={{ color: '#3B82F6' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}
              >
                Create account
              </Link>
            </p>
            <p className="text-sm" style={{ color: '#475569' }}>
              Own a hospital?{' '}
              <Link
                to="/register-hospital"
                className="font-semibold transition-colors duration-200"
                style={{ color: '#3B82F6' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}
              >
                Register your hospital
              </Link>
            </p>
          </div>

          {/* Demo hint */}
          <div
            className="mt-8 rounded-xl px-4 py-3 text-center"
            style={{ background: '#0F172A', border: '1px solid #1E293B' }}
          >
            <p className="text-xs" style={{ color: '#475569' }}>
              Super Admin demo:{' '}
              <span style={{ color: '#64748B' }}>email: superadmin@smartq.com · pass: Admin@1234</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
