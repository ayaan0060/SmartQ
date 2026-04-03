import React, { useEffect, useState } from 'react';
import { X, Building2, MapPin, Clock, Star, Phone, Users, Stethoscope, Ticket, CheckCircle2, Activity, Layers } from 'lucide-react';
import api from '../lib/api';

const StatBox = ({ icon: Icon, label, value, color = '#3B82F6' }) => (
  <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
      <Icon size={18} style={{ color }} />
    </div>
    <div>
      <p className="text-xl font-black text-white leading-none">{value ?? '—'}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  </div>
);

const HospitalStatsModal = ({ hospital, onClose }) => {
  const [stats, setStats]     = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospital?._id) return;
    Promise.all([
      api.get(`/hospitals/${hospital._id}/stats`).catch(() => ({ data: { data: {} } })),
      api.get(`/hospitals/${hospital._id}/doctors`).catch(() => ({ data: { data: { doctors: [] } } })),
      api.get(`/services/${hospital._id}`).catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, doctorsRes, servicesRes]) => {
      setStats(statsRes.data?.data || {});
      setDoctors(doctorsRes.data?.data?.doctors || []);
      setServices(Array.isArray(servicesRes.data?.data) ? servicesRes.data.data : []);
    }).finally(() => setLoading(false));
  }, [hospital?._id]);

  // Group doctors by specialization
  const deptMap = doctors.reduce((acc, d) => {
    const key = d.specialization || 'General';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col" style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)' }}>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Building2 size={22} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{hospital?.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                {hospital?.location && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin size={11} /> {hospital.location}
                  </span>
                )}
                {hospital?.rating && (
                  <span className="flex items-center gap-1 text-[11px] text-yellow-400">
                    <Star size={11} fill="currentColor" /> {hospital.rating}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {/* Hospital Info */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hospital Info</p>
                <div className="grid grid-cols-2 gap-3">
                  {hospital?.timings && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Clock size={13} className="text-emerald-400" />
                      <span className="text-xs text-slate-300 font-medium">{hospital.timings}</span>
                    </div>
                  )}
                  {hospital?.contact && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Phone size={13} className="text-blue-400" />
                      <span className="text-xs text-slate-300 font-medium">{hospital.contact}</span>
                    </div>
                  )}
                  {hospital?.address && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl col-span-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <MapPin size={13} className="text-purple-400" />
                      <span className="text-xs text-slate-300 font-medium">{hospital.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Today's Stats</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatBox icon={Stethoscope} label="Doctors"        value={stats?.totalDoctors ?? doctors.length} color="#3B82F6" />
                  <StatBox icon={Users}       label="Patients"       value={stats?.totalPatients}                  color="#8B5CF6" />
                  <StatBox icon={Layers}      label="Services"       value={services.length}                       color="#10B981" />
                  <StatBox icon={Ticket}      label="Today's Tokens" value={stats?.todayTokens}                    color="#F59E0B" />
                  <StatBox icon={Activity}    label="Waiting"        value={stats?.waitingTokens}                  color="#EF4444" />
                  <StatBox icon={CheckCircle2}label="Completed"      value={stats?.completedToday}                 color="#22C55E" />
                </div>
              </div>

              {/* Departments */}
              {Object.keys(deptMap).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Departments & Doctors</p>
                  <div className="space-y-2">
                    {Object.entries(deptMap).map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-2">
                          <Stethoscope size={13} className="text-blue-400" />
                          <span className="text-sm font-semibold text-white">{dept}</span>
                        </div>
                        <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg">{count} doctor{count > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {services.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Services</p>
                  <div className="flex flex-wrap gap-2">
                    {services.map(s => (
                      <span key={s._id} className="px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: s.isActive !== false ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', color: s.isActive !== false ? '#10B981' : '#64748B', border: `1px solid ${s.isActive !== false ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                        {s.name} {s.price > 0 ? `· ₹${s.price}` : '· Free'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalStatsModal;
