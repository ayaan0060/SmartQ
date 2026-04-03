import React, { useEffect, useState, useCallback } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../features/auth/useAuthStore';

// ── New feature components (Feature 1-4) ──────────────────────────────────────
import PatientStatsBar      from '../../components/patients/PatientStatsBar';
import PatientCalendar      from '../../components/patients/PatientCalendar';
import PatientTable         from '../../components/patients/PatientTable';
import VisitHistoryDrawer   from '../../components/patients/VisitHistoryDrawer';
import { usePatientsByDate } from '../../hooks/usePatientsByDate';

// Standalone Field component — outside render to avoid re-mount issues
const Field = ({ label, name, type = 'text', options, data, onChange }) => (
  <div>
    <label className="label">{label}</label>
    {options ? (
      <select value={data[name] || ''} onChange={e => onChange(name, e.target.value)} className="input">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={data[name] || ''} onChange={e => onChange(name, e.target.value)} className="input" />
    )}
  </div>
);

const EMPTY = { name: '', email: '', phone: '', gender: 'male', bloodGroup: 'Unknown', address: '' };

export default function PatientsPage() {
  const { getHospitalId } = useAuthStore();

  // ── Register modal state (UNCHANGED) ────────────────────────────────────────
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState({ open: false, mode: 'create', data: EMPTY });

  const load = useCallback(() => {
    setLoading(true);
    api.get('/patients')
      .then(r => setPatients(r.data.data.patients || []))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── New feature state ────────────────────────────────────────────────────────
  const [selectedDate,    setSelectedDate]    = useState(new Date());
  const [statusFilter,    setStatusFilter]    = useState(null);
  const [historyPatient,  setHistoryPatient]  = useState(null);

  const { rows, loading: tableLoading, error: tableError, refetch } =
    usePatientsByDate(selectedDate);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    setStatusFilter(null);
  }, []);

  const handleFilterStatus = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  const handleSave = async () => {
    try {
      const payload = { ...modal.data, hospitalId: getHospitalId() };
      if (modal.mode === 'create') {
        await api.post('/patients', payload);
        toast.success('Patient registered!');
      } else {
        await api.patch(`/patients/${modal.data._id}`, payload);
        toast.success('Patient updated!');
      }
      setModal(m => ({ ...m, open: false }));
      load();
      refetch(); // also refresh the date-filtered table
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving patient');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient record?')) return;
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient deleted');
      load();
      refetch();
    } catch { toast.error('Failed to delete'); }
  };

  const handleFieldChange = (name, value) => setModal(m => ({ ...m, data: { ...m.data, [name]: value } }));

  return (
    <div className="space-y-5">
      {/* ── Page header (UNCHANGED — Register Patient button untouched) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Patients</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{patients.length} patients registered</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* ── Calendar date picker (Feature 2) ── */}
          <PatientCalendar selectedDate={selectedDate} onChange={handleDateChange} />
          {/* ── Register Patient button — UNTOUCHED ── */}
          <button className="btn btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: { ...EMPTY } })}>
            <Plus size={16} /> Register Patient
          </button>
        </div>
      </div>

      {/* ── Stats bar (Feature 4) ── */}
      <PatientStatsBar onFilterStatus={handleFilterStatus} activeFilter={statusFilter} />

      {/* ── Enhanced patient table (Feature 1) ── */}
      <PatientTable
        rows={rows}
        loading={tableLoading}
        error={tableError}
        onRetry={refetch}
        onViewHistory={setHistoryPatient}
        statusFilter={statusFilter}
        selectedDate={selectedDate}
      />

      {/* ── Visit history drawer (Feature 3) ── */}
      <VisitHistoryDrawer
        patient={historyPatient}
        onClose={() => setHistoryPatient(null)}
      />

      {/* ── Register / Edit modal (UNCHANGED) ── */}
      <Modal isOpen={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.mode === 'create' ? 'Register Patient' : 'Edit Patient'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name"   name="name"       data={modal.data} onChange={handleFieldChange} />
            <Field label="Phone"       name="phone"      data={modal.data} onChange={handleFieldChange} />
            <Field label="Email"       name="email"      type="email" data={modal.data} onChange={handleFieldChange} />
            <Field label="Gender"      name="gender"     options={['male', 'female', 'other']} data={modal.data} onChange={handleFieldChange} />
            <Field label="Blood Group" name="bloodGroup" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']} data={modal.data} onChange={handleFieldChange} />
          </div>
          <Field label="Address" name="address" data={modal.data} onChange={handleFieldChange} />
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn btn-secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <CheckCircle2 size={15} /> {modal.mode === 'create' ? 'Register' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
