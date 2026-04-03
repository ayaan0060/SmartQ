const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Token = require('../models/Token');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

// ─── GET /api/hospitals — aggregated list with stats ─────────────────────────
const getAll = asyncHandler(async (req, res) => {
  // Public view: only show active hospitals; super-admin sees all
  const isAdmin = req.user?.role === 'super-admin';
  const filter = isAdmin
    ? (req.hospitalFilter || {})
    : { ...(req.hospitalFilter || {}), status: 'active' };

  // Aggregate per-hospital stats in one pipeline
  const hospitals = await Hospital.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'doctors',
        localField: '_id',
        foreignField: 'hospitalId',
        as: 'doctors',
      },
    },
    {
      $lookup: {
        from: 'patients',
        localField: '_id',
        foreignField: 'hospitalId',
        as: 'patients',
      },
    },
    {
      $lookup: {
        from: 'tokens',
        let: { hid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$hospitalId', '$$hid'] },
              status: { $in: ['waiting', 'in-progress'] },
            },
          },
        ],
        as: 'activeTokens',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'adminId',
        foreignField: '_id',
        as: 'admin',
      },
    },
    {
      $addFields: {
        doctorCount: { $size: '$doctors' },
        patientCount: { $size: '$patients' },
        activeQueueCount: { $size: '$activeTokens' },
        adminName: { $arrayElemAt: ['$admin.name', 0] },
        adminEmail: { $arrayElemAt: ['$admin.email', 0] },
      },
    },
    {
      $project: {
        doctors: 0,
        patients: 0,
        activeTokens: 0,
        admin: 0,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return success(res, { hospitals, count: hospitals.length });
});

// ─── GET /api/hospitals/:id — full detail + stats ─────────────────────────────
const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hospital = await Hospital.findById(id).populate('adminId', 'name email phone').lean();
  if (!hospital) return error(res, 'Hospital not found', 404);

  if (req.user.role === 'hospital-admin' && hospital._id.toString() !== req.user.hospitalId?.toString()) {
    return error(res, 'Access denied', 403);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalDoctors, totalPatients, activeQueues, completedToday, totalTokens] = await Promise.all([
    Doctor.countDocuments({ hospitalId: id }),
    Patient.countDocuments({ hospitalId: id }),
    Token.countDocuments({ hospitalId: id, status: { $in: ['waiting', 'in-progress'] } }),
    Token.countDocuments({ hospitalId: id, status: 'completed', createdAt: { $gte: todayStart } }),
    Token.countDocuments({ hospitalId: id }),
  ]);

  return success(res, {
    hospital,
    stats: { totalDoctors, totalPatients, activeQueues, completedToday, totalTokens },
  });
});

// ─── GET /api/hospitals/:id/doctors ───────────────────────────────────────────
const getHospitalDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ hospitalId: req.params.id }).lean();
  return success(res, { doctors, count: doctors.length });
});

// ─── GET /api/hospitals/:id/patients ──────────────────────────────────────────
const getHospitalPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find({ hospitalId: req.params.id }).lean();
  return success(res, { patients, count: patients.length });
});

// ─── GET /api/hospitals/:id/queue  ────────────────────────────────────────────
const getHospitalQueue = asyncHandler(async (req, res) => {
  const tokens = await Token.find({ hospitalId: req.params.id, status: { $in: ['waiting', 'in-progress'] } })
    .populate('patientId', 'name phone')
    .populate('doctorId', 'name specialization')
    .sort({ priority: -1, createdAt: 1 })
    .lean();
  return success(res, { tokens, count: tokens.length });
});

// ─── POST /api/hospitals/register — atomic hospital + admin creation ──────────
const registerWithAdmin = asyncHandler(async (req, res) => {
  const { name, location, address, contact, timings, code, email, rating,
          adminName, adminEmail, adminPassword, confirmPassword } = req.body;

  // ── Validate required fields ──────────────────────────────────────────────
  if (!name?.trim() || !location?.trim() || !address?.trim() || !contact?.trim() ||
      !timings?.trim() || !code?.trim()) {
    return error(res, 'All hospital fields are required', 400);
  }
  if (!adminName?.trim() || !adminEmail?.trim() || !adminPassword) {
    return error(res, 'Admin name, email, and password are required', 400);
  }
  if (adminPassword !== confirmPassword) {
    return error(res, 'Passwords do not match', 400);
  }
  if (adminPassword.length < 8) {
    return error(res, 'Password must be at least 8 characters', 400);
  }

  // ── Rule 3: duplicate hospital check ─────────────────────────────────────
  const dupHospital = await Hospital.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    location: { $regex: new RegExp(`^${location.trim()}$`, 'i') },
  });
  if (dupHospital) {
    return error(res, 'A hospital with this name already exists in this location', 409);
  }

  // ── Duplicate admin email check ───────────────────────────────────────────
  const dupEmail = await User.findOne({ email: adminEmail.toLowerCase().trim() });
  if (dupEmail) {
    return error(res, 'An account with this email already exists', 409);
  }

  // ── Duplicate code check ──────────────────────────────────────────────────
  const dupCode = await Hospital.findOne({ code: code.toUpperCase().trim() });
  if (dupCode) {
    return error(res, 'A hospital with this short code already exists. Please choose a different code.', 409);
  }

  // ── Rule 4: atomic creation with rollback ─────────────────────────────────
  let savedHospital = null;
  let savedAdmin = null;
  try {
    savedHospital = await Hospital.create({
      name: name.trim(),
      location: location.trim(),
      address: address.trim(),
      contact: contact.trim(),
      timings: timings.trim(),
      code: code.toUpperCase().trim(),
      email: email?.toLowerCase().trim() || undefined,
      rating: rating ? parseFloat(rating) : 0,
      status: 'pending',   // requires super-admin approval before going live
    });

    // Rule 1: role is ALWAYS hardcoded — never from req.body
    savedAdmin = await User.create({
      name: adminName.trim(),
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,
      role: 'hospital-admin',           // ← hardcoded by system
      hospitalId: savedHospital._id,
    });

    savedHospital.adminId = savedAdmin._id;
    await savedHospital.save();
  } catch (err) {
    // Rollback both if either fails
    if (savedHospital) await Hospital.findByIdAndDelete(savedHospital._id);
    if (savedAdmin) await User.findByIdAndDelete(savedAdmin._id);
    // Surface duplicate key errors clearly
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      console.error('Duplicate key field:', field, err.keyPattern);
      const messages = {
        code: 'A hospital with this short code already exists. Please choose a different code.',
        email: 'An account with this email already exists.',
        phone: 'An account with this phone already exists.',
      };
      return res.status(409).json({ success: false, message: messages[field] || `Duplicate value for field: ${field}. Please use a different value.` });
    }
    console.error('Registration error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Registration failed. Please try again.' });
  }

  const token = jwt.sign(
    { userId: savedAdmin._id, role: savedAdmin.role, hospitalId: savedAdmin.hospitalId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return success(res, { token, user: savedAdmin.toJSON(), hospital: savedHospital }, 201, 'Hospital registered successfully');
});

// ─── POST /api/hospitals (super-admin only) ───────────────────────────────────
const create = asyncHandler(async (req, res) => {
  const hospital = await Hospital.create(req.body);
  return success(res, { hospital }, 201, 'Hospital created');
});

// ─── PATCH /api/hospitals/:id ─────────────────────────────────────────────────
const update = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!hospital) return error(res, 'Hospital not found', 404);
  return success(res, { hospital }, 200, 'Hospital updated');
});

// ─── DELETE /api/hospitals/:id ────────────────────────────────────────────────
const remove = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndDelete(req.params.id);
  if (!hospital) return error(res, 'Hospital not found', 404);
  return success(res, {}, 200, 'Hospital deleted');
});

// ─── GET /api/hospitals/:id/stats ─────────────────────────────────────────────
const getStats = asyncHandler(async (req, res) => {
  const hospitalId = req.params.id;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalDoctors, totalPatients, todayTokens, completedTokens] = await Promise.all([
    Doctor.countDocuments({ hospitalId }),
    Patient.countDocuments({ hospitalId }),
    Token.countDocuments({ hospitalId, createdAt: { $gte: todayStart } }),
    Token.countDocuments({ hospitalId, status: 'completed' }),
  ]);

  return success(res, { totalDoctors, totalPatients, todayTokens, completedTokens });
});

// ─── PATCH /api/hospitals/:id/approve (super-admin only) ─────────────────────
const approve = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndUpdate(
    req.params.id,
    { status: 'active' },
    { new: true }
  );
  if (!hospital) return error(res, 'Hospital not found', 404);
  return success(res, { hospital }, 200, 'Hospital approved and is now active');
});

// ─── PATCH /api/hospitals/:id/reject (super-admin only) ──────────────────────
const reject = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndUpdate(
    req.params.id,
    { status: 'inactive' },
    { new: true }
  );
  if (!hospital) return error(res, 'Hospital not found', 404);
  return success(res, { hospital }, 200, 'Hospital registration rejected');
});

module.exports = { getAll, getOne, getHospitalDoctors, getHospitalPatients, getHospitalQueue, registerWithAdmin, create, update, remove, getStats, approve, reject };
