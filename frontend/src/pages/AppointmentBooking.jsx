import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Stethoscope, ArrowRight, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useHospitalStore } from '../features/hospital/useHospitalStore';
import PageLayout from '../layouts/PageLayout';

const STEPS = ['Select Doctor', 'Pick Date & Slot', 'Confirm'];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: i < current ? '#10B981' : i === current ? '#2563EB' : '#1E293B',
                color: '#fff',
              }}>
              {i < current ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span className="text-xs font-semibold hidden sm:block"
              style={{ color: i === current ? '#fff' : '#475569' }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-px max-w-[60px]"
              style={{ background: i < current ? '#10B981' : '#1E293B' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function AppointmentBooking() {
  const navigate = useNavigate();
  const { selectedHospital } = useHospitalStore();

  const [step, setStep]         = useState(0);
  const [doctors, setDoctors]   = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [booking, setBooking]   = useState(false);

  // Selections
  const [selectedDoctor,  setSelectedDoctor]  = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate,    setSelectedDate]    = useState('');
  const [selectedSlot,    setSelectedSlot]    = useState('');
  const [slots,           setSlots]           = useState([]);
  const [slotsLoading,    setSlotsLoading]    = useState(false);
  const [notes,           setNotes]           = useState('');

  const hospitalId = selectedHospital?._id;

  useEffect(() => {
    if (!hospitalId) { navigate('/select-hospital'); return; }
    Promise.all([
      api.get(`/doctors?hospitalId=${hospitalId}`),
      api.get(`/services/${hospitalId}`),
    ]).then(([dr, sv]) => {
      setDoctors(dr.data.data?.doctors || []);
      setServices(Array.isArray(sv.data.data) ? sv.data.data : []);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, [hospitalId, navigate]);

  // Load slots when doctor + date selected
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot('');
    api.get(`/appointments/slots?doctorId=${selectedDoctor._id}&date=${selectedDate}`)
      .then(r => setSlots(r.data.data?.slots || []))
      .catch(() => toast.error('Failed to load slots'))
      .finally(() => setSlotsLoading(false));
  }, [selectedDoctor, selectedDate]);

  const handleBook = async () => {
    if (!selectedDoctor || !selectedService || !selectedDate || !selectedSlot) {
      toast.error('Please complete all selections'); return;
    }
    setBooking(true);
    try {
      const r = await api.post('/appointments/book', {
        doctorId:   selectedDoctor._id,
        serviceId:  selectedService._id,
        hospitalId,
        date:       selectedDate,
        slot:       selectedSlot,
        notes,
      });
      toast.success('Appointment booked successfully!');
      navigate('/appointments');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  // Min date = today
  const minDate = new Date().toISOString().split('T')[0];
  // Max date = 30 days from now
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const cardStyle = (selected) => ({
    background: selected ? 'rgba(37,99,235,0.12)' : '#0D1117',
    border: `1px solid ${selected ? '#2563EB' : '#1E293B'}`,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  if (loading) return (
    <PageLayout>
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }} />
      </div>
    </PageLayout>
  );

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="rounded-xl p-2 transition-all"
            style={{ background: '#1E293B', color: '#94A3B8' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Book Appointment</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>{selectedHospital?.name}</p>
          </div>
        </div>

        <StepIndicator current={step} />

        {/* Step 0 — Select Doctor */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold" style={{ color: '#94A3B8' }}>Choose a Doctor</p>
            {doctors.filter(d => d.isAvailable).length === 0 && (
              <div className="text-center py-10" style={{ color: '#6B7280' }}>No available doctors right now</div>
            )}
            {doctors.map(doc => (
              <div key={doc._id} className="rounded-2xl p-4 flex items-center gap-4"
                style={cardStyle(selectedDoctor?._id === doc._id)}
                onClick={() => setSelectedDoctor(doc)}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}>
                  {doc.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{doc.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{doc.specialization}</p>
                  <p className="text-xs mt-0.5 font-semibold" style={{ color: '#10B981' }}>
                    ₹{doc.consultationFee || 500} consultation fee
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: doc.isAvailable ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: doc.isAvailable ? '#10B981' : '#6B7280' }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: doc.isAvailable ? '#10B981' : '#6B7280' }} />
                  {doc.isAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>
            ))}

            <p className="text-sm font-semibold mt-6" style={{ color: '#94A3B8' }}>Select Service</p>
            <div className="grid grid-cols-2 gap-3">
              {services.map(svc => (
                <div key={svc._id} className="rounded-xl p-3 flex items-center gap-3"
                  style={cardStyle(selectedService?._id === svc._id)}
                  onClick={() => setSelectedService(svc)}>
                  <Stethoscope size={16} style={{ color: selectedService?._id === svc._id ? '#60A5FA' : '#475569' }} />
                  <div>
                    <p className="text-sm font-semibold text-white">{svc.name}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{svc.avgTime}min avg</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => { if (!selectedDoctor) { toast.error('Select a doctor'); return; } if (!selectedService) { toast.error('Select a service'); return; } setStep(1); }}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white mt-4"
              style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)' }}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 1 — Pick Date & Slot */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="rounded-2xl p-4" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>Select Date</p>
              <input type="date" min={minDate} max={maxDate} value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                style={{ background: '#0F172A', border: '1px solid #1E293B' }} />
            </div>

            {selectedDate && (
              <div className="rounded-2xl p-4" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>
                  Available Slots — {selectedDoctor?.name}
                </p>
                {slotsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }} />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: '#6B7280' }}>No slots available on this day</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(({ time, available }) => (
                      <button key={time} disabled={!available}
                        onClick={() => setSelectedSlot(time)}
                        className="rounded-xl py-2 text-xs font-semibold transition-all"
                        style={{
                          background: !available ? '#0F172A' : selectedSlot === time ? '#2563EB' : '#1E293B',
                          color: !available ? '#374151' : selectedSlot === time ? '#fff' : '#94A3B8',
                          cursor: !available ? 'not-allowed' : 'pointer',
                          textDecoration: !available ? 'line-through' : 'none',
                        }}>
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl p-4" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6B7280' }}>Notes (optional)</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Describe your symptoms or reason for visit..."
                rows={3}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none resize-none placeholder-slate-600"
                style={{ background: '#0F172A', border: '1px solid #1E293B' }} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold"
                style={{ background: '#1E293B', color: '#94A3B8' }}>
                Back
              </button>
              <button onClick={() => { if (!selectedDate) { toast.error('Select a date'); return; } if (!selectedSlot) { toast.error('Select a time slot'); return; } setStep(2); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)' }}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Confirm */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5 space-y-4" style={{ background: '#0D1117', border: '1px solid #1E293B' }}>
              <p className="text-sm font-bold text-white">Appointment Summary</p>
              {[
                { icon: User,        label: 'Doctor',   value: selectedDoctor?.name },
                { icon: Stethoscope, label: 'Service',  value: selectedService?.name },
                { icon: Calendar,    label: 'Date',     value: new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { icon: Clock,       label: 'Time',     value: selectedSlot },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid #1E293B' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(37,99,235,0.12)' }}>
                    <Icon size={14} style={{ color: '#60A5FA' }} />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                </div>
              ))}
              {notes && (
                <p className="text-xs rounded-xl px-3 py-2" style={{ background: '#1E293B', color: '#94A3B8' }}>
                  📝 {notes}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold"
                style={{ background: '#1E293B', color: '#94A3B8' }}>
                Back
              </button>
              <button onClick={handleBook} disabled={booking}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
                style={{ background: booking ? '#1E3A8A' : 'linear-gradient(135deg,#1D4ED8,#2563EB)', opacity: booking ? 0.8 : 1 }}>
                {booking ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Booking...</> : <>Confirm Booking <CheckCircle2 size={16} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
