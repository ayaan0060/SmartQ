const Doctor = require('../models/Doctor');
const StaffMember = require('../models/StaffMember');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function summarizeDoctorSchedule(schedule) {
  if (!schedule) return '—';
  const parts = [];
  for (const d of DAY_KEYS) {
    const s = schedule[d];
    if (s?.available && s?.start && s?.end) {
      parts.push(`${d.slice(0, 3)} ${s.start}–${s.end}`);
    }
  }
  return parts.length ? parts.join('; ') : '—';
}

function summarizeShift(shift) {
  if (!shift) return '—';
  const dayPart = Array.isArray(shift.days) && shift.days.length ? shift.days.join('/') : '';
  const timePart = shift.start && shift.end ? `${shift.start}–${shift.end}` : (shift.start || shift.end || '');
  const out = [dayPart, timePart].filter(Boolean).join(' ').trim();
  return out || '—';
}

function assignmentForDoctor(doc) {
  return doc.specialization || '—';
}

function assignmentForPersonnel(p) {
  switch (p.role) {
    case 'nurse':
      return p.wardAssigned ? `Ward: ${p.wardAssigned}` : '—';
    case 'driver': {
      const v = p.ambulanceId && typeof p.ambulanceId === 'object' && p.ambulanceId.vehicleNumber;
      return v ? `Ambulance ${v}` : '—';
    }
    case 'cleaner':
      return p.zoneAssigned ? `Zone: ${p.zoneAssigned}` : '—';
    case 'pharmacist':
      return p.pharmacyWing ? p.pharmacyWing : '—';
    case 'lab_tech':
      return p.labAssigned ? p.labAssigned : '—';
    case 'security':
      return p.gateOrFloor ? p.gateOrFloor : '—';
    case 'reception':
      return p.frontDesk ? p.frontDesk : '—';
    default:
      return '—';
  }
}

// GET /api/staff — unified directory (doctors read-only from Doctor collection + personnel)
const getDirectory = asyncHandler(async (req, res) => {
  const filter = req.hospitalFilter || {};
  const [doctors, personnel] = await Promise.all([
    Doctor.find(filter).lean(),
    StaffMember.find(filter).populate('ambulanceId', 'vehicleNumber').lean(),
  ]);

  const staff = [];

  for (const d of doctors) {
    staff.push({
      kind: 'doctor',
      _id: d._id,
      role: 'doctor',
      name: d.name,
      email: d.email || '',
      phone: d.phone || '',
      isActive: !!d.isAvailable,
      assignment: assignmentForDoctor(d),
      shiftSummary: summarizeDoctorSchedule(d.schedule),
      meta: { specialization: d.specialization, consultationFee: d.consultationFee },
    });
  }

  for (const p of personnel) {
    staff.push({
      kind: 'personnel',
      _id: p._id,
      role: p.role,
      name: p.name,
      email: p.email || '',
      phone: p.phone || '',
      isActive: !!p.isActive,
      assignment: assignmentForPersonnel(p),
      shiftSummary: summarizeShift(p.shift),
      meta: {
        wardAssigned: p.wardAssigned,
        ambulanceId: p.ambulanceId?._id || p.ambulanceId || null,
        zoneAssigned: p.zoneAssigned,
        pharmacyWing: p.pharmacyWing,
        labAssigned: p.labAssigned,
        gateOrFloor: p.gateOrFloor,
        frontDesk: p.frontDesk,
        shift: p.shift || { start: '', end: '', days: [] },
        notes: p.notes || '',
      },
    });
  }

  staff.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));

  const roleCounts = staff.reduce((acc, row) => {
    acc[row.role] = (acc[row.role] || 0) + 1;
    return acc;
  }, {});

  return success(res, { staff, roleCounts, count: staff.length });
});

// POST /api/staff — create personnel only (doctors remain on /api/doctors)
const createPersonnel = asyncHandler(async (req, res) => {
  const hospitalId =
    req.user.role === 'hospital-admin' || req.user.role === 'staff'
      ? req.user.hospitalId
      : req.body.hospitalId;
  if (!hospitalId) return error(res, 'hospitalId is required', 400);

  const {
    role,
    name,
    email,
    phone,
    wardAssigned,
    ambulanceId,
    zoneAssigned,
    pharmacyWing,
    labAssigned,
    gateOrFloor,
    frontDesk,
    shift,
    notes,
    isActive,
  } = req.body;

  if (!role || !name) return error(res, 'role and name are required', 400);

  const doc = await StaffMember.create({
    hospitalId,
    role,
    name,
    email,
    phone,
    wardAssigned,
    ambulanceId: ambulanceId || null,
    zoneAssigned,
    pharmacyWing,
    labAssigned,
    gateOrFloor,
    frontDesk,
    shift: shift || { start: '', end: '', days: [] },
    notes,
    isActive: isActive !== false,
  });

  const created = await StaffMember.findById(doc._id).populate('ambulanceId', 'vehicleNumber').lean();
  return success(res, { member: created }, 201, 'Staff member added');
});

// PATCH /api/staff/:id — update personnel only
const updatePersonnel = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const allowed = [
    'role', 'name', 'email', 'phone',
    'wardAssigned', 'ambulanceId', 'zoneAssigned', 'pharmacyWing',
    'labAssigned', 'gateOrFloor', 'frontDesk',
    'shift', 'notes', 'isActive',
  ];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'ambulanceId') && !updates.ambulanceId) {
    updates.ambulanceId = null;
  }

  const member = await StaffMember.findOneAndUpdate(filter, updates, { new: true, runValidators: true })
    .populate('ambulanceId', 'vehicleNumber')
    .lean();
  if (!member) return error(res, 'Staff member not found', 404);
  return success(res, { member }, 200, 'Staff member updated');
});

module.exports = { getDirectory, createPersonnel, updatePersonnel };
