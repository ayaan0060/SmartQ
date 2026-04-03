import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Stethoscope, Users, Activity, CheckCircle2,
  Pencil, Trash2, Play, XCircle, SkipForward, Clock, ToggleLeft, ToggleRight, LayoutList
} from 'lucide-react';
import api from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import { connectSocket, getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Doctors', 'Patients', 'Queue'];

const priorityConfig = {
  emergency: { label: 'EMERGENCY', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  high:      { label: 'HIGH',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  normal:    { label: 'NORMAL',    color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
};

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ hospital, stats }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Doctors"    value={stats?.totalDoctors    ?? '—'} icon={Stethoscope} color="blue"   />
        <StatCard label="Total Patients"   value={stats?.totalPatients   ?? '—'} icon={Users}       color="purple" />
        <StatCard label="Active Queues"    value={stats?.activeQueues    ?? '—'} icon={Activity}    color="orange" />
        <StatCard label="Completed Today"  value={stats?.completedToday  ?? '—'} icon={CheckCircle2} color="green" />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-white text-sm mb-4">Hospital Info</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {[
            { label: 'Code',      value: hospital?.code },
            { label: 'Email',     value: hospital?.email },
            { label: 'Contact',   value: hospital?.contact },
            { label: 'Location',  value: hospital?.location },
            { label: 'Timings',   value: hospital?.timings },
            { label: 'Plan',      value: hospital?.plan },
            { label: 'Admin',     value: hospital?.adminId?.name },
            { label: 'Created',   value: hospital?.createdAt ? new Date(hospital.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid #1F2937' }}>
              <span className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>{label}</span>
              <span className="text-sm text-white capitalize">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Doctors Tab ───────────────────────────────────────────────────────────────
function DoctorsTab({ hospitalId }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/hospitals/${hospitalId}/doctors`)
      .then(r => setDoctors(r.data.data.doctors || []))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false));
  }, [hospitalId]);

  const toggleAvail = async (doc) => {
    try { await api.patch(`/doctors/${doc._id}/availability`); setDoctors(d => d.map(x => x._id === doc._id ? { ...x, isAvailable: !x.isAvailable } : x)); }
    catch { toast.error('Failed to update'); }
  };

  const columns = [
    { header: 'Doctor', accessor: 'name', render: r => (
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
          {r.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-white text-sm">{r.name}</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>{r.email}</p>
        </div>
      </div>
    )},
    { header: 'Specialization', accessor: 'specialization' },
    { header: 'Fee', accessor: 'consultationFee', render: r => `₹${r.consultationFee || 0}` },
    { header: 'Status', render: r => (
      <span className={`badge ${r.isAvailable ? 'badge-success' : 'badge-danger'}`}>
        {r.isAvailable ? 'Available' : 'Unavailable'}
      </span>
    )},
    { header: '', sortable: false, render: r => (
      <button className="btn btn-ghost py-1 px-2" onClick={() => toggleAvail(r)} title="Toggle availability">
        {r.isAvailable ? <ToggleRight size={16} style={{ color: '#10B981' }} /> : <ToggleLeft size={16} style={{ color: '#6B7280' }} />}
      </button>
    )},
  ];

  return <DataTable columns={columns} data={doctors} loading={loading} emptyMessage="No doctors in this hospital" />;
}

// ── Patients Tab ──────────────────────────────────────────────────────────────
function PatientsTab({ hospitalId }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/hospitals/${hospitalId}/patients`)
      .then(r => setPatients(r.data.data.patients || []))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false));
  }, [hospitalId]);

  const columns = [
    { header: 'Patient', accessor: 'name', render: r => (
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: '#7C3AED' }}>
          {r.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-white text-sm">{r.name}</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>{r.phone || r.email}</p>
        </div>
      </div>
    )},
    { header: 'Gender', accessor: 'gender', render: r => <span className="capitalize text-sm">{r.gender || '—'}</span> },
    { header: 'Blood Group', render: r => <span className="badge badge-danger">{r.bloodGroup || '—'}</span> },
    { header: 'Registered', accessor: 'createdAt', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
  ];

  return <DataTable columns={columns} data={patients} loading={loading} emptyMessage="No patients registered in this hospital" />;
}

// ── Queue Tab (Real-time) ─────────────────────────────────────────────────────
function QueueTab({ hospitalId }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      const r = await api.get(`/hospitals/${hospitalId}/queue`);
      setTokens(r.data.data.tokens || []);
    } catch { toast.error('Failed to load queue'); }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => {
    loadQueue();
    const socket = connectSocket(hospitalId);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    const update = (token) => {
      setTokens(prev => {
        const exists = prev.find(t => t._id === token._id);
        if (!exists) return [token, ...prev];
        if (['completed', 'cancelled', 'skipped'].includes(token.status)) return prev.filter(t => t._id !== token._id);
        return prev.map(t => t._id === token._id ? token : t);
      });
    };
    socket.on('queue:add', update);
    socket.on('queue:update', update);
    socket.on('queue:priority-change', update);
    socket.on('queue:remove', id => setTokens(prev => prev.filter(t => t._id !== id)));

    return () => {
      const s = getSocket();
      if (s) { s.off('queue:add', update); s.off('queue:update', update); s.off('queue:priority-change', update); s.off('queue:remove'); }
    };
  }, [hospitalId, loadQueue]);

  const updateStatus = async (id, status) => {
    try { await api.patch(`/queue/${id}`, { status }); }
    catch { toast.error('Failed to update status'); }
  };

  const waiting = tokens.filter(t => t.status === 'waiting').sort((a, b) => {
    const pOrder = { emergency: 0, high: 1, normal: 2 };
    return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
  });
  const current = tokens.find(t => t.status === 'in-progress');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${connected ? '' : ''}`}
          style={{ background: connected ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', border: `1px solid ${connected ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)'}` }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: connected ? '#10B981' : '#6B7280' }} />
          <span style={{ color: connected ? '#10B981' : '#6B7280' }}>{connected ? 'Live' : 'Connecting...'}</span>
        </div>
        <span className="text-xs" style={{ color: '#6B7280' }}>{waiting.length} waiting · {current ? '1 in progress' : 'idle'}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Now Serving */}
        <div className="lg:col-span-2 card p-5 flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6B7280' }}>Now Serving</h3>
          {current ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-3">
              <div className="text-7xl font-display font-black text-white leading-none">{current.tokenNumber}</div>
              <p className="mt-3 font-semibold text-white">{current.patientId?.name || 'Guest'}</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{current.doctorId?.name || 'General'}</p>
              <div className="grid grid-cols-2 gap-3 mt-5 w-full">
                <button className="btn btn-success py-2.5 text-sm" onClick={() => updateStatus(current._id, 'completed')}>
                  <CheckCircle2 size={15} /> Done
                </button>
                <button className="btn btn-secondary py-2.5 text-sm" onClick={() => updateStatus(current._id, 'skipped')}>
                  <SkipForward size={15} /> Skip
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4 gap-3">
              <LayoutList size={28} style={{ color: '#374151' }} />
              <p className="text-sm" style={{ color: '#6B7280' }}>
                {waiting.length > 0 ? `${waiting.length} patient${waiting.length > 1 ? 's' : ''} waiting` : 'Queue is empty'}
              </p>
              {waiting.length > 0 && (
                <button className="btn btn-primary w-full" onClick={() => updateStatus(waiting[0]._id, 'in-progress')}>
                  <Play size={14} fill="currentColor" /> Call Next
                </button>
              )}
            </div>
          )}
        </div>

        {/* Waiting List */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
              Waiting ({waiting.length})
            </h3>
          </div>
          <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: '400px' }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 animate-pulse" style={{ borderBottom: '1px solid #1a2234' }}>
                  <div className="h-4 rounded" style={{ background: '#1F2937', width: '70%' }} />
                </div>
              ))
            ) : waiting.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: '#6B7280' }}>Queue is empty</div>
            ) : (
              waiting.map((token, i) => {
                const pc = priorityConfig[token.priority] || priorityConfig.normal;
                return (
                  <div key={token._id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1a2234' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-5 text-center font-bold" style={{ color: '#6B7280' }}>{i + 1}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white text-sm">{token.tokenNumber}</p>
                          <span className="badge text-[10px] px-2 py-0.5" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>{pc.label}</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                          {token.patientId?.name || 'Guest'} {token.doctorId?.name ? `· Dr. ${token.doctorId.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs flex items-center gap-1" style={{ color: '#6B7280' }}>
                        <Clock size={10} />
                        <span>{token.estimatedTime || 15}m</span>
                      </div>
                      <button className="btn btn-primary py-1 px-3 text-xs" onClick={() => updateStatus(token._id, 'in-progress')}>Call</button>
                      <button className="btn btn-ghost py-1 px-2" onClick={() => updateStatus(token._id, 'cancelled')}>
                        <XCircle size={13} style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Hospital Detail Page ─────────────────────────────────────────────────
export default function HospitalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setLoading(true);
    api.get(`/hospitals/${id}`)
      .then(r => setData(r.data.data))
      .catch(() => { toast.error('Hospital not found'); navigate('/admin/hospitals'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/admin/hospitals')}
        className="flex items-center gap-2 text-sm hover:text-white transition-colors"
        style={{ color: '#6B7280' }}
      >
        <ArrowLeft size={15} />
        Back to Hospitals
      </button>

      {/* Hospital Header */}
      {loading ? (
        <div className="card p-5 animate-pulse h-20" style={{ background: '#111827' }} />
      ) : (
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">{data?.hospital?.name}</h1>
              <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
                {data?.hospital?.location} · {data?.hospital?.code}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className={`badge ${data?.hospital?.status === 'active' ? 'badge-success' : 'badge-danger'} capitalize`}>
                {data?.hospital?.status}
              </span>
              <span className="badge badge-gray capitalize">{data?.hospital?.plan}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: '#111827', border: '1px solid #1F2937', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab ? '#1F2937' : 'transparent',
              color: activeTab === tab ? '#F9FAFB' : '#6B7280',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {!loading && (
        <>
          {activeTab === 'Overview' && <OverviewTab hospital={data?.hospital} stats={data?.stats} />}
          {activeTab === 'Doctors'  && <DoctorsTab  hospitalId={id} />}
          {activeTab === 'Patients' && <PatientsTab hospitalId={id} />}
          {activeTab === 'Queue'    && <QueueTab    hospitalId={id} />}
        </>
      )}
    </div>
  );
}
