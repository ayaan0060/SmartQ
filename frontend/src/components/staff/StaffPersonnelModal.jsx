import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { PERSONNEL_ROLES } from '../../features/staff/staffRoleConfig';
import { useAuthStore } from '../../features/auth/useAuthStore';

const SHIFT_DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const emptyMeta = () => ({
  wardAssigned: '',
  ambulanceId: '',
  zoneAssigned: '',
  pharmacyWing: '',
  labAssigned: '',
  gateOrFloor: '',
  frontDesk: '',
  shift: { start: '', end: '', days: [] },
  notes: '',
});

function buildPayload(mode, data, getHospitalId) {
  const hospitalId = getHospitalId();
  const meta = data.meta || {};
  const shift = {
    start: meta.shift?.start || '',
    end: meta.shift?.end || '',
    days: Array.isArray(meta.shift?.days) ? meta.shift.days : [],
  };
  const base = {
    role: data.role,
    name: data.name,
    email: data.email || '',
    phone: data.phone || '',
    shift,
    notes: meta.notes || '',
    isActive: data.isActive !== false,
    wardAssigned: meta.wardAssigned || '',
    ambulanceId: meta.ambulanceId || null,
    zoneAssigned: meta.zoneAssigned || '',
    pharmacyWing: meta.pharmacyWing || '',
    labAssigned: meta.labAssigned || '',
    gateOrFloor: meta.gateOrFloor || '',
    frontDesk: meta.frontDesk || '',
  };
  if (mode === 'create' && hospitalId) {
    base.hospitalId = hospitalId;
  }
  return base;
}

export default function StaffPersonnelModal({ open, onClose, mode, initial, onSaved }) {
  if (!open) return null;
  const formKey = mode === 'edit' && initial?._id ? String(initial._id) : 'create';

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Add staff member' : 'Edit staff member'}
      size="lg"
    >
      <PersonnelForm key={formKey} mode={mode} initial={initial} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

function PersonnelForm({ mode, initial, onClose, onSaved }) {
  const { getHospitalId } = useAuthStore();
  const [data, setData] = useState(() => {
    if (mode === 'edit' && initial) {
      return {
        role: initial.role,
        name: initial.name || '',
        email: initial.email || '',
        phone: initial.phone || '',
        isActive: initial.isActive !== false,
        meta: { ...emptyMeta(), ...(initial.meta || {}) },
      };
    }
    return {
      role: 'nurse',
      name: '',
      email: '',
      phone: '',
      isActive: true,
      meta: emptyMeta(),
    };
  });

  const setField = (name, value) => setData((d) => ({ ...d, [name]: value }));
  const setMeta = (name, value) =>
    setData((d) => ({ ...d, meta: { ...d.meta, [name]: value } }));
  const setShift = (key, value) =>
    setData((d) => ({
      ...d,
      meta: { ...d.meta, shift: { ...d.meta.shift, [key]: value } },
    }));

  const toggleDay = (day) => {
    const days = new Set(data.meta.shift?.days || []);
    if (days.has(day)) days.delete(day);
    else days.add(day);
    setShift('days', [...days]);
  };

  const handleSubmit = async () => {
    if (!data.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      const payload = buildPayload(mode, data, getHospitalId);
      if (mode === 'create') {
        await api.post('/staff', payload);
        toast.success('Staff member added');
      } else {
        await api.patch(`/staff/${initial._id}`, payload);
        toast.success('Staff member updated');
      }
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e.displayMessage || e.response?.data?.message || 'Save failed');
    }
  };

  const assignmentFields = () => {
    switch (data.role) {
      case 'nurse':
        return (
          <Field
            label="Ward assigned"
            value={data.meta.wardAssigned}
            onChange={(v) => setMeta('wardAssigned', v)}
          />
        );
      case 'driver':
        return (
          <DriverAmbulanceSelect
            hospitalId={getHospitalId()}
            value={data.meta.ambulanceId || ''}
            onChange={(id) => setMeta('ambulanceId', id)}
          />
        );
      case 'cleaner':
        return (
          <Field
            label="Zone assigned"
            value={data.meta.zoneAssigned}
            onChange={(v) => setMeta('zoneAssigned', v)}
          />
        );
      case 'pharmacist':
        return (
          <Field
            label="Pharmacy wing"
            value={data.meta.pharmacyWing}
            onChange={(v) => setMeta('pharmacyWing', v)}
          />
        );
      case 'lab_tech':
        return (
          <Field
            label="Lab assignment"
            value={data.meta.labAssigned}
            onChange={(v) => setMeta('labAssigned', v)}
          />
        );
      case 'security':
        return (
          <Field
            label="Gate / floor"
            value={data.meta.gateOrFloor}
            onChange={(v) => setMeta('gateOrFloor', v)}
          />
        );
      case 'reception':
        return (
          <Field
            label="Front desk / desk ID"
            value={data.meta.frontDesk}
            onChange={(v) => setMeta('frontDesk', v)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Role</label>
          <select
            className="input"
            value={data.role}
            onChange={(e) => setField('role', e.target.value)}
            disabled={mode === 'edit'}
          >
            {PERSONNEL_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.emoji} {r.label}
              </option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
            Add or edit doctors with <strong className="text-slate-400">Add doctor</strong> above.
          </p>
        </div>
        <Field label="Full name" value={data.name} onChange={(v) => setField('name', v)} />
        <Field label="Email" type="email" value={data.email} onChange={(v) => setField('email', v)} />
        <Field label="Phone" value={data.phone} onChange={(v) => setField('phone', v)} />
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ background: '#0F172A', border: '1px solid #1E293B' }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>
          Role placement
        </p>
        {assignmentFields()}
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ background: '#0F172A', border: '1px solid #1E293B' }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>
          Shift
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Start (e.g. 09:00)"
            value={data.meta.shift?.start || ''}
            onChange={(v) => setShift('start', v)}
          />
          <Field
            label="End (e.g. 17:00)"
            value={data.meta.shift?.end || ''}
            onChange={(v) => setShift('end', v)}
          />
        </div>
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: '#94A3B8' }}>
            Days
          </p>
          <div className="flex flex-wrap gap-2">
            {SHIFT_DAY_OPTIONS.map((d) => {
              const on = (data.meta.shift?.days || []).includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
                  style={{
                    background: on ? 'rgba(59,130,246,0.25)' : '#111827',
                    border: on ? '1px solid rgba(59,130,246,0.5)' : '1px solid #1F2937',
                    color: on ? '#E2E8F0' : '#6B7280',
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {mode === 'edit' && (
        <label className="flex items-center gap-2 text-sm" style={{ color: '#D1D5DB' }}>
          <input
            type="checkbox"
            checked={data.isActive}
            onChange={(e) => setField('isActive', e.target.checked)}
          />
          Active (on duty roster)
        </label>
      )}

      <div>
        <label className="label">Internal notes</label>
        <textarea
          className="input min-h-[72px]"
          value={data.meta.notes || ''}
          onChange={(e) => setMeta('notes', e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>
          <CheckCircle2 size={15} /> {mode === 'create' ? 'Add member' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function DriverAmbulanceSelect({ hospitalId, value, onChange }) {
  const [ambulances, setAmbulances] = useState([]);

  useEffect(() => {
    if (!hospitalId) return undefined;
    let cancelled = false;
    api
      .get('/ambulances', { params: { hospitalId } })
      .then((r) => {
        if (!cancelled) setAmbulances(r.data?.data?.ambulances || []);
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load ambulances');
      });
    return () => {
      cancelled = true;
    };
  }, [hospitalId]);

  return (
    <div>
      <label className="label">Linked ambulance</label>
      <select
        className="input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || '')}
      >
        <option value="">— Select vehicle —</option>
        {ambulances.map((a) => (
          <option key={a._id} value={a._id}>
            {a.vehicleNumber}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
