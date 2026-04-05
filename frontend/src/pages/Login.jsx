import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Phone, Mail, Lock, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../features/auth/useAuthStore';

const MODES = [
  { id: 'phone', icon: Phone, label: 'Phone' },
  { id: 'email', icon: Mail,  label: 'Email' },
];

const inputCls = 'w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium placeholder:text-secondary/50 outline-none text-sm';

export default function Login() {
  const [form, setForm]         = useState({ phone: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState('phone');
  const [errors, setErrors]     = useState({});
  const { setAuth, token: authToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (authToken) {
      const { user } = useAuthStore.getState();
      if (user?.role === 'patient') navigate('/select-hospital', { replace: true });
      else if (user?.role === 'receptionist') navigate('/reception', { replace: true });
      else if (user?.role === 'doctor') navigate('/doctor', { replace: true });
      else if (['super-admin', 'hospital-admin', 'staff'].includes(user?.role)) navigate('/admin', { replace: true });
      else navigate('/select-hospital', { replace: true });
    }
  }, [authToken, navigate]);

  const set = (field, val) => { setForm(f => ({ ...f, [field]: val })); setErrors(e => ({ ...e, [field]: '' })); };

  const validate = () => {
    const e = {};
    if (mode === 'phone' && !form.phone.trim()) e.phone = 'Phone number is required';
    if (mode === 'email' && !form.email.trim()) e.email = 'Email address is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const redirectUser = (user) => {
    if (user.role === 'patient') navigate('/select-hospital');
    else if (user.role === 'receptionist') navigate('/reception');
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
    <div className="min-h-screen bg-surface text-on-surface" style={{ backgroundImage: 'radial-gradient(#e4bdbb 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden bg-surface-container-lowest rounded-2xl shadow-[0px_20px_40px_rgba(26,28,28,0.06)] ring-1 ring-outline-variant/10">

          {/* Left: Branding */}
          <section className="hidden md:flex md:col-span-5 relative flex-col justify-between p-12 bg-primary overflow-hidden">
            <div className="relative z-10">
              <div className="text-3xl font-black italic tracking-tighter text-on-primary mb-2">SmartQ</div>
              <div className="h-1 w-12 bg-on-primary/30 mb-8" />
              <h1 className="text-4xl font-extrabold text-on-primary leading-tight mb-4">
                High-Authority <br />Care Intelligence.
              </h1>
              <p className="text-on-primary-container font-medium opacity-90 max-w-xs leading-relaxed">
                Access the Clinical Sentinel for real-time queue management and emergency triage.
              </p>
            </div>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-on-primary rounded-full blur-3xl opacity-30" />
            </div>
            <div className="relative z-10 mt-auto">
              <div className="flex items-center gap-3 text-on-primary/70 text-xs font-bold uppercase tracking-widest">
                <ShieldCheck size={16} />
                HIPAA COMPLIANT INTERFACE
              </div>
            </div>
          </section>

          {/* Right: Form */}
          <section className="col-span-1 md:col-span-7 p-8 md:p-16 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              <header className="mb-10">
                <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Secure Access</h2>
                <p className="text-secondary font-medium">Log in to your clinical workstation.</p>
              </header>

              {/* Mode toggle */}
              <div className="flex rounded-xl p-1 mb-6 bg-surface-container-high">
                {MODES.map(({ id, icon: Icon, label }) => (
                  <button key={id} type="button"
                    onClick={() => { setMode(id); setErrors({}); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: mode === id ? '#ffffff' : 'transparent', color: mode === id ? '#a5001b' : '#5f5e5e', boxShadow: mode === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                  >
                    <Icon size={14} />{label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLogin} className="space-y-6" noValidate>
                {/* Identifier */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-secondary ml-1">
                    {mode === 'phone' ? 'Phone Number' : 'Email Address'}
                  </label>
                  <div className="relative flex items-center group">
                    {mode === 'phone'
                      ? <Phone size={20} className="absolute left-4 text-secondary group-focus-within:text-primary transition-colors" />
                      : <Mail size={20} className="absolute left-4 text-secondary group-focus-within:text-primary transition-colors" />
                    }
                    {mode === 'phone' ? (
                      <input
                        type="tel" placeholder="+91 XXXXXXXXXX" value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        className={inputCls}
                      />
                    ) : (
                      <input
                        type="email" placeholder="admin@hospital.com" value={form.email}
                        onChange={e => set('email', e.target.value)}
                        className={inputCls}
                      />
                    )}
                  </div>
                  {(errors.phone || errors.email) && <p className="text-xs text-error ml-1">{errors.phone || errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Password</label>
                    <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-container transition-colors">Forgot Access?</a>
                  </div>
                  <div className="relative flex items-center group">
                    <Lock size={20} className="absolute left-4 text-secondary group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'} placeholder="••••••••••••"
                      value={form.password} onChange={e => set('password', e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-medium placeholder:text-secondary/50 outline-none text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-4 text-secondary hover:text-on-surface">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-error ml-1">{errors.password}</p>}
                </div>

                {/* Submit */}
                <motion.button
                  type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold text-lg hover:bg-primary-container transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="h-5 w-5 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                  ) : (
                    <>Emergency Login <ArrowRight size={18} /></>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30" /></div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="bg-surface-container-lowest px-4 text-secondary">Institutional SSO</span>
                </div>
              </div>

              {/* SSO buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 hover:bg-surface-container transition-colors">
                  <ShieldCheck size={18} className="text-secondary" />
                  <span className="text-xs font-bold text-on-surface">HealthConnect</span>
                </button>
                <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 hover:bg-surface-container transition-colors">
                  <Lock size={18} className="text-secondary" />
                  <span className="text-xs font-bold text-on-surface">Biometrics</span>
                </button>
              </div>

              <footer className="mt-10 text-center space-y-3">
                <p className="text-xs text-secondary font-medium">
                  System status: <span className="text-tertiary-container font-bold uppercase tracking-tight">All Operations Online</span>
                </p>
                <p className="text-sm text-secondary">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-bold text-primary hover:text-primary-container transition-colors">Create account</Link>
                </p>
              </footer>
            </div>
          </section>
        </div>
      </main>

      {/* Bottom ticker */}
      <div className="fixed bottom-0 left-0 w-full bg-primary-container text-on-primary-container py-2 px-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <AlertTriangle size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Alert System: Standby</span>
        </div>
        <div className="text-[10px] font-bold opacity-75">
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
        </div>
      </div>
    </div>
  );
}
