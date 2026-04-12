import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Lock, ChevronDown, ArrowRight, Eye, EyeOff, CheckCircle2, ShieldCheck, HelpCircle, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../features/auth/useAuthStore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ROLES = [
  { value: 'patient', label: 'Patient — Book appointments & track queue' },
];

const STEPS = [
  { label: 'Personal Information', sub: 'Legal identity and demographics' },
  { label: 'Contact Details',      sub: 'Address and emergency links' },
  { label: 'Medical History',      sub: 'Clinical background and allergies' },
];

export default function Register() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const widgetRef = useRef(null);

  const [regMethod, setRegMethod] = useState('email');
  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'patient', hospitalId: '', phone: '', allergies: '' });
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

  useEffect(() => {
    if (regMethod !== 'phone' || step !== 1) return;
    window.phoneEmailListener = async (userObj) => {
      try {
        await api.post('/auth/verify-phone', {
          user_id: userObj.user_id,
          user_country_code: userObj.user_country_code,
          user_phone_number: userObj.user_phone_number,
        });
        setStep(2);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Phone verification failed.');
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

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (regMethod === 'email' && (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))) e.email = 'Enter a valid email address';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Password must contain at least one uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Password must contain at least one number';
    else if (!/[^A-Za-z0-9]/.test(form.password)) e.password = 'Password must contain at least one special character';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (needsHospital && !form.hospitalId) e.hospitalId = 'Please select your hospital';
    return e;
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const body = {
        name: form.name.trim(),
        password: form.password,
        ...(regMethod === 'email' ? { email: form.email.trim().toLowerCase() } : { phone: form.phone.trim() }),
        ...(needsHospital && form.hospitalId ? { hospitalId: form.hospitalId } : {}),
      };
      await api.post('/auth/register', body);
      toast.success('Account created! Please log in to continue.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (err) => `w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-zinc-400 outline-none text-on-surface ${err ? 'ring-2 ring-error/40' : ''}`;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Navbar />

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        {/* Left: Progress sidebar */}
        <aside className="lg:w-1/3 flex flex-col gap-8">
          <div>
            <span className="text-primary font-bold tracking-[0.2em] text-[10px] uppercase mb-4 block">New Admission</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface leading-tight mb-4">
              Patient <br />Registration.
            </h1>
            <p className="text-secondary text-sm leading-relaxed">
              Please provide accurate clinical and personal data to ensure high-authority care and HIPAA-compliant processing.
            </p>
          </div>

          {/* Progress steps */}
          <div className="flex flex-col gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md ${i === 0 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-secondary'}`}>
                  {i < 1 ? <CheckCircle2 size={18} /> : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-bold ${i === 0 ? 'text-on-surface' : 'text-zinc-400'}`}>{s.label}</p>
                  <p className={`text-xs ${i === 0 ? 'text-secondary' : 'text-zinc-400'}`}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* HIPAA badge */}
          <div className="mt-auto p-6 bg-surface-container-low rounded-2xl flex items-start gap-4">
            <ShieldCheck size={24} className="text-tertiary shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-1">HIPAA Shield Active</h4>
              <p className="text-[11px] text-secondary leading-normal">All data is encrypted end-to-end using 256-bit AES protocols for clinical safety.</p>
            </div>
          </div>
        </aside>

        {/* Right: Form */}
        <section className="lg:w-2/3">
          <div className="bg-surface-container-lowest rounded-2xl p-8 lg:p-12 shadow-sm">

            {/* Method toggle */}
            <div className="flex rounded-xl p-1 mb-8 bg-surface-container-high">
              {[{ id: 'email', icon: Mail, label: 'Email' }, { id: 'phone', icon: Phone, label: 'Phone OTP' }].map(({ id, icon: Icon, label }) => (
                <button key={id} type="button"
                  onClick={() => { setRegMethod(id); setStep(0); setErrors({}); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: regMethod === id ? '#ffffff' : 'transparent', color: regMethod === id ? '#a5001b' : '#5f5e5e', boxShadow: regMethod === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

            <form onSubmit={handleEmailRegister} className="space-y-12" noValidate>
              {/* Section 1: Personal */}
              <div className="space-y-8">
                <div className="flex items-baseline justify-between border-b border-outline-variant/10 pb-4">
                  <h2 className="text-xl font-bold tracking-tight text-on-surface">Personal Identity</h2>
                  <span className="text-[10px] font-black text-secondary/40 uppercase tracking-tighter">Section 01</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest px-1">First Name</label>
                    <input type="text" placeholder="e.g. Jonathan" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls(errors.name)} />
                    {errors.name && <p className="text-xs text-error">{errors.name}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest px-1">Role</label>
                    <div className="relative">
                      <select value={form.role} onChange={e => set('role', e.target.value)} className={`${inputCls(false)} appearance-none`}>
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact */}
              <div className="space-y-8">
                <div className="flex items-baseline justify-between border-b border-outline-variant/10 pb-4">
                  <h2 className="text-xl font-bold tracking-tight text-on-surface">Contact Infrastructure</h2>
                  <span className="text-[10px] font-black text-secondary/40 uppercase tracking-tighter">Section 02</span>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {regMethod === 'email' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest px-1">Primary Email Address</label>
                      <input type="email" placeholder="jonathan.s@clinical.org" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls(errors.email)} />
                      {errors.email && <p className="text-xs text-error">{errors.email}</p>}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest px-1">Password</label>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 special" value={form.password} onChange={e => set('password', e.target.value)} className={inputCls(errors.password)} />
                        <button type="button" tabIndex={-1} onClick={() => setShowPass(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-error">{errors.password}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest px-1">Confirm Password</label>
                      <div className="relative">
                        <input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} className={inputCls(errors.confirmPassword)} />
                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-error">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                  {needsHospital && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-primary uppercase tracking-widest px-1">Select Your Hospital</label>
                      <div className="relative">
                        <select value={form.hospitalId} onChange={e => set('hospitalId', e.target.value)} className={`${inputCls(errors.hospitalId)} appearance-none`}>
                          <option value="">Choose your hospital...</option>
                          {hospitals.map(h => <option key={h._id} value={h._id}>{h.name} — {h.location || h.code}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
                      </div>
                      {errors.hospitalId && <p className="text-xs text-error">{errors.hospitalId}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Medical */}
              <div className="space-y-8">
                <div className="flex items-baseline justify-between border-b border-outline-variant/10 pb-4">
                  <h2 className="text-xl font-bold tracking-tight text-on-surface">Clinical Background</h2>
                  <span className="text-[10px] font-black text-secondary/40 uppercase tracking-tighter">Section 03</span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-widest px-1">Known Allergies</label>
                  <textarea
                    value={form.allergies} onChange={e => set('allergies', e.target.value)}
                    placeholder="List any medications, food, or environmental allergies..."
                    rows={3}
                    className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-zinc-400 outline-none text-on-surface resize-none"
                  />
                </div>
                <div className="p-6 bg-red-50 rounded-2xl border-l-4 border-primary flex items-start gap-4">
                  <AlertTriangle size={20} className="text-primary mt-1 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-primary mb-1">Critical Note Required</p>
                    <p className="text-xs text-on-primary-fixed-variant leading-relaxed">Are you currently taking any prescribed blood thinners or high-risk cardiac medication? If so, please list them above.</p>
                  </div>
                </div>
              </div>

              {/* Phone OTP step */}
              {regMethod === 'phone' && step === 1 && (
                <div className="space-y-5 text-center">
                  <p className="text-sm font-semibold text-on-surface">Verify your phone number</p>
                  <div className="flex justify-center" ref={widgetRef}>
                    <div className="pe_signin_button" data-client-id="14820673920166245958" />
                  </div>
                  <button type="button" onClick={() => setStep(0)} className="text-sm text-secondary hover:text-on-surface">← Back</button>
                </div>
              )}

              {/* Submit */}
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <input type="checkbox" required className="w-5 h-5 rounded border-zinc-300 text-primary focus:ring-primary transition-all" />
                  <label className="text-xs text-secondary font-medium">I confirm all data provided is accurate.</label>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <Link to="/login" className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-secondary-container text-on-secondary-container font-bold text-sm hover:bg-zinc-200 transition-colors text-center">
                    Sign In Instead
                  </Link>
                  <motion.button
                    type="submit" disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 sm:flex-none px-12 py-4 rounded-2xl bg-primary-container text-on-primary font-black text-sm shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" /> : 'COMPLETE REGISTRATION'}
                  </motion.button>
                </div>
              </div>
            </form>
          </div>

          {/* Help cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div whileHover={{ y: -4 }} className="p-6 bg-tertiary-fixed rounded-2xl flex items-center gap-4 cursor-pointer">
              <HelpCircle size={20} className="text-tertiary" />
              <span className="text-xs font-bold text-on-tertiary-fixed-variant">Need help with this form?</span>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} className="p-6 bg-surface-container-high rounded-2xl flex items-center gap-4 cursor-pointer">
              <FileText size={20} className="text-secondary" />
              <span className="text-xs font-bold text-on-secondary-fixed-variant">View HIPAA Terms of Service</span>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
