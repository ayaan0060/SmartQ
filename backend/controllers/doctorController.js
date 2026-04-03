const Doctor = require('../models/Doctor');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

// GET /api/doctors
const getAll = asyncHandler(async (req, res) => {
  const filter = req.hospitalFilter || {};
  const doctors = await Doctor.find(filter).lean();
  return success(res, { doctors, count: doctors.length });
});

// GET /api/doctors/:id
const getOne = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const doctor = await Doctor.findOne(filter).lean();
  if (!doctor) return error(res, 'Doctor not found', 404);
  return success(res, { doctor });
});

// POST /api/doctors
const create = asyncHandler(async (req, res) => {
  const hospitalId = req.user.role === 'hospital-admin' ? req.user.hospitalId : req.body.hospitalId;
  const doctor = await Doctor.create({ ...req.body, hospitalId });
  return success(res, { doctor }, 201, 'Doctor created');
});

// PATCH /api/doctors/:id
const update = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const doctor = await Doctor.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
  if (!doctor) return error(res, 'Doctor not found', 404);
  return success(res, { doctor }, 200, 'Doctor updated');
});

// DELETE /api/doctors/:id
const remove = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const doctor = await Doctor.findOneAndDelete(filter);
  if (!doctor) return error(res, 'Doctor not found', 404);
  return success(res, {}, 200, 'Doctor deleted');
});

// PATCH /api/doctors/:id/availability
const toggleAvailability = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return error(res, 'Doctor not found', 404);
  doctor.isAvailable = !doctor.isAvailable;
  await doctor.save();
  return success(res, { doctor }, 200, 'Availability updated');
});

module.exports = { getAll, getOne, create, update, remove, toggleAvailability };
