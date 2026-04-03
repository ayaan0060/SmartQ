import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Lock, ChevronDown, ArrowRight, Zap, Building2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../features/auth/useAuthStore';

// Staff still needs hospital selection; hospital-admin is removed from public register
const ROLES = [
  { value: 'patient', label: 'Patient — Book appointments & track queue' },
  { value: 'staff',   label: 'Staff — Assist with queue management' },
];

export default function Register() {
  const navigate = useNavigate();
  const { setAuth, user } = useAuthStore();

  const [form, setForm]           = useState({ name: '', phone: '', password: '', confirmPassword: '', role: 'patient', hospitalId: '' });
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const needsHospital = form.role === 'staff';

  useEffect(() => {
    if (user) {
      navigate(['super-admin', 'hospital-admin', 'staff'].includes(user.role) ? '/admin' : '/select-hospital', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    api.get('/hospitals').then(r => setHospitals(r.data?.data?.hospitals || [])).catch(() => {});
  }, []);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.length < 2)  e.name            = 'Name must be at least 2 characters';
    if (!form.phone || form.phone.length < 10)       e.phone           = 'Enter a valid 10-digit phone number';
    if (!form.password || form.password.length < 6)  e.password        = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword)       e.confirmPassword = 'Passwords do not match';
    if (needsHospital && !form.hospitalId)            e.hospitalId      = 'Please select your hospital';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name:     form.name.trim(),
        phone:    form.phone.trim(),
        password: form.password,
        ...(needsHospital && form.hospitalId ? { hospitalId: form.hospitalId } : {}),
      });
      const { token, user: newUser, hospitalName } = res.data.data;
      setAuth(newUser, token, hospitalName ?? null);
      localStorage.setItem('token', token);
      toast.success('Account created! Welcome to SmartQ 🎉');
      navigate(['super-admin', 'hospital-admin', 'staff'].includes(newUser.role) ? '/admin' : '/select-hospital');
    } catch (err) {
      const msg = err.displayMessage || err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = (field) => ({
    background: '#0F172A',
    border: errors[field] ? '1px solid #EF4444' : '1px solid #1E293B',
    color: '#E2E8F0',
  });

  const focusStyle = (e) => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; };
  const blurStyle  = (field) => (e) => { e.target.style.border = errors[field] ? '1px solid #EF4444' : '1px solid #1E293B'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#0B0F19' }}>

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-80 w-80 rounded-full opacity-10 blur-3xl" style={{ background: '#2563EB' }} />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full opacity-5 blur-3xl" style={{ background: '#7C3AED' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1.5 text-sm" style={{ color: '#475569' }}>Join SmartQ — the intelligent queue platform</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: '#0D1117', border: '1px solid #1E293B' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  type="text" placeholder="John Doe"
                  value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 placeholder-slate-600"
                  style={fieldStyle('name')} onFocus={focusStyle} onBlur={blurStyle('name')}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  type="tel" placeholder="1234567890"
                  value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 placeholder-slate-600"
                  style={fieldStyle('phone')} onFocus={focusStyle} onBlur={blurStyle('phone')}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 placeholder-slate-600"
                  style={fieldStyle('password')} onFocus={focusStyle} onBlur={blurStyle('password')}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: '#475569' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 placeholder-slate-600"
                  style={fieldStyle('confirmPassword')} onFocus={focusStyle} onBlur={blurStyle('confirmPassword')}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: '#475569' }}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>I am a...</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <select
                  value={form.role} onChange={e => set('role', e.target.value)}
                  className="w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 cursor-pointer"
                  style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0' }}
                  onFocus={focusStyle} onBlur={e => { e.target.style.border = '1px solid #1E293B'; e.target.style.boxShadow = 'none'; }}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value} style={{ background: '#0D1117', color: '#E2E8F0' }}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
              </div>
            </div>

            {/* Hospital picker — staff only */}
            {needsHospital && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#60A5FA' }}>Select Your Hospital</label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                  <select
                    value={form.hospitalId} onChange={e => set('hospitalId', e.target.value)}
                    className="w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 cursor-pointer"
                    style={{ background: '#0F172A', border: errors.hospitalId ? '1px solid #EF4444' : '1px solid rgba(37,99,235,0.3)', color: '#E2E8F0' }}
                    onFocus={focusStyle} onBlur={blurStyle('hospitalId')}
                  >
                    <option value="" style={{ background: '#0D1117' }}>Choose your hospital...</option>
                    {hospitals.map(h => (
                      <option key={h._id} value={h._id} style={{ background: '#0D1117', color: '#E2E8F0' }}>
                        {h.name} — {h.location || h.code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
                </div>
                {errors.hospitalId && <p className="text-xs text-red-400">{errors.hospitalId}</p>}
              </div>
            )}

            {/* Server error */}
            {errors.submit && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
                ⚠ {errors.submit}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
              style={{
                background: loading ? '#1E3A8A' : 'linear-gradient(135deg, #1D4ED8, #2563EB)',
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
              }}
            >
              {loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creating account...</>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 space-y-3 text-center" style={{ borderTop: '1px solid #1E293B', paddingTop: '1.5rem' }}>
            <p className="text-sm" style={{ color: '#475569' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold transition-colors duration-200" style={{ color: '#3B82F6' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}>
                Sign in
              </Link>
            </p>
            <p className="text-sm" style={{ color: '#475569' }}>
              Want to register your hospital?{' '}
              <Link to="/register-hospital" className="font-semibold transition-colors duration-200" style={{ color: '#3B82F6' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}>
                Click here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
