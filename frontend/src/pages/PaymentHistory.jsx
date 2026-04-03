import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { CreditCard, Building, Calendar, CheckCircle2, Clock, Ticket, IndianRupee } from 'lucide-react';
import { staggerContainer, fadeUp } from '../utils/motion';

import api from '../lib/api';
import PageLayout from '../layouts/PageLayout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/payments/history');
        setPayments(res.data?.data ?? []);
      } catch {
        toast.error('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <PageLayout className="space-y-8 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-16 w-16 rounded-3xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="max-w-4xl mx-auto space-y-10 pb-12">
      <header className="flex items-center gap-6 px-2">
        <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-slate-800 text-white shadow-xl">
          <CreditCard size={30} />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-white font-display">Payment History</h1>
          <p className="text-slate-400 font-medium">All your past transactions in one place.</p>
        </div>
      </header>

      <div className="space-y-4">
        {payments.length === 0 ? (
          <Card className="p-16 text-center flex flex-col items-center justify-center border-none bg-slate-800/60 shadow-premium rounded-4xl">
            <div className="h-24 w-24 rounded-full bg-slate-700 flex items-center justify-center text-slate-500 mb-8">
              <Ticket size={48} />
            </div>
            <h3 className="text-2xl font-bold text-white font-display">No payments yet</h3>
            <p className="text-slate-400 max-w-xs mt-3 font-medium">You haven't made any payments. Book a paid service to get started.</p>
            <Link
              to="/"
              className="mt-10 px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
            >
              Book a Service
            </Link>
          </Card>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4"
          >
            {payments.map((payment) => (
              <motion.div key={payment._id} variants={shouldReduceMotion ? {} : fadeUp}>
                <Card className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 border-none bg-slate-800/60 shadow-premium hover:shadow-2xl hover:scale-[1.01] transition-all rounded-3xl">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="h-16 w-16 shrink-0 rounded-2xl bg-primary/10 text-primary flex flex-col items-center justify-center">
                      <IndianRupee size={14} strokeWidth={3} className="opacity-60" />
                      <span className="text-xl font-black leading-none font-display">{payment.amount}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Building size={13} className="text-primary" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {payment.hospitalId?.name || 'Hospital'}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-white">{payment.serviceId?.name || 'Service'}</h4>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-slate-600" />
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {format(new Date(payment.createdAt), 'hh:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 md:mt-0 flex items-center justify-between md:justify-end gap-6 border-t border-slate-700 pt-6 md:border-0 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Order ID</p>
                      <p className="font-mono text-xs text-slate-400 font-bold">{payment.orderId}</p>
                    </div>
                    <Badge
                      variant={payment.status === 'paid' ? 'success' : payment.status === 'failed' ? 'error' : 'warning'}
                      className="flex items-center gap-1.5"
                    >
                      {payment.status === 'paid' && <CheckCircle2 size={12} />}
                      {payment.status.toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
};

export default PaymentHistory;
