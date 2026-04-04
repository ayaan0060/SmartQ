const Appointment = require('../models/Appointment');
const Doctor      = require('../models/Doctor');
const Token       = require('../models/Token');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const SLOT_DURATION = 15; // minutes per slot

// Generate time slots between start and end
const generateSlots = (start, end) => {
  const slots = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur + SLOT_DURATION <= endMin) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0');
    const m = String(cur % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    cur += SLOT_DURATION;
  }
  return slots;
};

// GET /api/appointments/slots?doctorId=&date=YYYY-MM-DD
const getSlots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) return error(res, 'doctorId and date are required', 400);

  const doctor = await Doctor.findById(doctorId).lean();
  if (!doctor) return error(res, 'Doctor not found', 404);

  const dayName = DAYS[new Date(date).getDay()];
  const schedule = doctor.schedule?.[dayName];

  if (!schedule?.available || !schedule?.start || !schedule?.end) {
    return success(res, { slots: [], message: 'Doctor is not available on this day' });
  }

  const allSlots = generateSlots(schedule.start, schedule.end);

  // Get already booked slots for this doctor on this date
  const booked = await Appointment.find({
    doctorId,
    date,
    status: { $in: ['booked', 'confirmed'] },
  }).select('slot').lean();

  const bookedSlots = new Set(booked.map(a => a.slot));
  const slots = allSlots.map(slot => ({
    time: slot,
    available: !bookedSlots.has(slot),
  }));

  return success(res, { slots, doctorName: doctor.name, date });
});

// POST /api/appointments/book
const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, serviceId, hospitalId, date, slot, notes } = req.body;
  const userId = req.user._id;

  if (!doctorId || !serviceId || !hospitalId || !date || !slot) {
    return error(res, 'doctorId, serviceId, hospitalId, date and slot are required', 400);
  }

  // Check slot is still available
  const existing = await Appointment.findOne({ doctorId, date, slot, status: { $in: ['booked', 'confirmed'] } });
  if (existing) return error(res, 'This slot is already booked. Please choose another.', 409);

  // Check doctor is available that day
  const doctor = await Doctor.findById(doctorId).lean();
  const dayName = DAYS[new Date(date).getDay()];
  const schedule = doctor?.schedule?.[dayName];
  if (!schedule?.available) return error(res, 'Doctor is not available on this day', 400);

  // Create appointment
  const appointment = await Appointment.create({
    userId, doctorId, serviceId, hospitalId, date, slot, notes,
  });

  // Auto-create a token for the appointment date
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await Token.countDocuments({ hospitalId, createdAt: { $gte: today, $lt: tomorrow } });
  const datePrefix = `${String(new Date(date).getDate()).padStart(2,'0')}${String(new Date(date).getMonth()+1).padStart(2,'0')}`;
  const tokenNumber = `${datePrefix}-${String(count + 1).padStart(3, '0')}`;

  const token = await Token.create({
    tokenNumber,
    userId,
    doctorId,
    hospitalId,
    serviceId,
    status: 'waiting',
    estimatedTime: SLOT_DURATION,
    notes: notes || '',
  });

  await Appointment.findByIdAndUpdate(appointment._id, { tokenId: token._id });

  const populated = await Appointment.findById(appointment._id)
    .populate('doctorId', 'name specialization')
    .populate('serviceId', 'name')
    .populate('hospitalId', 'name')
    .lean();

  return success(res, { appointment: populated, token }, 201, 'Appointment booked successfully');
});

// GET /api/appointments/my — patient's own appointments
const getMyAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ userId: req.user._id })
    .populate('doctorId',   'name specialization avatar')
    .populate('serviceId',  'name')
    .populate('hospitalId', 'name location')
    .sort({ date: -1, slot: -1 })
    .lean();
  return success(res, { appointments });
});

// DELETE /api/appointments/:id — cancel
const cancelAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findOne({ _id: req.params.id, userId: req.user._id });
  if (!appt) return error(res, 'Appointment not found', 404);
  if (appt.status === 'completed') return error(res, 'Cannot cancel a completed appointment', 400);

  appt.status = 'cancelled';
  await appt.save();

  // Also cancel the linked token
  if (appt.tokenId) {
    await Token.findByIdAndUpdate(appt.tokenId, { status: 'cancelled' });
  }

  return success(res, { appointment: appt }, 200, 'Appointment cancelled');
});

module.exports = { getSlots, bookAppointment, getMyAppointments, cancelAppointment };
