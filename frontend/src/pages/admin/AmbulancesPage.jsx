import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  Plus, Pencil, Trash2, CheckCircle2,
  Phone, MapPin, Loader2, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import socket from '../../lib/socket';
import { useAuthStore } from '../../features/auth/useAuthStore';
import Modal from '../../components/ui/Modal';
import { ambulanceIcon, availableIcon, offlineIcon, patientIcon } from '../../components/leafletIcons';
import IncomingRequests from '../../components/ambulances/IncomingRequests';

const EMPTY_AMB = { vehicleNumber: '', driverName: '', driverPhone: '', status: 'available' };

const STATUS_COLORS = {
  available:  { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)' },
  dispatched: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)' },
  returning:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
  offline:    { color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.offline;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
      {status}
    </span>
  );
}

function Field({ label, name, type = 'text', placeholder, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(name, e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200 appearance-none"
          style={{ background: '#0F172A', border: '1px solid #1E293B' }}
          onFocus={e => { e.target.style.border = '1px solid #2563EB'; }}
          onBlur={e => { e.target.style.border = '1px solid #1E293B'; }}>
          {options.map(o => <option key={o.value} value={o.value} style={{ background: '#0D1117' }}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} placeholder={placeholder} value={value || ''} onChange={e => onChange(name, e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
          style={{ background: '#0F172A', border: '1px solid #1E293B' }}
          onFocus={e => { e.target.style.border = '1px solid #2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
          onBlur={e => { e.target.style.border = '1px solid #1E293B'; e.target.style.boxShadow = 'none'; }} />
      )}
    </div>
  );
}

export default function AmbulancesPage() {
  const { getHospitalId, user } = useAuthStore();
  const hospitalId = getHospitalId();

  const [ambulances,  setAmbulances]  = useState([]);
  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState({ open: false, mode: 'create', data: { ...EMPTY_AMB } });
  const [dispatchModal, setDispatchModal] = useState({ open: false, requestId: null });
  const [selectedAmb, setSelectedAmb] = useState('');

  const load = useCallback(async () => {
    if (!hospitalId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [ambRes, reqRes] = await Promise.all([
        api.get(`/ambulances?hospitalId=${hospitalId}`),
        api.get(`/emergency/requests?hospitalId=${hospitalId}`),
      ]);
      setAmbulances(ambRes.data.data.ambulances || []);
      setRequests(reqRes.data.data.requests || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  // Listen for new emergency requests
  useEffect(() => {
    if (!hospitalId) return;
    if (!socket.connected) socket.connect();
    socket.emit('join:hospital', hospitalId);
    socket.on('emergency:new', () => { load(); toast.error('🚨 New emergency request!'); });
    return () => socket.off('emergency:new');
  }, [hospitalId, load]);

  const handleSave = async () => {
    const { vehicleNumber } = modal.data;
    if (!vehicleNumber?.trim()) { toast.error('Vehicle number is required'); return; }
    try {
      if (modal.mode === 'create') {
        await api.post('/ambulances', { ...modal.data, hospitalId });
        toast.success('Ambulance added!');
      } else {
        await api.put(`/ambulances/${modal.data._id}`, modal.data);
        toast.success('Ambulance updated!');
      }
      setModal(m => ({ ...m, open: false }));
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Error saving'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ambulance?')) return;
    try { await api.delete(`/ambulances/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleDispatch = async () => {
    if (!selectedAmb) { toast.error('Select an ambulance'); return; }
    try {
      await api.patch(`/emergency/requests/${dispatchModal.requestId}/dispatch`, { ambulanceId: selectedAmb });
      toast.success('Ambulance dispatched!');
      setDispatchModal({ open: false, requestId: null });
      setSelectedAmb('');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Dispatch failed'); }
  };

  const handleStatusUpdate = async (reqId, status) => {
    try {
      await api.patch(`/emergency/requests/${reqId}/status`, { status });
      toast.success(`Marked as ${status.replace('_', ' ')}`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to update status'); }
  };

  const onField = (name, value) => setModal(m => ({ ...m, data: { ...m.data, [name]: value } }));

  const counts = {
    total:      ambulances.length,
    available:  ambulances.filter(a => a.status === 'available').length,
    dispatched: ambulances.filter(a => a.status === 'dispatched').length,
    offline:    ambulances.filter(a => a.status === 'offline').length,
  };

  const activeRequests = requests.filter(r => !['completed', 'cancelled'].includes(r.status));
  const mapCenter = [20.5937, 78.9629];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ambulances</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Manage fleet and respond to emergencies</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors" style={{ color: '#64748B', background: '#1E293B' }}
            onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setModal({ open: true, mode: 'create', data: { ...EMPTY_AMB } })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}>
            <Plus size={16} /> Add Ambulance
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total',      value: counts.total,      color: '#94A3B8' },
          { label: 'Available',  value: counts.available,  color: '#10B981' },
          { label: 'Dispatched', value: counts.dispatched, color: '#3B82F6' },
          { label: 'Offline',    value: counts.offline,    color: '#64748B' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: '#475569' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Incoming requests panel — replaced inline list with IncomingRequests component */}
      <IncomingRequests
        requests={activeRequests}
        onDispatch={(reqId) => { setDispatchModal({ open: true, requestId: reqId }); setSelectedAmb(''); }}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Live map */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E293B', height: '320px', position: 'relative', zIndex: 0 }}>
        <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          />
          {ambulances.filter(a => a.currentLocation?.lat).map(a => (
            <Marker
              key={a._id}
              position={[a.currentLocation.lat, a.currentLocation.lng]}
              icon={a.status === 'available' ? availableIcon : a.status === 'offline' ? offlineIcon : ambulanceIcon}
            >
              <Popup>
                <strong>{a.vehicleNumber}</strong><br />
                {a.driverName}<br />
                <StatusBadge status={a.status} />
              </Popup>
            </Marker>
          ))}
          {activeRequests.filter(r => r.patientLocation?.lat).map(r => (
            <Marker key={r._id} position={[r.patientLocation.lat, r.patientLocation.lng]} icon={patientIcon}>
              <Popup>🚨 {r.patientId?.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Ambulance table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1E293B' }}>
          <p className="text-sm font-semibold text-white">Fleet ({ambulances.length})</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin" style={{ color: '#475569' }} />
          </div>
        ) : ambulances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">🚑</p>
            <p className="text-sm font-semibold text-white mb-1">No ambulances yet</p>
            <p className="text-xs mb-5" style={{ color: '#475569' }}>Add your first ambulance to get started.</p>
            <button onClick={() => setModal({ open: true, mode: 'create', data: { ...EMPTY_AMB } })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)' }}>
              <Plus size={15} /> Add Ambulance
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1E293B', background: '#0F172A' }}>
                  {['Vehicle #', 'Driver', 'Phone', 'Status', 'Last Location', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ambulances.map(a => (
                  <tr key={a._id} style={{ borderBottom: '1px solid #0F172A' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#0F172A'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-5 py-3 font-mono font-semibold text-white">{a.vehicleNumber}</td>
                    <td className="px-5 py-3" style={{ color: '#94A3B8' }}>{a.driverName || '—'}</td>
                    <td className="px-5 py-3">
                      {a.driverPhone
                        ? <a href={`tel:${a.driverPhone}`} className="flex items-center gap-1 text-xs" style={{ color: '#3B82F6' }}><Phone size={12} />{a.driverPhone}</a>
                        : <span style={{ color: '#475569' }}>—</span>}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#475569' }}>
                      {a.currentLocation?.lat
                        ? `${a.currentLocation.lat.toFixed(4)}, ${a.currentLocation.lng.toFixed(4)}`
                        : 'No GPS data'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal({ open: true, mode: 'edit', data: { ...a } })}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
                          style={{ background: '#1E293B', color: '#64748B' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.12)'; e.currentTarget.style.color = '#3B82F6'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#64748B'; }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(a._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
                          style={{ background: '#1E293B', color: '#64748B' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#64748B'; }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.mode === 'create' ? 'Add Ambulance' : 'Edit Ambulance'}>
        <div className="space-y-4">
          <Field label="Vehicle Number" name="vehicleNumber" placeholder="AMB-001" value={modal.data.vehicleNumber} onChange={onField} />
          <Field label="Driver Name"    name="driverName"    placeholder="John Smith" value={modal.data.driverName} onChange={onField} />
          <Field label="Driver Phone"   name="driverPhone"   placeholder="+91-9999999999" value={modal.data.driverPhone} onChange={onField} />
          <Field label="Status" name="status" value={modal.data.status} onChange={onField}
            options={[
              { value: 'available',  label: 'Available' },
              { value: 'dispatched', label: 'Dispatched' },
              { value: 'returning',  label: 'Returning' },
              { value: 'offline',    label: 'Offline' },
            ]} />
          <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid #1E293B' }}>
            <button onClick={() => setModal(m => ({ ...m, open: false }))}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}>
              Cancel
            </button>
            <button onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)' }}>
              <CheckCircle2 size={15} /> {modal.mode === 'create' ? 'Save Ambulance' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Dispatch Modal */}
      <Modal isOpen={dispatchModal.open} onClose={() => setDispatchModal({ open: false, requestId: null })} title="Dispatch Ambulance">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: '#94A3B8' }}>Select an available ambulance to dispatch to this emergency.</p>
          <div className="space-y-2">
            {ambulances.filter(a => a.status === 'available').length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: '#EF4444' }}>No available ambulances right now.</p>
            ) : (
              ambulances.filter(a => a.status === 'available').map(a => (
                <label key={a._id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                  style={{
                    background: selectedAmb === a._id ? 'rgba(37,99,235,0.12)' : '#0F172A',
                    border: selectedAmb === a._id ? '1px solid rgba(37,99,235,0.3)' : '1px solid #1E293B',
                  }}>
                  <input type="radio" name="ambulance" value={a._id} checked={selectedAmb === a._id}
                    onChange={() => setSelectedAmb(a._id)} className="accent-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">{a.vehicleNumber}</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>{a.driverName} · {a.driverPhone}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid #1E293B' }}>
            <button onClick={() => setDispatchModal({ open: false, requestId: null })}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}>
              Cancel
            </button>
            <button onClick={handleDispatch} disabled={!selectedAmb}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: '#DC2626', opacity: selectedAmb ? 1 : 0.5, cursor: selectedAmb ? 'pointer' : 'not-allowed' }}>
              🚑 Dispatch Now
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
