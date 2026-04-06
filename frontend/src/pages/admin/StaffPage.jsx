import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Stethoscope, UserPlus, X, Edit, MoreVertical } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import StaffFilterBar from '../../components/staff/StaffFilterBar';
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
    const valid = STAFF_ROLE_FILTERS.some(x => x.id === roleParam);
    if (valid) setRoleFilter(roleParam);
  }, [roleParam]);

  const filtered = useMemo(() => {
    const list = data?.staff || [];
    if (roleFilter === 'all') return list;
    return list.filter(s => s.role === roleFilter);
  }, [data?.staff, roleFilter]);

  const handleCreateReceptionist = async (e) => {
    e.preventDefault();
    setReceptionistLoading(true);
    try {
      await api.post('/auth/register-receptionist', receptionistForm);
      toast.success('Receptionist account created!');
      setReceptionistModal(false);
      setReceptionistForm({ name: '', email: '', password: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create receptionist');
    } finally { setReceptionistLoading(false); }
  };

  const handleCreateDoctorAccount = async (e) => {
    e.preventDefault();
    setDoctorAccountLoading(true);
    try {
      await api.post('/auth/register-doctor', doctorAccountForm);
      toast.success('Doctor account created!');
      setDoctorAccountModal(false);
      setDoctorAccountForm({ name: '', email: '', password: '', doctorId: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create doctor account');
    } finally { setDoctorAccountLoading(false); }
  };

  const handleToggleDoctorAvailability = async (row) => {
    if (!row?._id) return;
    try { await api.patch(`/doctors/${row._id}/availability`); toast.success('Availability updated'); refetch(); }
    catch (e) { toast.error(e.displayMessage || 'Failed to update availability'); }
  };


  const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 transition-all';

  const getStatusColor = (staff) => {
    if (staff.isAvailable === true || staff.isActive === true) return 'bg-emerald-500';
    if (staff.isAvailable === false || staff.isActive === false) return 'bg-zinc-400';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-2">Personnel Directory</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Staff Management</h1>
          <p className="text-zinc-500 mt-2 max-w-md text-sm">Orchestrate clinical excellence across departments with real-time status tracking and privilege control.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setPersonnelModal({ open: true, mode: 'create', row: null })}
          className="flex items-center gap-2 bg-on-surface text-surface px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <UserPlus size={18} /> Add New Staff
        </motion.button>
      </div>

      {/* Filter bar */}
      <div className="bg-surface-container-low p-2 rounded-2xl flex flex-wrap items-center gap-2 mb-8 border border-zinc-200/5">
        <div className="flex-1 min-w-[240px] flex items-center px-4 py-2 gap-3 bg-surface-container-lowest rounded-xl border border-outline-variant/10 focus-within:ring-2 ring-primary/20 transition-all">
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface outline-none placeholder:text-secondary"
            placeholder="Filter by name, ID, or specialty..."
            type="text"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setDoctorModal({ open: true, mode: 'create', row: null })} className="btn btn-secondary text-xs">
            <Stethoscope size={14} /> Add Doctor
          </button>
          <button type="button" onClick={() => setDoctorAccountModal(true)} className="btn btn-secondary text-xs">
            <Stethoscope size={14} /> Doctor Login
          </button>
          <button type="button" onClick={() => setReceptionistModal(true)} className="btn btn-secondary text-xs">
            <UserPlus size={14} /> Add Receptionist
          </button>
        </div>
      </div>

      {/* Role filter */}
      <div className="bg-surface-container-low rounded-2xl p-4 mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-3">Filter by role</p>
        <StaffFilterBar active={roleFilter} onChange={setRoleFilter} roleCounts={data?.roleCounts || {}} />
      </div>

      {/* Staff bento grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl animate-pulse bg-surface-container" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-error">{error?.displayMessage || 'Failed to load staff'}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(staff => {
            const isOnline = staff.isAvailable !== false && staff.isActive !== false;
            const isPrimary = staff._type === 'doctor' || staff.specialization;
            return (
              <motion.div
                key={staff._id}
                whileHover={{ boxShadow: '0 4px 16px rgba(26,28,28,0.08)' }}
                className={`bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm relative ${isPrimary ? 'border-l-4 border-primary' : ''} ${!isOnline ? 'opacity-80' : ''}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-2xl overflow-hidden bg-surface-container flex items-center justify-center text-2xl font-black text-on-primary ${!isOnline ? 'grayscale' : ''}`}>
                        {staff.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-surface-container-lowest rounded-full ${getStatusColor(staff)}`} />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => isPrimary ? setDoctorModal({ open: true, mode: 'edit', row: staff }) : setPersonnelModal({ open: true, mode: 'edit', row: staff })}
                        className="p-1.5 text-zinc-400 hover:text-primary transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button className="p-1.5 text-zinc-400 hover:text-primary transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-bold text-on-surface">{staff.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isPrimary ? 'text-primary' : 'text-zinc-600'}`}>
                      {staff.specialization || staff.role || 'Staff'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">Department: {staff.department || 'General'}</p>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-zinc-100">
                    {isPrimary ? (
                      <>
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">Patients</p>
                          <p className="font-bold text-on-surface">{staff.currentPatients || '—'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">Fee</p>
                          <p className="font-bold text-on-surface">₹{staff.consultationFee || '—'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">Status</p>
                          <p className={`font-bold text-xs ${isOnline ? 'text-green-600' : 'text-zinc-400'}`}>{isOnline ? 'Online' : 'Offline'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">Role</p>
                          <p className="font-bold text-on-surface text-xs">{staff.role}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">Status</p>
                          <p className={`font-bold text-xs ${isOnline ? 'text-green-600' : 'text-zinc-400'}`}>{isOnline ? 'Active' : 'Inactive'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-surface-container-high text-zinc-700 py-2 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors">
                      Message
                    </button>
                    {isPrimary ? (
                      <button
                        onClick={() => handleToggleDoctorAvailability(staff)}
                        className="flex-1 bg-primary text-on-primary py-2 rounded-xl text-xs font-bold shadow-sm shadow-primary/10"
                      >
                        {staff.isAvailable ? 'Set Unavailable' : 'Set Available'}
                      </button>
                    ) : (
                      <button className="flex-1 bg-secondary-container text-on-secondary-container py-2 rounded-xl text-xs font-bold">
                        Shift Schedule
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Add new placeholder */}
          <motion.div
            whileHover={{ borderColor: 'rgba(165, 0, 27, 0.4)' }}
            onClick={() => setPersonnelModal({ open: true, mode: 'create', row: null })}
            className="border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center group cursor-pointer transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors mb-3">
              <Plus size={24} />
            </div>
            <p className="font-bold text-sm text-zinc-400 group-hover:text-primary transition-colors">Register Personnel</p>
            <p className="text-[10px] text-zinc-400 mt-1">Add details for new onboarding staff members.</p>
          </motion.div>
        </div>
      )}

      {/* Modals */}
      <StaffPersonnelModal
        open={personnelModal.open}
        mode={personnelModal.mode}
        initial={personnelModal.row}
        onClose={() => setPersonnelModal(m => ({ ...m, open: false }))}
        onSaved={() => refetch()}
      />
      <StaffDoctorModal
        open={doctorModal.open}
        mode={doctorModal.mode}
        row={doctorModal.row}
        onClose={() => setDoctorModal({ open: false, mode: 'create', row: null })}
        onSaved={() => refetch()}
      />

      {/* Receptionist modal */}
      {receptionistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5 bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Create Receptionist Account</h2>
              <button onClick={() => setReceptionistModal(false)} className="text-secondary"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateReceptionist} className="space-y-4">
              {[{ label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Priya Sharma' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'priya@hospital.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 8 characters' }]
                .map(({ label, key, type, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-secondary">{label}</label>
                    <input type={type} placeholder={placeholder} required value={receptionistForm[key]}
                      onChange={e => setReceptionistForm(f => ({ ...f, [key]: e.target.value }))}
                      className={inputCls} />
                  </div>
                ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReceptionistModal(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-secondary-container text-on-secondary-container">Cancel</button>
                <button type="submit" disabled={receptionistLoading} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-on-primary bg-primary">
                  {receptionistLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor account modal */}
      {doctorAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5 bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Create Doctor Login Account</h2>
              <button onClick={() => setDoctorAccountModal(false)} className="text-secondary"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateDoctorAccount} className="space-y-4">
              {[{ label: 'Full Name', key: 'name', type: 'text', placeholder: 'Dr. John Smith' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'doctor@hospital.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 8 characters' }]
                .map(({ label, key, type, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-secondary">{label}</label>
                    <input type={type} placeholder={placeholder} required value={doctorAccountForm[key]}
                      onChange={e => setDoctorAccountForm(f => ({ ...f, [key]: e.target.value }))}
                      className={inputCls} />
                  </div>
                ))}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-secondary">Link to Doctor Profile (optional)</label>
                <select value={doctorAccountForm.doctorId}
                  onChange={e => setDoctorAccountForm(f => ({ ...f, doctorId: e.target.value }))}
                  className={inputCls}>
                  <option value="">Select doctor profile...</option>
                  {(data?.staff || []).filter(s => s._type === 'doctor' || s.specialization).map(d => (
                    <option key={d._id} value={d._id}>{d.name} — {d.specialization}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setDoctorAccountModal(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-secondary-container text-on-secondary-container">Cancel</button>
                <button type="submit" disabled={doctorAccountLoading} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-on-primary bg-primary">
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
