const Patient = require('../models/Patient');
const Token   = require('../models/Token');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

// GET /api/patients
const getAll = asyncHandler(async (req, res) => {
  const filter = req.hospitalFilter || {};
  const { search, page = 1, limit = 20 } = req.query;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [patients, total] = await Promise.all([
    Patient.find(filter).skip(skip).limit(parseInt(limit)).lean(),
    Patient.countDocuments(filter)
  ]);

  return success(res, { patients, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/patients/:id
const getOne = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const patient = await Patient.findOne(filter).lean();
  if (!patient) return error(res, 'Patient not found', 404);
  return success(res, { patient });
});

// POST /api/patients
const create = asyncHandler(async (req, res) => {
  const hospitalId = req.user.role === 'hospital-admin' ? req.user.hospitalId : req.body.hospitalId;
  const patient = await Patient.create({ ...req.body, hospitalId });
  return success(res, { patient }, 201, 'Patient registered');
});

// PATCH /api/patients/:id
const update = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const patient = await Patient.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
  if (!patient) return error(res, 'Patient not found', 404);
  return success(res, { patient }, 200, 'Patient updated');
});

// DELETE /api/patients/:id
const remove = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const patient = await Patient.findOneAndDelete(filter);
  if (!patient) return error(res, 'Patient not found', 404);
  return success(res, {}, 200, 'Patient deleted');
});

// GET /api/patients/:id/visits — all tokens for this patient (all statuses)
const getVisits = asyncHandler(async (req, res) => {
  const patientFilter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const patient = await Patient.findOne(patientFilter).lean();
  if (!patient) return error(res, 'Patient not found', 404);

  // Match tokens by patientId OR by the linked userId
  const orClauses = [{ patientId: patient._id }];
  if (patient.userId) orClauses.push({ userId: patient.userId });

  const tokens = await Token.find({
    ...(req.hospitalFilter || {}),
    $or: orClauses,
  })
    .populate('doctorId',  'name specialization')
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return success(res, { tokens, count: tokens.length });
});

module.exports = { getAll, getOne, create, update, remove, getVisits };
