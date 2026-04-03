import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../features/auth/useAuthStore';

export default function StaffDoctorModal({ open, onClose, mode, row, onSaved }) {
  if (!open) return null;
  const formKey = mode === 'create' ? 'create' : String(row?._id);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Add doctor' : 'Edit doctor'}
      size="md"
    >
      {mode === 'create' && (
        <DoctorForm key={formKey} mode="create" onClose={onClose} onSaved={onSaved} />
      )}
      {mode === 'edit' && row && (
        <DoctorForm key={formKey} mode="edit" row={row} onClose={onClose} onSaved={onSaved} />
      )}
    </Modal>
  );
}

function DoctorForm({ mode, row, onClose, onSaved }) {
  const { getHospitalId } = useAuthStore();
  const m = row?.meta || {};
  const [data, setData] = useState(() =>
    mode === 'create'
      ? {
          name: '',
          email: '',
          phone: '',
          specialization: '',
          consultationFee: '',
          isAvailable: true,
        }
      : {
          name: row.name || '',
          email: row.email || '',
          phone: row.phone || '',
          specialization: m.specialization || '',
          consultationFee: m.consultationFee ?? '',
          isAvailable: row.isActive !== false,
        },
  );

  const setField = (name, value) => setData((d) => ({ ...d, [name]: value }));

  const handleSave = async () => {
    if (!data.name?.trim() || !data.specialization?.trim()) {
      toast.error('Name and specialization are required');
      return;
    }
    try {
      if (mode === 'create') {
        const payload = {
          ...data,
          hospitalId: getHospitalId(),
          consultationFee: Number(data.consultationFee) || 0,
        };
        await api.post('/doctors', payload);
        toast.success('Doctor added');
      } else {
        await api.patch(`/doctors/${row._id}`, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          specialization: data.specialization,
          consultationFee: Number(data.consultationFee) || 0,
          isAvailable: data.isAvailable,
        });
        toast.success('Doctor updated');
      }
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e.displayMessage || e.response?.data?.message || 'Save failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full name" value={data.name} onChange={(v) => setField('name', v)} />
        <Field label="Specialization" value={data.specialization} onChange={(v) => setField('specialization', v)} />
        <Field label="Email" type="email" value={data.email} onChange={(v) => setField('email', v)} />
        <Field label="Phone" value={data.phone} onChange={(v) => setField('phone', v)} />
        <Field
          label="Consultation fee (₹)"
          type="number"
          value={data.consultationFee}
          onChange={(v) => setField('consultationFee', v)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm" style={{ color: '#D1D5DB' }}>
        <input
          type="checkbox"
          checked={data.isAvailable}
          onChange={(e) => setField('isAvailable', e.target.checked)}
        />
        Available for appointments
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          <CheckCircle2 size={15} /> {mode === 'create' ? 'Add doctor' : 'Save'}
        </button>
      </div>
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
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
