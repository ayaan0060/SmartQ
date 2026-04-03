import React, { useEffect, useState } from 'react';
import {
  Plus, Pencil, Trash2, Network, ToggleLeft, ToggleRight,
  CheckCircle2, Clock, DollarSign, Hash, AlertCircle,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../features/auth/useAuthStore';

const EMPTY = { name: '', avgTime: '', prefix: '', price: '' };

const Field = ({ label, name, type = 'text', placeholder, value, onChange, error }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value || ''}
      onChange={e => onChange(name, e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
      style={{
        background: '#0F172A',
        border: error ? '1px solid #EF4444' : '1px solid #1E293B',
      }}
      onFocus={e => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
      onBlur={e => { e.target.style.border = error ? '1px solid #EF4444' : '1px solid #1E293B'; e.target.style.boxShadow = 'none'; }}
    />
    {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
  </div>
);

const DeptCardSkeleton = () => (
  <div className="rounded-2xl p-5 animate-pulse" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
    <div className="flex items-start justify-between mb-4">
      <div className="h-10 w-10 rounded-xl" style={{ background: '#1E293B' }} />
      <div className="h-5 w-16 rounded-full" style={{ background: '#1E293B' }} />
    </div>
    <div className="h-4 w-32 rounded mb-2" style={{ background: '#1E293B' }} />
    <div className="h-3 w-20 rounded" style={{ background: '#1E293B' }} />
  </div>
);

export default function DepartmentsPage() {
  const { getHospitalId } = useAuthStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState({ open: false, mode: 'create', data: EMPTY });
  const [formErrors, setFormErrors] = useState({});

  const load = () => {
    const hospitalId = getHospitalId();
    if (!hospitalId) { setServices([]); setLoading(false); return; }
    setLoading(true);
    api.get(`/services/${hospitalId}`)
      .then(r => { const d = r.data?.data; setServices(Array.isArray(d) ? d : []); })
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validateForm = () => {
    const e = {};
    if (!modal.data.name?.trim())   e.name    = 'Department name is required';
    if (!modal.data.prefix?.trim()) e.prefix  = 'Token prefix is required';
    if (!modal.data.avgTime)        e.avgTime = 'Average wait time is required';
    return e;
  };

  const handleSave = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const hospitalId = getHospitalId();
    if (!hospitalId) { toast.error('No hospital assigned to your account'); return; }
    try {
      const payload = { ...modal.data, hospitalId, avgTime: Number(modal.data.avgTime), price: Number(modal.data.price) || 0 };
      if (modal.mode === 'create') {
        await api.post('/services', payload);
        toast.success('Department added!');
      } else {
        await api.put(`/services/${modal.data._id}`, payload);
        toast.success('Department updated!');
      }
      setModal(m => ({ ...m, open: false }));
      setFormErrors({});
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving department');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this department? This may disrupt token history.')) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success('Department removed');
      load();
    } catch { toast.error('Failed to delete department'); }
  };

  const toggleAvailability = async (service) => {
    try {
      await api.put(`/services/${service._id}`, { isActive: !service.isActive });
      load();
    } catch { toast.error('Failed to update availability'); }
  };

  const openCreate = () => { setModal({ open: true, mode: 'create', data: { ...EMPTY } }); setFormErrors({}); };
  const openEdit   = (s)  => { setModal({ open: true, mode: 'edit',   data: { ...s } });   setFormErrors({}); };
  const onField    = (name, value) => {
    setModal(m => ({ ...m, data: { ...m.data, [name]: value } }));
    setFormErrors(e => ({ ...e, [name]: '' }));
  };

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Departments</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            Manage hospital services and token queues
            {!loading && <span className="ml-2" style={{ color: '#475569' }}>· {services.length} total</span>}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] shrink-0"
          style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.4)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.25)'}
        >
          <Plus size={16} />
          Add Department
        </button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <DeptCardSkeleton key={i} />)}
        </div>
      ) : services.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
          style={{ background: '#0D1117', border: '1px solid #1E293B' }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
            style={{ background: '#1E293B' }}
          >
            <Network size={28} style={{ color: '#475569' }} />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No departments yet</h3>
          <p className="text-sm mb-6 max-w-xs" style={{ color: '#475569' }}>
            Add your first department to start managing token queues.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)' }}
          >
            <Plus size={16} /> Add Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(service => {
            const isActive = service.isActive !== false;
            return (
              <div
                key={service._id}
                className="rounded-2xl p-5 transition-all duration-200 group"
                style={{
                  background: '#0D1117',
                  border: `1px solid ${isActive ? '#1E293B' : '#1E293B'}`,
                  borderLeft: `3px solid ${isActive ? '#2563EB' : '#334155'}`,
                  opacity: isActive ? 1 : 0.7,
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: isActive ? 'rgba(37,99,235,0.12)' : '#1E293B' }}
                  >
                    <Network size={18} style={{ color: isActive ? '#3B82F6' : '#475569' }} />
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={
                      isActive
                        ? { background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }
                        : { background: 'rgba(100,116,139,0.1)', color: '#64748B', border: '1px solid #1E293B' }
                    }
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    {isActive ? 'Active' : 'Offline'}
                  </span>
                </div>

                {/* Name + prefix */}
                <h3 className="text-base font-semibold text-white mb-1 truncate">{service.name}</h3>
                <p className="text-xs mb-4" style={{ color: '#475569' }}>
                  Prefix: <span style={{ color: '#64748B', fontFamily: 'monospace' }}>{service.prefix}</span>
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
                    <Clock size={12} style={{ color: '#475569' }} />
                    <span>{service.avgTime} min avg</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
                    <DollarSign size={12} style={{ color: '#475569' }} />
                    <span>₹{service.price || 0}</span>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-2 pt-4"
                  style={{ borderTop: '1px solid #1E293B' }}
                >
                  {/* Toggle */}
                  <button
                    onClick={() => toggleAvailability(service)}
                    title={isActive ? 'Set offline' : 'Set active'}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200"
                    style={
                      isActive
                        ? { background: 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.15)' }
                        : { background: '#1E293B', color: '#64748B', border: '1px solid #334155' }
                    }
                  >
                    {isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {isActive ? 'Active' : 'Offline'}
                  </button>

                  <div className="flex-1" />

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(service)}
                    title="Edit department"
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200"
                    style={{ color: '#64748B', background: '#1E293B' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.12)'; e.currentTarget.style.color = '#3B82F6'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#64748B'; }}
                  >
                    <Pencil size={13} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(service._id)}
                    title="Delete department"
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200"
                    style={{ color: '#64748B', background: '#1E293B' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#64748B'; }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => { setModal(m => ({ ...m, open: false })); setFormErrors({}); }}
        title={modal.mode === 'create' ? 'Add Department' : 'Edit Department'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Department Name" name="name"    placeholder="e.g. Cardiology" value={modal.data.name}    onChange={onField} error={formErrors.name} />
            <Field label="Token Prefix"    name="prefix"  placeholder="e.g. CARD"       value={modal.data.prefix}  onChange={onField} error={formErrors.prefix} />
            <Field label="Avg Wait (mins)" name="avgTime" placeholder="15" type="number" value={modal.data.avgTime} onChange={onField} error={formErrors.avgTime} />
            <Field label="Booking Price (₹)" name="price" placeholder="500" type="number" value={modal.data.price}  onChange={onField} />
          </div>

          <div
            className="flex items-center justify-end gap-3 pt-4"
            style={{ borderTop: '1px solid #1E293B' }}
          >
            <button
              onClick={() => { setModal(m => ({ ...m, open: false })); setFormErrors({}); }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#E2E8F0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}
            >
              <CheckCircle2 size={15} />
              {modal.mode === 'create' ? 'Create Department' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
