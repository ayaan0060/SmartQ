import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Ticket, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../features/auth/useAuthStore';
import Card from '../../components/ui/Card';
import BackButton from '../../components/ui/BackButton';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } };

export default function IssueToken() {
  const { user } = useAuthStore();
  const hospitalId = user?.hospitalId;
  const [services, setServices] = useState([]);
  const [step, setStep] = useState(1);
  const [searchPhone, setSearchPhone] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({ patientName: '', phone: '', serviceId: '', priority: 'normal', notes: '' });
  const [issuing, setIssuing] = useState(false);
  const [issuedToken, setIssuedToken] = useState(null);

  useEffect(() => {
    if (hospitalId) {
      api.get(`/services/${hospitalId}`)
        .then(r => setServices(Array.isArray(r.data.data) ? r.data.data : []))
        .catch(() => {});
    }
  }, [hospitalId]);

  const searchPatient = async () => {
    if (!searchPhone.trim()) return;
    setSearching(true);
    try {
      const r = await api.get(`/patients?phone=${searchPhone.trim()}`);
      const patients = r.data.data?.patients || r.data.data || [];
      if (patients.length > 0) {
        setFoundPatient(patients[0]);
        setForm(f => ({ ...f, patientName: patients[0].name || '', phone: patients[0].phone || '' }));
        toast.success('Patient found');
      } else {
        setFoundPatient(null);
        toast('New patient — fill in details', { icon: '📝' });
      }
    } catch { setFoundPatient(null); }
    finally { setSearching(false); }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!form.serviceId) { toast.error('Select a department'); return; }
    if (!form.patientName.trim()) { toast.error('Patient name required'); return; }
    setIssuing(true);
    try {
      const r = await api.post('/queue', {
        serviceId: form.serviceId,
        priority: form.priority,
        patientName: form.patientName.trim(),
        notes: form.notes,
      });
      setIssuedToken(r.data.data.token);
      setStep(4);
      toast.success('Token issued successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to issue token');
    } finally { setIssuing(false); }
  };

  const reset = () => {
    setStep(1);
    setSearchPhone('');
    setFoundPatient(null);
    setForm({ patientName: '', phone: '', serviceId: '', priority: 'normal', notes: '' });
    setIssuedToken(null);
  };

  return (
    <motion.div className="space-y-6" {...fadeUp}>
      <BackButton />
      <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Issue Token</h1>

      {/* Steps indicator */}
       <div className="flex items-center gap-2 text-xs font-semibold text-(--muted)">
        {['Search Patient', 'Select Department', 'Confirm & Issue', 'Token Issued'].map((label, i) => (
          <React.Fragment key={label}>
             <span className={`px-3 py-1.5 rounded-full transition-all ${step === i + 1 ? 'bg-(--smartq-red) text-white' : step > i + 1 ? 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300' : 'bg-gray-100 dark:bg-white/5'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </span>
             <span className={step === i + 1 ? 'text-(--foreground)' : ''}>{label}</span>
            {i < 3 && <span className="text-(--border)">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Search */}
      {step === 1 && (
        <Card>
           <h2 className="text-lg font-semibold text-(--foreground) mb-4">Search Existing Patient</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted)" />
              <input className="input pl-10" placeholder="Search by phone number..." value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchPatient()} />
            </div>
             <button onClick={searchPatient} disabled={searching}
              className="bg-(--smartq-red) text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all disabled:opacity-50">
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {foundPatient && (
            <div className="mt-4 p-4 rounded-lg border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">Found: {foundPatient.name}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{foundPatient.phone} · {foundPatient.email}</p>
            </div>
          )}
           <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-(--muted) mb-1 block">Patient Name</label>
              <input className="input" placeholder="Full name" value={form.patientName}
                onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
            </div>
             <button onClick={() => { if (form.patientName.trim()) setStep(2); else toast.error('Enter patient name'); }}
              className="bg-(--smartq-red) text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all">
              Next →
            </button>
          </div>
        </Card>
      )}

      {/* Step 2: Department & Priority */}
      {step === 2 && (
         <Card>
          <h2 className="text-lg font-semibold text-(--foreground) mb-4">Select Department & Priority</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-(--muted) mb-1 block">Department</label>
              <select className="input" value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
                <option value="">Choose department...</option>
                {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
             <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-(--muted) mb-1 block">Patient Type</label>
              <div className="flex gap-2">
                {['normal', 'high', 'emergency'].map(p => (
                  <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`flex-1 rounded-lg py-2.5 text-xs font-semibold capitalize transition-all border ${
                      form.priority === p
                        ? p === 'emergency' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30'
                          : p === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                          : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30'
                        : 'border-(--border) text-(--muted) hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >{p === 'normal' ? 'Regular' : p === 'high' ? 'Follow-up' : 'Emergency'}</button>
                ))}
              </div>
            </div>
             <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-(--muted) mb-1 block">Notes (optional)</label>
              <input className="input" placeholder="Any additional notes..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
             <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="border border-(--border) text-(--foreground) rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all">← Back</button>
              <button onClick={() => { if (form.serviceId) setStep(3); else toast.error('Select department'); }}
                className="bg-(--smartq-red) text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all">
                Next →
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
         <Card>
          <h2 className="text-lg font-semibold text-(--foreground) mb-4">Confirm & Issue Token</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b border-(--border)">
              <span className="text-sm text-(--muted)">Patient</span>
              <span className="text-sm font-semibold text-(--foreground)">{form.patientName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-(--border)">
              <span className="text-sm text-(--muted)">Department</span>
              <span className="text-sm font-semibold text-(--foreground)">{services.find(s => s._id === form.serviceId)?.name || '-'}</span>
            </div>
             <div className="flex justify-between py-2 border-b border-(--border)">
              <span className="text-sm text-(--muted)">Priority</span>
              <span className="text-sm font-semibold capitalize text-(--foreground)">{form.priority}</span>
            </div>
            {form.notes && (
               <div className="flex justify-between py-2">
                <span className="text-sm text-(--muted)">Notes</span>
                <span className="text-sm text-(--foreground)">{form.notes}</span>
              </div>
            )}
          </div>
           <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="border border-(--border) text-(--foreground) rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all">← Back</button>
            <button onClick={handleIssue} disabled={issuing}
              className="flex-1 bg-(--smartq-red) text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Ticket size={16} /> {issuing ? 'Issuing...' : 'Issue Token'}
            </button>
          </div>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === 4 && issuedToken && (
        <Card className="text-center">
          <div className="py-8">
            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
             <h2 className="text-2xl font-bold text-(--foreground) mb-2">Token Issued</h2>
            <div className="inline-block bg-gray-50 dark:bg-white/5 rounded-2xl px-8 py-4 my-4">
              <p className="text-5xl font-bold text-(--smartq-red) tabular-nums">{issuedToken.tokenNumber}</p>
            </div>
            <p className="text-sm text-(--muted)">{form.patientName} · {services.find(s => s._id === form.serviceId)?.name}</p>
            <button onClick={reset} className="mt-6 bg-(--smartq-red) text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-(--smartq-red-hover) transition-all">
              Issue Another Token
            </button>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
