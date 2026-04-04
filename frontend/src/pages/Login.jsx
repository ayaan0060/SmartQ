import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Phone, Mail, Lock, Zap, Clock, ShieldCheck, Users, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../features/auth/useAuthStore';

const FEATURES = [
  { icon: Clock,       title: 'Skip the physical queue',    desc: 'Book your token online and arrive when it\'s your turn.' },
  { icon: Users,       title: 'Real-time queue updates',    desc: 'Live position tracking so you\'re never left guessing.' },
  { icon: ShieldCheck, title: 'Trusted by hospitals',       desc: 'Used across multiple hospitals for seamless patient flow.' },
];

const inputCls = 'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 transition-all duration-200 outline-none';
const inputStyle = (err) => ({
  background: '#0F172A',
  border: err ? '1px solid #EF4444' : '1px solid #1E293B',
  boxShadow: err ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
});
const onFocus = (e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; };
const onBlur  = (e, err) => { e.target.style.border = err ? '1px solid #EF4444' : '1px solid #1E293B'; e.target.style.boxShadow = 'none'; };

const MODES = [
  { id: 'phone', icon: Phone, label: 'Phone' },
  { id: 'email', icon: Mail,  label: 'Email' },
];

export default function Login() {
  const [form, setForm]             = useState({ phone: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [mode, setMode]             = useState('phone');
  const [errors, setErrors]         = useState({});
  const { setAuth, token: authToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (authToken) {
      const { user } = useAuthStore.getState();
      if (user?.role === 'receptionist') navigate('/reception', { replace: true });
      else if (user?.role === 'doctor') navigate('/doctor', { replace: true });
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

  const redirectUser = (user) => {
    if (user.role === 'receptionist') navigate('/reception');
    else if (user.role === 'doctor') navigate('/doctor');
    else if (['super-admin', 'hospital-admin', 'staff'].includes(user.role)) navigate('/admin');
    else navigate('/select-hospital');
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
      const { user, token, hospitalName, hospitalStatus } = r.data.data;
      setAuth(user, token, hospitalName ?? null, hospitalStatus ?? null);
      toast.success(`Welcome back, ${user.name}!`);
      redirectUser(user);
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

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between p-12 shrink-0"
        style={{ background: 'linear-gradient(160deg, #0f1e3d 0%, #0B0F19 60%, #0d1a2e 100%)', borderRight: '1px solid rgba(59,130,246,0.12)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">SmartQ</span>
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: 'rgba(37,99,235,0.15)', color: '#60A5FA', border: '1px solid rgba(37,99,235,0.25)' }}>
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
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5"
                  style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}>
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
        <p className="text-xs" style={{ color: '#334155' }}>© {new Date().getFullYear()} SmartQ. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold text-white">SmartQ</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-sm mt-1.5" style={{ color: '#64748B' }}>Sign in to your account to continue</p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl p-1 mb-3" style={{ background: '#1E293B', border: '1px solid #334155' }}>
            {MODES.map(({ id, icon: Icon, label }) => (
              <button key={id} type="button"
                onClick={() => { setMode(id); setErrors({}); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{ background: mode === id ? '#2563EB' : 'transparent', color: mode === id ? '#fff' : '#64748B' }}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
          <p className="text-xs mb-5" style={{ color: '#475569' }}>
            {mode === 'phone' ? 'Patients registered with phone number' : 'Staff / Doctors / Admin or patients registered with email'}
          </p>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>

            {mode === 'phone' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Phone Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                  <input type="tel" placeholder="+91 XXXXXXXXXX" value={form.phone}
                    onChange={e => set('phone', e.target.value)} autoComplete="tel"
                    className={inputCls} style={inputStyle(errors.phone)}
                    onFocus={onFocus} onBlur={e => onBlur(e, errors.phone)} />
                </div>
                {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                  <input type="email" placeholder="admin@hospital.com" value={form.email}
                    onChange={e => set('email', e.target.value)} autoComplete="email"
                    className={inputCls} style={inputStyle(errors.email)}
                    onFocus={onFocus} onBlur={e => onBlur(e, errors.email)} />
                </div>
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 transition-all duration-200 outline-none"
                  style={inputStyle(errors.password)}
                  onFocus={onFocus} onBlur={e => onBlur(e, errors.password)} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: '#475569' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                  tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] mt-2"
              style={{ background: loading ? '#1E3A8A' : 'linear-gradient(135deg, #1D4ED8, #2563EB)', opacity: loading ? 0.8 : 1, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
              {loading ? <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#1E293B' }} />
            <span className="text-xs font-medium" style={{ color: '#334155' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#1E293B' }} />
          </div>

          <div className="space-y-3 text-center">
            <p className="text-sm" style={{ color: '#475569' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold transition-colors duration-200" style={{ color: '#3B82F6' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}>
                Create account
              </Link>
            </p>
            <p className="text-sm" style={{ color: '#475569' }}>
              Own a hospital?{' '}
              <Link to="/register-hospital" className="font-semibold transition-colors duration-200" style={{ color: '#3B82F6' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}>
                Register your hospital
              </Link>
            </p>
          </div>


        </div>
      </div>
    </div>
  );
}
