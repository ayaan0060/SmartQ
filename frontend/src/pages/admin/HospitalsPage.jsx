import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Building2, CheckCircle2, ExternalLink, Users, Stethoscope, Activity, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../features/auth/useAuthStore';

const EMPTY = { name: '', email: '', location: '', address: '', contact: '', code: '', timings: '9:00 AM - 9:00 PM', plan: 'free', status: 'active' };

const statusConfig = {
  active:   { label: 'Active',   cls: 'badge-success' },
  inactive: { label: 'Inactive', cls: 'badge-danger' },
  pending:  { label: 'Pending',  cls: 'badge-warning' },
};
const planConfig = {
  enterprise: { label: 'Enterprise', cls: 'badge-purple' },
  basic:      { label: 'Basic',      cls: 'badge-primary' },
  free:       { label: 'Free',       cls: 'badge-gray' },
};

// Module-level Field to avoid "component created during render" error
const Field = ({ label, name, type = 'text', options, data, onChange }) => (
  <div>
    <label className="label">{label}</label>
    {options ? (
      <select value={data[name] || ''} onChange={e => onChange(name, e.target.value)} className="input">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input type={type} value={data[name] || ''} onChange={e => onChange(name, e.target.value)} className="input" />
    )}
  </div>
);


export default function HospitalsPage() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuthStore();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: EMPTY });

  const load = () => {
    setLoading(true);
    api.get('/hospitals')
      .then(r => setHospitals(r.data.data.hospitals || []))
      .catch(() => toast.error('Failed to load hospitals'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleApprove = async (e, id) => {
    e.stopPropagation();
    try {
      await api.patch(`/hospitals/${id}/approve`);
      toast.success('Hospital approved and is now active!');
      load();
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Reject this hospital registration?')) return;
    try {
      await api.patch(`/hospitals/${id}/reject`);
      toast.success('Hospital registration rejected.');
      load();
    } catch { toast.error('Failed to reject'); }
  };

  const pendingCount = hospitals.filter(h => h.status === 'pending').length;

  const filtered = hospitals.filter(h => {
    const matchSearch = !search || h.name?.toLowerCase().includes(search.toLowerCase()) || h.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || h.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async () => {
    try {
      if (modal.mode === 'create') {
        await api.post('/hospitals', modal.data);
        toast.success('Hospital created!');
      } else {
        await api.patch(`/hospitals/${modal.data._id}`, modal.data);
        toast.success('Hospital updated!');
      }
      setModal(m => ({ ...m, open: false }));
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving hospital');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this hospital and all its data?')) return;
    try {
      await api.delete(`/hospitals/${id}`);
      toast.success('Hospital deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };


  const onFieldChange = (name, value) => setModal(m => ({ ...m, data: { ...m.data, [name]: value } }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Hospitals</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            {hospitals.length} registered hospital{hospitals.length !== 1 ? 's' : ''} across the platform
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: { ...EMPTY } })}>
          <Plus size={16} /> Add Hospital
        </button>
      </div>

      {/* Pending alert */}
      {isSuperAdmin() && pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}>
          <Clock size={16} />
          {pendingCount} hospital{pendingCount > 1 ? 's' : ''} pending your review — approve or reject below.
        </div>
      )}

      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search hospitals by name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input max-w-sm"
        />
        {isSuperAdmin() && (
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
            {['all', 'active', 'pending', 'inactive'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-2 text-xs font-semibold capitalize transition-colors"
                style={{
                  background: statusFilter === s ? '#2563EB' : '#0D1117',
                  color: statusFilter === s ? '#fff' : '#6B7280',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hospital Cards Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 h-48 animate-pulse" style={{ background: '#111827' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={40} className="mx-auto mb-3" style={{ color: '#374151' }} />
          <p className="text-sm" style={{ color: '#6B7280' }}>No hospitals found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(h => {
            const sc = statusConfig[h.status] || statusConfig.active;
            const pc = planConfig[h.plan] || planConfig.free;
            return (
              <div
                key={h._id}
                className="card p-5 cursor-pointer group hover:border-blue-500/30 transition-all duration-200 hover:scale-[1.01]"
                style={{ border: '1px solid #1F2937' }}
                onClick={() => navigate(`/admin/hospitals/${h._id}`)}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate group-hover:text-blue-400 transition-colors">{h.name}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#6B7280' }}>{h.location || '—'}</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#3B82F6' }} />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { icon: Stethoscope, label: 'Doctors',  value: h.doctorCount ?? 0,      color: '#10B981' },
                    { icon: Users,       label: 'Patients', value: h.patientCount ?? 0,      color: '#8B5CF6' },
                    { icon: Activity,    label: 'Active Q', value: h.activeQueueCount ?? 0,  color: '#F59E0B' },
                  // eslint-disable-next-line no-unused-vars
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="rounded-lg p-2 text-center" style={{ background: '#0F1623', border: '1px solid #1F2937' }}>
                      <Icon size={12} className="mx-auto mb-1" style={{ color }} />
                      <p className="text-base font-bold font-display text-white leading-none">{value}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${sc.cls} text-xs`}>{sc.label}</span>
                    <span className={`badge ${pc.cls} text-xs`}>{pc.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isSuperAdmin() && h.status === 'pending' && (
                      <>
                        <button
                          className="btn py-1 px-2 text-xs font-semibold"
                          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
                          onClick={e => handleApprove(e, h._id)}
                          title="Approve hospital"
                        >
                          <ThumbsUp size={12} /> Approve
                        </button>
                        <button
                          className="btn py-1 px-2 text-xs font-semibold"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
                          onClick={e => handleReject(e, h._id)}
                          title="Reject hospital"
                        >
                          <ThumbsDown size={12} /> Reject
                        </button>
                      </>
                    )}
                    {(!isSuperAdmin() || h.status !== 'pending') && (
                      <>
                        <button
                          className="btn btn-ghost py-1 px-2"
                          onClick={e => { e.stopPropagation(); setModal({ open: true, mode: 'edit', data: { ...h } }); }}
                          title="Edit hospital"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn btn-ghost py-1 px-2"
                          style={{ color: '#EF4444' }}
                          onClick={e => handleDelete(e, h._id)}
                          title="Delete hospital"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Created date */}
                <p className="text-[10px] mt-3 pt-3" style={{ color: '#4B5563', borderTop: '1px solid #1F2937' }}>
                  Created {new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.mode === 'create' ? 'Add Hospital' : 'Edit Hospital'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hospital Name"   name="name"     data={modal.data} onChange={onFieldChange} />
            <Field label="Code (e.g. AP)"  name="code"     data={modal.data} onChange={onFieldChange} />
            <Field label="Email"           name="email"    type="email" data={modal.data} onChange={onFieldChange} />
            <Field label="Contact"         name="contact"  data={modal.data} onChange={onFieldChange} />
            <Field label="Location (City)" name="location" data={modal.data} onChange={onFieldChange} />
            <Field label="Timings"         name="timings"  data={modal.data} onChange={onFieldChange} />
          </div>
          <Field label="Full Address" name="address" data={modal.data} onChange={onFieldChange} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Plan" name="plan" data={modal.data} onChange={onFieldChange} options={[
              { value: 'free', label: 'Free' },
              { value: 'basic', label: 'Basic' },
              { value: 'enterprise', label: 'Enterprise' },
            ]} />
            <Field label="Status" name="status" data={modal.data} onChange={onFieldChange} options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' },
            ]} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn btn-secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <CheckCircle2 size={15} /> {modal.mode === 'create' ? 'Create Hospital' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
