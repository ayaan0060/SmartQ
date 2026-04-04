import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Mail, Lock, ChevronDown, ArrowRight, Zap, Building2, Eye, EyeOff, CheckCircle2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../features/auth/useAuthStore';

const ROLES = [
  { value: 'patient', label: 'Patient — Book appointments & track queue' },
  { value: 'staff',   label: 'Staff — Assist with queue management' },
];

const fieldStyle = (err) => ({ background: '#0F172A', border: err ? '1px solid #EF4444' : '1px solid #1E293B', color: '#E2E8F0' });
const onFocus = (e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; };
const onBlur  = (err) => (e) => { e.target.style.border = err ? '1px solid #EF4444' : '1px solid #1E293B'; e.target.style.boxShadow = 'none'; };

function Steps({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: i < current ? '#10B981' : i === current ? '#2563EB' : '#1E293B', color: '#fff' }}>
            {i < current ? <CheckCircle2 size={12} /> : i + 1}
          </div>
          {i < total - 1 && <div className="flex-1 h-px max-w-[40px]" style={{ background: i < current ? '#10B981' : '#1E293B' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const widgetRef = useRef(null);

  const [regMethod, setRegMethod] = useState('email'); // 'email' | 'phone'
  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'patient', hospitalId: '' });
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const needsHospital = form.role === 'staff';

  useEffect(() => {
    if (user) navigate(['super-admin', 'hospital-admin', 'staff'].includes(user.role) ? '/admin' : '/select-hospital', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    api.get('/hospitals').then(r => setHospitals(r.data?.data?.hospitals || [])).catch(() => {});
  }, []);

  // Phone.Email widget
  useEffect(() => {
    if (regMethod !== 'phone' || step !== 1) return;

    window.phoneEmailListener = async (userObj) => {
      try {
        const r = await api.post('/auth/verify-phone-email', {
          user_json_url:     userObj.user_json_url,
          user_country_code: userObj.user_country_code,
          user_phone_number: userObj.user_phone_number,
        });
        const { phone } = r.data.data;
        setVerifiedPhone(phone);
        toast.success(`Phone ${phone} verified!`);
        setStep(2);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Phone verification failed. Please try again.');
      }
    };

    const old = document.getElementById('pe-script');
    if (old) old.remove();
    const script = document.createElement('script');
    script.id = 'pe-script';
    script.src = 'https://www.phone.email/sign_in_button_v1.js';
    script.async = true;
    document.body.appendChild(script);

    return () => { delete window.phoneEmailListener; };
  }, [regMethod, step]);

  const set = (field, val) => { setForm(f => ({ ...f, [field]: val })); setErrors(e => ({ ...e, [field]: '' })); };

  const validateDetails = () => {
    const e = {};
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (regMethod === 'email') {
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    }
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (needsHospital && !form.hospitalId) e.hospitalId = 'Please select your hospital';
    return e;
  };

  // Email registration — direct
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    const errs = validateDetails();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        ...(needsHospital && form.hospitalId ? { hospitalId: form.hospitalId } : {}),
      });
      toast.success('Account created! Please log in to continue.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Phone registration — step 0: details, step 1: verify phone, step 2: create
  const handlePhoneNext = (e) => {
    e.preventDefault();
    const errs = validateDetails();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(1);
  };

  const handlePhoneRegister = async () => {
    if (!verifiedPhone) { toast.error('Phone not verified'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name:     form.name.trim(),
        phone:    verifiedPhone,
        password: form.password,
        ...(needsHospital && form.hospitalId ? { hospitalId: form.hospitalId } : {}),
      });
      toast.success('Account created! Please log in to continue.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const commonFields = (
    <>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Full Name</label>
        <div className="relative">
          <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
          <input type="text" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all placeholder-slate-600"
            style={fieldStyle(errors.name)} onFocus={onFocus} onBlur={onBlur(errors.name)} />
        </div>
        {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
      </div>

      {regMethod === 'email' && (
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Email Address</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
            <input type="email" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all placeholder-slate-600"
              style={fieldStyle(errors.email)} onFocus={onFocus} onBlur={onBlur(errors.email)} />
          </div>
          {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
          <input type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password}
            onChange={e => set('password', e.target.value)}
            className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm outline-none transition-all placeholder-slate-600"
            style={fieldStyle(errors.password)} onFocus={onFocus} onBlur={onBlur(errors.password)} />
          <button type="button" tabIndex={-1} onClick={() => setShowPass(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Confirm Password</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
          <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword}
            onChange={e => set('confirmPassword', e.target.value)}
            className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm outline-none transition-all placeholder-slate-600"
            style={fieldStyle(errors.confirmPassword)} onFocus={onFocus} onBlur={onBlur(errors.confirmPassword)} />
          <button type="button" tabIndex={-1} onClick={() => setShowConfirm(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>I am a...</label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
          <select value={form.role} onChange={e => set('role', e.target.value)}
            className="w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0' }}
            onFocus={onFocus} onBlur={e => { e.target.style.border = '1px solid #1E293B'; e.target.style.boxShadow = 'none'; }}>
            {ROLES.map(r => <option key={r.value} value={r.value} style={{ background: '#0D1117', color: '#E2E8F0' }}>{r.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
        </div>
      </div>

      {needsHospital && (
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#60A5FA' }}>Select Your Hospital</label>
          <div className="relative">
            <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
            <select value={form.hospitalId} onChange={e => set('hospitalId', e.target.value)}
              className="w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{ background: '#0F172A', border: errors.hospitalId ? '1px solid #EF4444' : '1px solid rgba(37,99,235,0.3)', color: '#E2E8F0' }}
              onFocus={onFocus} onBlur={onBlur(errors.hospitalId)}>
              <option value="" style={{ background: '#0D1117' }}>Choose your hospital...</option>
              {hospitals.map(h => <option key={h._id} value={h._id} style={{ background: '#0D1117', color: '#E2E8F0' }}>{h.name} — {h.location || h.code}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
          </div>
          {errors.hospitalId && <p className="text-xs text-red-400">{errors.hospitalId}</p>}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#0B0F19' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-80 w-80 rounded-full opacity-10 blur-3xl" style={{ background: '#2563EB' }} />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full opacity-5 blur-3xl" style={{ background: '#7C3AED' }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1.5 text-sm" style={{ color: '#475569' }}>Join SmartQ — the intelligent queue platform</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>

          {/* Registration method toggle */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: '#1E293B', border: '1px solid #334155' }}>
            {[
              { id: 'email', icon: Mail,  label: 'Email' },
              { id: 'phone', icon: Phone, label: 'Phone OTP' },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} type="button"
                onClick={() => { setRegMethod(id); setStep(0); setErrors({}); setVerifiedPhone(''); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: regMethod === id ? '#2563EB' : 'transparent', color: regMethod === id ? '#fff' : '#64748B' }}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* EMAIL REGISTRATION */}
          {regMethod === 'email' && (
            <form onSubmit={handleEmailRegister} className="space-y-4" noValidate>
              {commonFields}
              <button type="submit" disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
                style={{ background: loading ? '#1E3A8A' : 'linear-gradient(135deg,#1D4ED8,#2563EB)', opacity: loading ? 0.8 : 1, boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}>
                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating account...</> : <>Create Account <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* PHONE OTP REGISTRATION */}
          {regMethod === 'phone' && (
            <>
              {/* Step 0 — Details */}
              {step === 0 && (
                <form onSubmit={handlePhoneNext} className="space-y-4" noValidate>
                  <Steps current={0} total={3} />
                  {commonFields}
                  <button type="submit"
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}>
                    Next — Verify Phone <ArrowRight size={16} />
                  </button>
                </form>
              )}

              {/* Step 1 — Phone.Email Widget */}
              {step === 1 && (
                <div className="space-y-5">
                  <Steps current={1} total={3} />
                  <div className="text-center space-y-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto"
                      style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}>
                      <Phone size={24} style={{ color: '#60A5FA' }} />
                    </div>
                    <p className="text-sm font-semibold text-white">Verify your phone number</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>Click the button, enter your phone and the OTP you receive</p>
                  </div>
                  <div className="flex justify-center" ref={widgetRef}>
                    <div className="pe_signin_button" data-client-id="14820673920166245958" />
                  </div>
                  <button type="button" onClick={() => setStep(0)}
                    className="w-full rounded-xl py-2.5 text-sm font-semibold"
                    style={{ background: '#1E293B', color: '#94A3B8' }}>
                    ← Back
                  </button>
                </div>
              )}

              {/* Step 2 — Verified */}
              {step === 2 && (
                <div className="space-y-5">
                  <Steps current={2} total={3} />
                  <div className="text-center space-y-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle2 size={28} style={{ color: '#10B981' }} />
                    </div>
                    <p className="text-sm font-semibold text-white">Phone Verified!</p>
                    <p className="text-xs font-mono px-3 py-1.5 rounded-lg inline-block"
                      style={{ background: '#0F172A', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                      {verifiedPhone}
                    </p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      Use <span className="text-white font-semibold">{verifiedPhone}</span> + your password to login
                    </p>
                  </div>
                  <button onClick={handlePhoneRegister} disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white"
                    style={{ background: loading ? '#1E3A8A' : 'linear-gradient(135deg,#1D4ED8,#2563EB)', opacity: loading ? 0.8 : 1 }}>
                    {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating...</> : <>Create Account <ArrowRight size={16} /></>}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="mt-6 space-y-3 text-center" style={{ borderTop: '1px solid #1E293B', paddingTop: '1.5rem' }}>
            <p className="text-sm" style={{ color: '#475569' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold" style={{ color: '#3B82F6' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}>Sign in</Link>
            </p>
            <p className="text-sm" style={{ color: '#475569' }}>
              Want to register your hospital?{' '}
              <Link to="/register-hospital" className="font-semibold" style={{ color: '#3B82F6' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}>Click here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
