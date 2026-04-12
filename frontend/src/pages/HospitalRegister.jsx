import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Building2, MapPin, Phone, Clock, Hash, Star,
  ChevronRight, ArrowLeft, CheckCircle2, Loader2,
  Stethoscope, FileText, Shield, User, Mail, Lock,
} from 'lucide-react';
import api from '../lib/api';

/* ---------- tiny helpers ---------- */
function InputField({ id, label, icon: Icon, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
        <Icon size={14} className="text-primary" />
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-xl border px-4 py-3 text-sm font-medium text-slate-800
          bg-white shadow-sm transition-all outline-none
          placeholder:text-slate-400
          focus:border-primary focus:ring-3 focus:ring-primary/10
          ${error ? 'border-red-400 focus:ring-red-100' : 'border-slate-200'}`}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}


/* ---------- steps config ---------- */
const STEPS = [
  { label: 'Basic Info', icon: Building2 },
  { label: 'Location',   icon: MapPin },
  { label: 'Operations', icon: Clock },
  { label: 'Admin Account', icon: User },
];

/* ---------- validation helpers ---------- */
const FAKE_NAME_PATTERNS = [
  /^(test123|fake123|dummy123|hospital123)/i,
  /(.)(\1){6,}/,
];
const BLACKLISTED_CODES = ['TEST','FAKE','DEMO','XXXX','AAAA','ABCD','1234','ASDF'];
const DISPOSABLE_DOMAINS = [
  'mailinator.com','guerrillamail.com','tempmail.com','throwaway.email',
  'yopmail.com','sharklasers.com','trashmail.com','10minutemail.com',
  'maildrop.cc','dispostable.com',
];

/* ---------- validation ---------- */
const validate = (fields) => {
  const e = {};

  if (!fields.name?.trim())
    e.name = 'Hospital name is required';
  else if (fields.name.trim().length < 3)
    e.name = 'Name must be at least 3 characters';
  else if (FAKE_NAME_PATTERNS.some((r) => r.test(fields.name.trim())))
    e.name = 'Hospital name appears to be invalid or test data';

  if (!fields.code?.trim())
    e.code = 'Short code is required';
  else if (!/^[A-Z0-9]{2,6}$/.test(fields.code.toUpperCase()))
    e.code = 'Use 2–6 uppercase letters / digits (e.g. AIIMS)';
  else if (BLACKLISTED_CODES.includes(fields.code.toUpperCase()))
    e.code = 'This code is not allowed';

  if (!fields.location?.trim())
    e.location = 'City / region is required';

  if (!fields.address?.trim())
    e.address = 'Full address is required';
  else if (fields.address.trim().length < 5)
    e.address = 'Please enter a full address (min 5 characters)';

  if (!fields.timings?.trim())
    e.timings = 'Operating hours are required';

  if (!fields.contact?.trim())
    e.contact = 'Contact number is required';
  else if (!/^\+?[\d\s\-().]{7,20}$/.test(fields.contact))
    e.contact = 'Enter a valid phone number';

  if (!fields.adminName?.trim())
    e.adminName = 'Your name is required';

  if (!fields.adminEmail?.trim())
    e.adminEmail = 'Email address is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.adminEmail))
    e.adminEmail = 'Enter a valid email address';
  else if (DISPOSABLE_DOMAINS.includes(fields.adminEmail.split('@')[1]?.toLowerCase()))
    e.adminEmail = 'Disposable email addresses are not allowed';

  if (!fields.adminPassword)
    e.adminPassword = 'Password is required';
  else if (fields.adminPassword.length < 8)
    e.adminPassword = 'Password must be at least 8 characters';
  else if (!/[A-Z]/.test(fields.adminPassword))
    e.adminPassword = 'Password must contain at least one uppercase letter';
  else if (!/[0-9]/.test(fields.adminPassword))
    e.adminPassword = 'Password must contain at least one number';

  if (fields.adminPassword !== fields.confirmPassword)
    e.confirmPassword = 'Passwords do not match';

  return e;
};

/* ---------- main component ---------- */
const HospitalRegister = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0 | 1 | 2 | 3
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [fields, setFields] = useState({
    name:            '',
    code:            '',
    location:        '',
    address:         '',
    timings:         '',
    contact:         '',
    rating:          '',
    adminName:       '',
    adminEmail:      '',
    adminPassword:   '',
    confirmPassword: '',
  });

  const set = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  /* step-level required keys */
  const stepKeys = [
    ['name', 'code'],
    ['location', 'address'],
    ['timings', 'contact'],
    ['adminName', 'adminEmail', 'adminPassword', 'confirmPassword'],
  ];

  const validateStep = () => {
    const all = validate(fields);
    const stepErrs = {};
    stepKeys[step].forEach((k) => { if (all[k]) stepErrs[k] = all[k]; });
    setErrors(stepErrs);
    return Object.keys(stepErrs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const all = validate(fields);
    if (Object.keys(all).length) { setErrors(all); return; }

    setLoading(true);
    try {
      const payload = {
        name:            fields.name.trim(),
        code:            fields.code.toUpperCase().trim(),
        location:        fields.location.trim(),
        address:         fields.address.trim(),
        timings:         fields.timings.trim(),
        contact:         fields.contact.trim(),
        rating:          fields.rating ? parseFloat(fields.rating) : 0,
        latitude:        fields.latitude !== '' ? parseFloat(fields.latitude) : undefined,
        longitude:       fields.longitude !== '' ? parseFloat(fields.longitude) : undefined,
        adminName:       fields.adminName.trim(),
        adminEmail:      fields.adminEmail.trim(),
        adminPassword:   fields.adminPassword,
        confirmPassword: fields.confirmPassword,
      };
      const res = await api.post('/hospitals/register', payload);
      const { hospital } = res.data.data;
      setSubmitted(true);
      toast.success(`Registration submitted! We'll review ${hospital.name} within 24–48 hours.`);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(msg);
      // Map backend field errors back to the correct field if possible
      const fieldMap = { adminEmail: 'adminEmail', adminPassword: 'adminPassword', name: 'name', code: 'code', contact: 'contact', address: 'address' };
      const matched = Object.keys(fieldMap).find((k) => msg.toLowerCase().includes(k.toLowerCase()) || err?.response?.data?.errors?.[0]?.path === k);
      setErrors(matched ? { [matched]: msg } : { submit: msg });
    } finally {
      setLoading(false);
    }
  };

  /* ---- success screen ---- */
  if (submitted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white rounded-3xl shadow-premium p-10 md:p-14 max-w-md w-full text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <Shield size={48} className="text-amber-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 font-display mb-3">Registration Submitted! 🏥</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-2">
            <strong className="text-slate-800">{fields.name}</strong> has been submitted for review.
          </p>
          <p className="text-slate-400 text-xs leading-relaxed mb-8">
            Our team will verify your hospital details and activate your account within 24–48 hours.
            You'll be able to log in once approved.
          </p>
          <div className="flex flex-col gap-3">
            <button
              id="go-home-btn"
              onClick={() => navigate('/')}
              className="btn btn-primary w-full py-3.5 text-sm"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---- main form ---- */
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-slate-50 to-indigo-50 flex flex-col">
      {/* top bar */}
      <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3 md:px-8 flex items-center gap-3">
        <Link
          to="/"
          id="back-home-link"
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <div className="flex items-center gap-2 ml-auto">
          <div className="h-7 w-7 rounded-xl bg-primary flex items-center justify-center">
            <Building2 size={14} className="text-white" />
          </div>
          <span className="text-sm font-black text-slate-800 font-display tracking-tight">SmartQ</span>
        </div>
      </header>

      <div className="flex-1 flex items-start md:items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-2xl">

          {/* hero heading */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-4">
              <Stethoscope size={14} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Hospital Registration</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 font-display tracking-tight leading-[1.1]">
              Join the SmartQ<br />
              <span className="bg-linear-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                Network
              </span>
            </h1>
            <p className="mt-3 text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
              Register your hospital to let patients discover services, join virtual queues, and reduce physical wait times.
            </p>
          </motion.div>

          {/* step indicator */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <React.Fragment key={s.label}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                      ${done   ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : ''}
                      ${active ? 'bg-white border-primary text-primary shadow-lg' : ''}
                      ${!done && !active ? 'bg-white border-slate-200 text-slate-400' : ''}`}
                    >
                      {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                    </div>
                    <span className={`text-xs font-semibold ${active ? 'text-primary' : done ? 'text-slate-600' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 w-16 mx-1 mb-4 rounded-full transition-all duration-300
                      ${i < step ? 'bg-primary' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* form card */}
          <motion.div
            key={step}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl border border-slate-200/60 shadow-premium p-8 md:p-10"
          >
            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} noValidate>

              {/* STEP 0 — Basic Info */}
              {step === 0 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                      <Building2 size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Basic Information</h2>
                      <p className="text-xs text-slate-500">Name and unique identifier for your hospital</p>
                    </div>
                  </div>
                  <InputField
                    id="hospital-name"
                    label="Hospital Name"
                    icon={Building2}
                    type="text"
                    placeholder="e.g. Apollo Hospitals"
                    value={fields.name}
                    onChange={set('name')}
                    error={errors.name}
                  />
                  <InputField
                    id="hospital-code"
                    label="Short Code"
                    icon={Hash}
                    type="text"
                    placeholder="e.g. APLLO (2–6 uppercase chars)"
                    value={fields.code}
                    onChange={(e) => set('code')({ target: { value: e.target.value.toUpperCase() } })}
                    maxLength={6}
                    error={errors.code}
                  />
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex gap-3 text-xs text-slate-600">
                    <Shield size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>The short code is a unique identifier used for queue management and cannot be changed after registration.</span>
                  </div>
                </div>
              )}

              {/* STEP 1 — Location */}
              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                      <MapPin size={20} className="text-indigo-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Location Details</h2>
                      <p className="text-xs text-slate-500">Help patients find you easily</p>
                    </div>
                  </div>
                  <InputField
                    id="hospital-location"
                    label="City / Region"
                    icon={MapPin}
                    type="text"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={fields.location}
                    onChange={set('location')}
                    error={errors.location}
                  />
                  <TextareaField
                    id="hospital-address"
                    label="Full Address"
                    icon={FileText}
                    placeholder="Street, area, landmark, city, pincode"
                    value={fields.address}
                    onChange={set('address')}
                    error={errors.address}
                  />
                </div>
              )}

              {/* STEP 2 — Operations */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
                      <Clock size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Operations</h2>
                      <p className="text-xs text-slate-500">Contact and working hours</p>
                    </div>
                  </div>
                  <InputField
                    id="hospital-timings"
                    label="Operating Hours"
                    icon={Clock}
                    type="text"
                    placeholder="e.g. Mon–Sat 8:00 AM – 8:00 PM"
                    value={fields.timings}
                    onChange={set('timings')}
                    error={errors.timings}
                  />
                  <InputField
                    id="hospital-contact"
                    label="Contact Number"
                    icon={Phone}
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={fields.contact}
                    onChange={set('contact')}
                    error={errors.contact}
                  />
                  <InputField
                    id="hospital-rating"
                    label="Initial Rating (optional)"
                    icon={Star}
                    type="number"
                    placeholder="0 – 5  (e.g. 4.2)"
                    min="0"
                    max="5"
                    step="0.1"
                    value={fields.rating}
                    onChange={set('rating')}
                    error={errors.rating}
                  />
                </div>
              )}

              {/* STEP 3 — Admin Account */}
              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50">
                      <User size={20} className="text-violet-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Your Admin Account</h2>
                      <p className="text-xs text-slate-500">You'll use these credentials to log in</p>
                    </div>
                  </div>
                  <InputField
                    id="admin-name"
                    label="Your Full Name"
                    icon={User}
                    type="text"
                    placeholder="e.g. Dr. John Smith"
                    value={fields.adminName}
                    onChange={set('adminName')}
                    error={errors.adminName}
                  />
                  <InputField
                    id="admin-email"
                    label="Email Address"
                    icon={Mail}
                    type="email"
                    placeholder="e.g. john@cityhospital.com"
                    value={fields.adminEmail}
                    onChange={set('adminEmail')}
                    error={errors.adminEmail}
                  />
                  <InputField
                    id="admin-password"
                    label="Password"
                    icon={Lock}
                    type="password"
                    placeholder="Min. 8 characters"
                    value={fields.adminPassword}
                    onChange={set('adminPassword')}
                    error={errors.adminPassword}
                  />
                  <InputField
                    id="admin-confirm-password"
                    label="Confirm Password"
                    icon={Lock}
                    type="password"
                    placeholder="Re-enter your password"
                    value={fields.confirmPassword}
                    onChange={set('confirmPassword')}
                    error={errors.confirmPassword}
                  />
                  {errors.submit && (
                    <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-600">
                      {errors.submit}
                    </p>
                  )}
                </div>
              )}

              {/* navigation buttons */}
              <div className="mt-8 flex items-center gap-3">
                {step > 0 && (
                  <button
                    type="button"
                    id="back-step-btn"
                    onClick={handleBack}
                    className="btn border border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 py-3.5 text-sm"
                  >
                    <ArrowLeft size={16} className="mr-1.5" /> Back
                  </button>
                )}
                <button
                  id={step < 3 ? 'next-step-btn' : 'submit-register-btn'}
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 py-3.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Registering…</>
                  ) : step < 3 ? (
                    <>Continue <ChevronRight size={16} className="ml-1.5" /></>
                  ) : (
                    <>Register Hospital &amp; Account <Building2 size={16} className="ml-1.5" /></>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* footer note */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-primary hover:underline underline-offset-4" id="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HospitalRegister;
