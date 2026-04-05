import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CreditCard, Download, Eye, Clock, Shield, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import PageLayout from '../layouts/PageLayout';
import Skeleton from '../components/Skeleton';

// TODO: Replace with real outstanding balance from API
const MOCK_BALANCE = { amount: '$1,240.50', dueDays: 12 };

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/payments/history')
      .then(r => setPayments(r.data?.data ?? []))
      .catch(() => toast.error('Failed to load payment history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageLayout>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary mb-2 block">Patient Financial Portal</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Payment History</h1>
          <p className="text-zinc-500 mt-2 max-w-xl">Review and manage your clinical service invoices. Access detailed breakdowns of hospital visits and diagnostic procedures.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-surface-container-highest rounded-2xl text-sm font-semibold flex items-center gap-2 hover:bg-surface-container transition-colors text-on-surface">
            Filter
          </button>
          <button className="px-5 py-2.5 bg-primary text-on-primary rounded-2xl text-sm font-bold shadow-md hover:bg-primary-container transition-colors flex items-center gap-2">
            <Download size={16} /> Export All
          </button>
        </div>
      </header>

      {/* Bento summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        <div className="md:col-span-4 bg-surface-container-low rounded-2xl p-8 flex flex-col justify-between min-h-[240px]">
          <div>
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Outstanding Balance</h3>
            <div className="text-5xl font-black tracking-tight text-on-surface">{MOCK_BALANCE.amount}</div>
          </div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Clock size={16} />
            Due in {MOCK_BALANCE.dueDays} days
          </div>
        </div>

        <div className="md:col-span-8 bg-zinc-900 rounded-2xl p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Premium Health Plan</h3>
            <div className="text-2xl font-bold mb-4">Metropolitan General Center</div>
            <p className="text-zinc-400 text-sm max-w-md">Your active plan covers 85% of inpatient costs and 100% of emergency diagnostic imaging.</p>
          </div>
          <div className="relative z-10 flex gap-4 mt-6">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/20 to-transparent" />
        </div>
      </div>

      {/* Invoice list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <h2 className="text-lg font-bold text-on-surface">Recent Invoices</h2>
          <span className="text-sm text-zinc-400">Showing {payments.length} records</span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-24">
            <CreditCard size={64} className="mx-auto text-outline-variant mb-4" />
            <h3 className="text-2xl font-black text-on-surface">No payments yet</h3>
            <p className="text-secondary mt-2">Your payment history will appear here after your first transaction.</p>
          </div>
        ) : (
          payments.map(payment => (
            <motion.div
              key={payment._id}
              whileHover={{ boxShadow: '0 8px 24px rgba(26,28,28,0.08)' }}
              className={`bg-surface-container-lowest rounded-2xl p-6 group flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden ${payment.status === 'paid' ? 'border-l-4 border-primary' : 'border-l-4 border-zinc-200'}`}
            >
              <div className="flex items-start gap-6">
                <div className={`h-14 w-14 rounded-2xl bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform ${payment.status === 'paid' ? 'text-primary' : 'text-zinc-400'}`}>
                  <CreditCard size={28} />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    Inv #{payment.orderId?.slice(-6) || '------'} • {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                  </div>
                  <h4 className="text-lg font-bold text-on-surface">{payment.serviceId?.name || 'Medical Service'}</h4>
                  <p className="text-sm text-zinc-500">{payment.hospitalId?.name || 'Hospital'}</p>
                </div>
              </div>

              <div className="flex items-center gap-8 md:gap-12">
                <div className="text-right">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Amount</div>
                  <div className={`text-2xl font-black ${payment.status === 'paid' ? 'text-on-surface' : 'text-zinc-400'}`}>
                    ₹{payment.amount}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 rounded-2xl bg-secondary-container text-on-secondary-container hover:bg-zinc-200 transition-colors">
                    <Eye size={18} />
                  </button>
                  <button className="px-6 py-3 bg-primary text-on-primary rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-container transition-colors shadow-lg shadow-primary/10">
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </PageLayout>
  );
}
