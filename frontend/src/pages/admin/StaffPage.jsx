import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Briefcase, Stethoscope, UserPlus, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import StaffFilterBar from '../../components/staff/StaffFilterBar';
import StaffDirectoryTable from '../../components/staff/StaffDirectoryTable';
import StaffPersonnelModal from '../../components/staff/StaffPersonnelModal';
import StaffDoctorModal from '../../components/staff/StaffDoctorModal';
import { useStaffDirectory } from '../../features/staff/useStaffDirectory';
import { STAFF_ROLE_FILTERS } from '../../features/staff/staffRoleConfig';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function StaffPage() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const { data, isLoading, isError, error, refetch } = useStaffDirectory();
  const [roleFilter, setRoleFilter] = useState('all');
  const [personnelModal, setPersonnelModal] = useState({ open: false, mode: 'create', row: null });
  const [doctorModal, setDoctorModal] = useState({ open: false, mode: 'create', row: null });
  const [receptionistModal, setReceptionistModal] = useState(false);
  const [receptionistForm, setReceptionistForm] = useState({ name: '', email: '', password: '' });
  const [receptionistLoading, setReceptionistLoading] = useState(false);
  const [doctorAccountModal, setDoctorAccountModal] = useState(false);
  const [doctorAccountForm, setDoctorAccountForm] = useState({ name: '', email: '', password: '', doctorId: '' });
  const [doctorAccountLoading, setDoctorAccountLoading] = useState(false);

  useEffect(() => {
    const valid = STAFF_ROLE_FILTERS.some((x) => x.id === roleParam);
    if (valid) setRoleFilter(roleParam);
  }, [roleParam]);

  const roleCounts = data?.roleCounts || {};
  const partialLoad = data?.partialLoad;
  const loadWarnings = data?.loadWarnings || [];

  const filtered = useMemo(() => {
    const list = data?.staff || [];
    if (roleFilter === 'all') return list;
    return list.filter((s) => s.role === roleFilter);
  }, [data?.staff, roleFilter]);

  const errorMessage = isError
    ? (error?.displayMessage || error?.message || 'Could not load staff directory.')
    : null;

  const openCreatePersonnel = () => setPersonnelModal({ open: true, mode: 'create', row: null });
  const openCreateDoctor = () => setDoctorModal({ open: true, mode: 'create', row: null });

  const handleCreateReceptionist = async (e) => {
    e.preventDefault();
    setReceptionistLoading(true);
    try {
      await api.post('/auth/register-receptionist', receptionistForm);
      toast.success('Receptionist account created! They can now log in.');
      setReceptionistModal(false);
      setReceptionistForm({ name: '', email: '', password: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create receptionist');
    } finally {
      setReceptionistLoading(false);
    }
  };

  const handleCreateDoctorAccount = async (e) => {
    e.preventDefault();
    setDoctorAccountLoading(true);
    try {
      await api.post('/auth/register-doctor', doctorAccountForm);
      toast.success('Doctor account created! They can now log in at /login.');
      setDoctorAccountModal(false);
      setDoctorAccountForm({ name: '', email: '', password: '', doctorId: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create doctor account');
    } finally {
      setDoctorAccountLoading(false);
    }
  };

  const handleToggleDoctorAvailability = async (row) => {
    if (!row?._id) return;
    try {
      await api.patch(`/doctors/${row._id}/availability`);
      toast.success('Availability updated');
      refetch();
    } catch (e) {
      toast.error(e.displayMessage || 'Failed to update availability');
    }
  };

  const handleDeleteDoctor = async (row) => {
    if (!row?._id) return;
    if (!window.confirm(`Remove ${row.name} from the hospital? This cannot be undone.`)) return;
    try {
      await api.delete(`/doctors/${row._id}`);
      toast.success('Doctor removed');
      refetch();
    } catch (e) {
      toast.error(e.displayMessage || 'Failed to delete doctor');
    }
  };

  const handleDeactivatePersonnel = async (row) => {
    if (!row?._id || !row.isActive) return;
    if (!window.confirm(`Deactivate ${row.name}?`)) return;
    try {
      await api.patch(`/staff/${row._id}`, { isActive: false });
      toast.success('Staff member deactivated');
      refetch();
    } catch (e) {
      toast.error(e.displayMessage || 'Failed to deactivate');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
            >
              <Briefcase size={18} className="text-blue-400" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">Staff</h1>
              <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
                Doctors, nurses, drivers, and the full team — one directory. Use the role filters to focus
                on a group.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button type="button" className="btn btn-secondary" onClick={openCreateDoctor}>
            <Stethoscope size={16} /> Add doctor
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setDoctorAccountModal(true)}>
            <Stethoscope size={16} /> Doctor Login
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setReceptionistModal(true)}>
            <UserPlus size={16} /> Add receptionist
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreatePersonnel}>
            <Plus size={16} /> Add staff
          </button>
        </div>
      </div>

      {partialLoad && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#FCD34D',
          }}
        >
          {loadWarnings.includes('personnel') && loadWarnings.includes('doctors')
            ? 'Could not refresh all sources; showing what could be loaded.'
            : loadWarnings.includes('personnel')
              ? 'Other staff (nurses, drivers, …) could not be loaded. Doctors are still shown when available.'
              : 'Could not load the Doctors API; doctor rows may come from the staff export only.'}
          <button
            type="button"
            className="ml-2 font-semibold underline-offset-2 hover:underline"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="card p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>
          Filter by role
        </p>
        <StaffFilterBar active={roleFilter} onChange={setRoleFilter} roleCounts={roleCounts} />
      </div>

      <StaffDirectoryTable
        rows={filtered}
        loading={isLoading}
        errorMessage={errorMessage}
        onEditDoctor={(row) => setDoctorModal({ open: true, mode: 'edit', row })}
        onEditPersonnel={(row) => setPersonnelModal({ open: true, mode: 'edit', row })}
        onToggleDoctorAvailability={handleToggleDoctorAvailability}
        onDeleteDoctor={handleDeleteDoctor}
        onDeactivatePersonnel={handleDeactivatePersonnel}
      />

      <StaffPersonnelModal
        open={personnelModal.open}
        mode={personnelModal.mode}
        initial={personnelModal.row}
        onClose={() => setPersonnelModal((m) => ({ ...m, open: false }))}
        onSaved={() => refetch()}
      />

      <StaffDoctorModal
        open={doctorModal.open}
        mode={doctorModal.mode}
        row={doctorModal.row}
        onClose={() => setDoctorModal({ open: false, mode: 'create', row: null })}
        onSaved={() => refetch()}
      />

      {/* Receptionist Account Modal */}
      {receptionistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create Receptionist Account</h2>
              <button onClick={() => setReceptionistModal(false)} style={{ color: '#6B7280' }}><X size={20} /></button>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>This person will log in at <span className="text-blue-400">/login</span> and manage the queue counter at <span className="text-blue-400">/reception</span>.</p>
            <form onSubmit={handleCreateReceptionist} className="space-y-4">
              {[{ label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Priya Sharma' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'priya@hospital.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 8 characters' }]
                .map(({ label, key, type, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      required
                      value={receptionistForm[key]}
                      onChange={e => setReceptionistForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                      style={{ background: '#0F172A', border: '1px solid #1E293B' }}
                      onFocus={e => e.target.style.border = '1px solid #2563EB'}
                      onBlur={e => e.target.style.border = '1px solid #1E293B'}
                    />
                  </div>
                ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReceptionistModal(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: '#1E293B', color: '#94A3B8' }}>
                  Cancel
                </button>
                <button type="submit" disabled={receptionistLoading}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: '#2563EB', opacity: receptionistLoading ? 0.7 : 1 }}>
                  {receptionistLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Doctor Account Modal */}
      {doctorAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create Doctor Login Account</h2>
              <button onClick={() => setDoctorAccountModal(false)} style={{ color: '#6B7280' }}><X size={20} /></button>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>Doctor will log in at <span className="text-blue-400">/login</span> and see their patient queue at <span className="text-blue-400">/doctor</span>.</p>
            <form onSubmit={handleCreateDoctorAccount} className="space-y-4">
              {[{ label: 'Full Name', key: 'name', type: 'text', placeholder: 'Dr. John Smith' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'doctor@hospital.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 8 characters' }]
                .map(({ label, key, type, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>{label}</label>
                    <input type={type} placeholder={placeholder} required
                      value={doctorAccountForm[key]}
                      onChange={e => setDoctorAccountForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                      style={{ background: '#0F172A', border: '1px solid #1E293B' }}
                      onFocus={e => e.target.style.border = '1px solid #2563EB'}
                      onBlur={e => e.target.style.border = '1px solid #1E293B'} />
                  </div>
                ))}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Link to Doctor Profile (optional)</label>
                <select value={doctorAccountForm.doctorId}
                  onChange={e => setDoctorAccountForm(f => ({ ...f, doctorId: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0' }}
                  onFocus={e => e.target.style.border = '1px solid #2563EB'}
                  onBlur={e => e.target.style.border = '1px solid #1E293B'}>
                  <option value="">Select doctor profile...</option>
                  {(data?.staff || []).filter(s => s._type === 'doctor' || s.specialization).map(d => (
                    <option key={d._id} value={d._id} style={{ background: '#0D1117' }}>{d.name} — {d.specialization}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setDoctorAccountModal(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: '#1E293B', color: '#94A3B8' }}>
                  Cancel
                </button>
                <button type="submit" disabled={doctorAccountLoading}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: '#2563EB', opacity: doctorAccountLoading ? 0.7 : 1 }}>
                  {doctorAccountLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
