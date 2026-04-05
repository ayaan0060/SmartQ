import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, ArrowRight, ArrowLeft, Calendar, Clock,
  Building2, Stethoscope, User, MapPin, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import PageLayout from '../layouts/PageLayout';

const STEPS = ['Hospital', 'Department', 'Doctor', 'Date & Time', 'Confirm'];

/* ─── Step indicator ─── */
function StepIndicator({ current }) {
  return (
    <div className="max-w-5xl mx-auto mb-12">
      <div className="flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container-high -translate-y-1/2 -z-10" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 -z-10 transition-all duration-500"
          style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md transition-all ${
                i < current
                  ? 'bg-primary text-on-primary'
                  : i === current
                  ? 'w-12 h-12 bg-surface-container-lowest border-4 border-primary text-primary -mt-1 scale-110 shadow-xl'
                  : 'bg-surface-container-lowest border-2 border-surface-container-high text-zinc-300'
              }`}
            >
              {i < current ? <CheckCircle2 size={18} /> : i + 1}
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                i === current ? 'text-primary' : 'text-zinc-400'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Animation variants ─── */
const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function AppointmentBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState(false);

  // Selections
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  // ─── API Queries ───
  const { data: hospitals = [], isLoading: loadingHospitals } = useQuery({
    queryKey: ['hospitals-booking'],
    queryFn: async () => {
      const res = await api.get('/hospitals');
      return res.data.data?.hospitals || res.data.data || [];
    },
    enabled: step === 0,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services-booking', selectedHospital?._id],
    queryFn: async () => {
      const res = await api.get(`/services/${selectedHospital._id}`);
      return Array.isArray(res.data.data) ? res.data.data : [];
    },
    enabled: step === 1 && !!selectedHospital?._id,
  });

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors-booking', selectedHospital?._id],
    queryFn: async () => {
      const res = await api.get(`/doctors?hospitalId=${selectedHospital._id}`);
      return res.data.data?.doctors || res.data.data || [];
    },
    enabled: step === 2 && !!selectedHospital?._id,
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots-booking', selectedDoctor?._id, selectedDate],
    queryFn: async () => {
      const res = await api.get(`/appointments/slots?doctorId=${selectedDoctor._id}&date=${selectedDate}`);
      return res.data.data;
    },
    enabled: step === 3 && !!selectedDoctor?._id && !!selectedDate,
  });

  const slots = slotsData?.slots || [];

  // ─── Submit ───
  const handleBook = async () => {
    if (!selectedHospital || !selectedService || !selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please complete all selections');
      return;
    }
    setBooking(true);
    try {
      await api.post('/appointments/book', {
        hospitalId: selectedHospital._id,
        serviceId: selectedService._id,
        doctorId: selectedDoctor._id,
        date: selectedDate,
        slot: selectedSlot,
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

  // ─── Loading spinner ───
  const Spinner = () => (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <PageLayout>
      <StepIndicator current={step} />

      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        {step > 0 && (
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-bold text-secondary hover:text-on-surface transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* ═══ STEP 0: Select Hospital ═══ */}
          {step === 0 && (
            <motion.div
              key="step-hospital"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">Select Hospital</h1>
              <p className="text-secondary mb-8">Choose the hospital for your appointment.</p>

              {loadingHospitals ? (
                <Spinner />
              ) : hospitals.length === 0 ? (
                <p className="text-secondary text-center py-12">No hospitals available.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hospitals.filter(h => h.status === 'active').map((hospital) => (
                    <motion.div
                      key={hospital._id}
                      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                      onClick={() => {
                        setSelectedHospital(hospital);
                        setSelectedService(null);
                        setSelectedDoctor(null);
                        setSelectedDate('');
                        setSelectedSlot('');
                        goNext();
                      }}
                      className={`cursor-pointer bg-surface-container-lowest rounded-2xl p-6 border-2 transition-all ${
                        selectedHospital?._id === hospital._id
                          ? 'border-primary shadow-lg shadow-primary/10'
                          : 'border-transparent hover:border-zinc-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
                          <Building2 size={22} className="text-on-primary-container" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-on-surface">{hospital.name}</h3>
                          <div className="flex items-center gap-1 mt-1 text-sm text-secondary">
                            <MapPin size={12} />
                            <span>{hospital.location}</span>
                          </div>
                          {hospital.rating > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Star size={14} className="text-amber-500 fill-amber-500" />
                              <span className="text-sm font-bold text-on-surface">{hospital.rating}</span>
                            </div>
                          )}
                        </div>
                        <ArrowRight size={18} className="text-zinc-300 mt-1" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ STEP 1: Select Department/Service ═══ */}
          {step === 1 && (
            <motion.div
              key="step-department"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">Select Department</h1>
              <p className="text-secondary mb-8">Choose the department at {selectedHospital?.name}.</p>

              {loadingServices ? (
                <Spinner />
              ) : services.length === 0 ? (
                <p className="text-secondary text-center py-12">No departments available at this hospital.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.filter(s => s.isActive).map((service) => (
                    <motion.div
                      key={service._id}
                      whileHover={{ y: -2 }}
                      onClick={() => {
                        setSelectedService(service);
                        setSelectedDoctor(null);
                        setSelectedDate('');
                        setSelectedSlot('');
                        goNext();
                      }}
                      className={`cursor-pointer bg-surface-container-lowest rounded-2xl p-6 border-2 transition-all ${
                        selectedService?._id === service._id
                          ? 'border-primary shadow-lg'
                          : 'border-transparent hover:border-zinc-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Stethoscope size={20} className="text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-on-surface">{service.name}</h3>
                      <p className="text-sm text-secondary mt-1">Avg. {service.avgTime} mins • ₹{service.price || 'Free'}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ STEP 2: Select Doctor ═══ */}
          {step === 2 && (
            <motion.div
              key="step-doctor"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">Select Doctor</h1>
              <p className="text-secondary mb-8">Choose your preferred doctor.</p>

              {loadingDoctors ? (
                <Spinner />
              ) : doctors.length === 0 ? (
                <p className="text-secondary text-center py-12">No doctors available.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => (
                    <motion.div
                      key={doctor._id}
                      whileHover={{ y: -2 }}
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setSelectedDate('');
                        setSelectedSlot('');
                        goNext();
                      }}
                      className={`cursor-pointer bg-surface-container-lowest rounded-2xl p-6 border-2 transition-all ${
                        selectedDoctor?._id === doctor._id
                          ? 'border-primary shadow-lg'
                          : 'border-transparent hover:border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-xl font-black text-on-primary">
                          {doctor.name?.charAt(0) || 'D'}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-on-surface">{doctor.name}</h3>
                          <p className="text-sm text-secondary">{doctor.specialization}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doctor.isAvailable
                                ? 'bg-green-50 text-green-700'
                                : 'bg-zinc-100 text-zinc-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${doctor.isAvailable ? 'bg-green-500' : 'bg-zinc-400'}`} />
                              {doctor.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                            {doctor.consultationFee > 0 && (
                              <span className="text-xs text-secondary font-medium">₹{doctor.consultationFee}</span>
                            )}
                          </div>
                        </div>
                        <ArrowRight size={18} className="text-zinc-300" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ STEP 3: Select Date & Time ═══ */}
          {step === 3 && (
            <motion.div
              key="step-datetime"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">Select Date & Time</h1>
              <p className="text-secondary mb-8">
                Pick a date and available time slot with {selectedDoctor?.name}.
              </p>

              <div className="space-y-8">
                {/* Date picker */}
                <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-primary" />
                    <h3 className="text-lg font-bold text-on-surface">Select Date</h3>
                  </div>
                  <input
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot('');
                    }}
                    className="w-full md:w-auto px-6 py-4 bg-surface-container-highest rounded-2xl text-on-surface font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <Clock size={18} className="text-primary" />
                      <h3 className="text-lg font-bold text-on-surface">Available Time Slots</h3>
                    </div>

                    {loadingSlots ? (
                      <Spinner />
                    ) : slots.length === 0 ? (
                      <p className="text-secondary text-center py-8">No slots available on this date. The doctor may not be working this day.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {slots.map(({ time, available }) => (
                          <motion.button
                            key={time}
                            whileHover={available ? { scale: 1.02 } : {}}
                            whileTap={available ? { scale: 0.97 } : {}}
                            disabled={!available}
                            onClick={() => available && setSelectedSlot(time)}
                            className={`py-4 rounded-2xl text-sm font-bold transition-all ${
                              !available
                                ? 'border border-surface-container opacity-40 cursor-not-allowed text-zinc-400'
                                : selectedSlot === time
                                ? 'bg-primary text-on-primary shadow-lg shadow-red-900/10'
                                : 'border border-surface-container hover:border-primary hover:bg-red-50 text-on-surface'
                            }`}
                          >
                            {time}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {selectedSlot && (
                      <div className="mt-6 flex justify-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={goNext}
                          className="px-8 py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm flex items-center gap-2"
                        >
                          Continue <ArrowRight size={16} />
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 4: Confirm & Submit ═══ */}
          {step === 4 && (
            <motion.div
              key="step-confirm"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">Confirm Booking</h1>
              <p className="text-secondary mb-8">Review your appointment details before confirming.</p>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Summary */}
                <div className="lg:col-span-8 space-y-4">
                  {[
                    { icon: Building2, label: 'Hospital', value: selectedHospital?.name, sub: selectedHospital?.location },
                    { icon: Stethoscope, label: 'Department', value: selectedService?.name, sub: `Avg. ${selectedService?.avgTime} mins` },
                    { icon: User, label: 'Doctor', value: selectedDoctor?.name, sub: selectedDoctor?.specialization },
                    { icon: Calendar, label: 'Date', value: selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '', sub: '' },
                    { icon: Clock, label: 'Time Slot', value: selectedSlot, sub: '' },
                  ].map(({ icon: Icon, label, value, sub }) => (
                    <div key={label} className="bg-surface-container-lowest rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</p>
                        <p className="text-on-surface font-bold">{value}</p>
                        {sub && <p className="text-xs text-secondary">{sub}</p>}
                      </div>
                    </div>
                  ))}

                  {/* Notes */}
                  <div className="bg-surface-container-lowest rounded-2xl p-5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any symptoms or notes for the doctor..."
                      rows={3}
                      className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Confirm card */}
                <div className="lg:col-span-4">
                  <div className="bg-primary text-on-primary rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container opacity-50" />
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-80">
                        Appointment Summary
                      </h3>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center py-3 border-b border-on-primary/10">
                          <span className="text-xs font-bold opacity-70">DATE</span>
                          <span className="text-sm font-black">
                            {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-on-primary/10">
                          <span className="text-xs font-bold opacity-70">TIME</span>
                          <span className="text-sm font-black">{selectedSlot || '--'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-on-primary/10">
                          <span className="text-xs font-bold opacity-70">DOCTOR</span>
                          <span className="text-sm font-black">{selectedDoctor?.name || '--'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-on-primary/10">
                          <span className="text-xs font-bold opacity-70">FEE</span>
                          <span className="text-sm font-black">
                            {selectedDoctor?.consultationFee > 0 ? `₹${selectedDoctor.consultationFee}` : 'Free'}
                          </span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleBook}
                        disabled={booking}
                        className="w-full py-4 bg-on-primary text-primary rounded-2xl font-black text-sm hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                      >
                        {booking ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                        ) : (
                          'CONFIRM BOOKING'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}
