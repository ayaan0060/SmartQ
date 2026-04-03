import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, X, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const EMPTY_FORM = { name: '', cardNumber: '', expiry: '', cvv: '' };
const EMPTY_ERRORS = { name: '', cardNumber: '', expiry: '', cvv: '' };

const PaymentModal = ({ isOpen, onClose, paymentData }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);

  // Unwrap axios response envelope: Dashboard passes the full res.data object
  // which has shape { success, message, data: { paymentRequired, ... } }
  const pd = paymentData?.data ?? paymentData ?? {};

  // Free service: token already booked — navigate immediately, skip card form
  useEffect(() => {
    if (isOpen && pd.paymentRequired === false && pd.token?._id) {
      toast.success('Token booked successfully!');
      onClose();
      navigate(`/status/${pd.token._id}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pd.paymentRequired, pd.token?._id]);

  // ── Live formatting ──────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (name === 'cardNumber') {
      val = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    }
    if (name === 'expiry') {
      val = value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
    }
    if (name === 'cvv') {
      val = value.replace(/\D/g, '').slice(0, 4);
    }

    setForm(f => ({ ...f, [name]: val }));
    if (errors[name]) setErrors(err => ({ ...err, [name]: '' }));
  };

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    const e = { ...EMPTY_ERRORS };
    let valid = true;

    if (!form.name.trim()) {
      e.name = 'Cardholder name is required'; valid = false;
    }

    const digits = form.cardNumber.replace(/\s/g, '');
    if (!digits) {
      e.cardNumber = 'Card number is required'; valid = false;
    } else if (digits.length !== 16) {
      e.cardNumber = 'Card number must be 16 digits'; valid = false;
    }

    if (!form.expiry) {
      e.expiry = 'Expiry date is required'; valid = false;
    } else if (!/^\d{2}\/\d{2}$/.test(form.expiry)) {
      e.expiry = 'Use MM/YY format'; valid = false;
    } else {
      const [mm, yy] = form.expiry.split('/').map(Number);
      const now = new Date();
      const expDate = new Date(2000 + yy, mm - 1, 1);
      if (mm < 1 || mm > 12) {
        e.expiry = 'Invalid month'; valid = false;
      } else if (expDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
        e.expiry = 'Card has expired'; valid = false;
      }
    }

    if (!form.cvv) {
      e.cvv = 'CVV is required'; valid = false;
    } else if (form.cvv.length < 3) {
      e.cvv = 'CVV must be 3–4 digits'; valid = false;
    }

    setErrors(e);
    return valid;
  };

  // ── Submit ───────────────────────────────────────────────────
  const handlePay = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setStep('processing');
    try {
      const res = await api.post('/payments/card', {
        cardholderName: form.name.trim(),
        cardNumber: form.cardNumber.replace(/\s/g, ''),
        expiry: form.expiry,
        cvv: form.cvv,
        amount: pd.amount,
        paymentId: pd.paymentId,
      });

      setStep('success');
      await new Promise(r => setTimeout(r, 1200));
      toast.success('Payment successful! Token booked.');
      onClose();
      setForm(EMPTY_FORM);
      setStep('form');
      navigate(`/status/${res.data.data.token._id}`);
    } catch (err) {
      setStep('form');
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    }
  };

  // Don't render for free services (useEffect handles navigation)
  if (!isOpen || pd.paymentRequired === false) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => e.target === e.currentTarget && step === 'form' && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl"
          style={{ background: '#0F172A' }}
        >
          {/* Header */}
          <div className="relative p-8 pb-6" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)' }}>
            {step === 'form' && (
              <button
                onClick={onClose}
                className="absolute right-6 top-6 h-10 w-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            )}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <CreditCard size={20} className="text-blue-400" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Secure Card Payment</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{pd.serviceName}</p>
                  <p className="text-slate-300 text-xs mt-0.5">{pd.hospitalName}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-white">
                    ₹{pd.amount?.toLocaleString('en-IN')}
                  </p>
                  <p className="text-slate-500 text-xs font-bold mt-0.5">INR</p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            {step === 'form' && (
              <form onSubmit={handlePay} noValidate className="space-y-4">

                {/* Cardholder Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Cardholder Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    autoComplete="cc-name"
                    className="w-full h-14 rounded-2xl px-5 text-white text-base font-bold placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      background: '#1E293B',
                      border: `1.5px solid ${errors.name ? '#EF4444' : '#334155'}`,
                    }}
                  />
                  {errors.name && <p className="text-xs text-red-400 font-medium">{errors.name}</p>}
                </div>

                {/* Card Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Card Number</label>
                  <div className="relative">
                    <input
                      name="cardNumber"
                      value={form.cardNumber}
                      onChange={handleChange}
                      placeholder="4242 4242 4242 4242"
                      autoComplete="cc-number"
                      inputMode="numeric"
                      className="w-full h-14 rounded-2xl px-5 pr-12 text-white font-mono text-base font-bold placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: '#1E293B',
                        border: `1.5px solid ${errors.cardNumber ? '#EF4444' : '#334155'}`,
                      }}
                    />
                    <CreditCard size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600" />
                  </div>
                  {errors.cardNumber && <p className="text-xs text-red-400 font-medium">{errors.cardNumber}</p>}
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Expiry</label>
                    <input
                      name="expiry"
                      value={form.expiry}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      autoComplete="cc-exp"
                      inputMode="numeric"
                      className="w-full h-14 rounded-2xl px-5 text-white font-mono text-base font-bold placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: '#1E293B',
                        border: `1.5px solid ${errors.expiry ? '#EF4444' : '#334155'}`,
                      }}
                    />
                    {errors.expiry && <p className="text-xs text-red-400 font-medium">{errors.expiry}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">CVV</label>
                    <input
                      name="cvv"
                      value={form.cvv}
                      onChange={handleChange}
                      placeholder="•••"
                      type="password"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      className="w-full h-14 rounded-2xl px-5 text-white font-mono text-base font-bold placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: '#1E293B',
                        border: `1.5px solid ${errors.cvv ? '#EF4444' : '#334155'}`,
                      }}
                    />
                    {errors.cvv && <p className="text-xs text-red-400 font-medium">{errors.cvv}</p>}
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  type="submit"
                  className="w-full h-16 rounded-2xl font-black text-lg text-white relative overflow-hidden group mt-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <Lock size={18} />
                    Pay Now ₹{pd.amount?.toLocaleString('en-IN')}
                  </span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }} />
                </button>

                <p className="text-center text-slate-600 text-xs font-medium flex items-center justify-center gap-1.5">
                  <Lock size={11} />
                  Simulated secure payment — no real charges
                </p>
              </form>
            )}

            {step === 'processing' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ background: '#1E293B' }}>
                    <Loader2 size={36} className="text-blue-400 animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#3B82F6' }} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-white font-black text-xl">Processing Payment</p>
                  <p className="text-slate-500 text-sm font-medium">Please wait a moment…</p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="h-24 w-24 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.1)' }}
                >
                  <CheckCircle size={48} className="text-emerald-400" />
                </motion.div>
                <div className="text-center space-y-2">
                  <p className="text-white font-black text-xl">Payment Successful!</p>
                  <p className="text-slate-500 text-sm font-medium">Redirecting to your token…</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
