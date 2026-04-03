const Service = require('../models/Service');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

exports.createService = asyncHandler(async (req, res) => {
  const { name, avgTime, prefix, hospitalId, price, isActive } = req.body;
  if (!name || !avgTime || !prefix || !hospitalId) return error(res, 'Missing required fields', 400);

  const service = await Service.create({ name, avgTime, prefix, hospitalId, price: Number(price) || 0, isActive });
  return success(res, service, 201);
});

exports.getServicesByHospital = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const services = await Service.find({ hospitalId }).populate('hospitalId', 'name');
  return success(res, services);
});

exports.updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const service = await Service.findByIdAndUpdate(id, updates, { new: true });
  if (!service) return error(res, 'Service not found', 404);
  return success(res, service);
});

exports.deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const service = await Service.findByIdAndDelete(id);
  if (!service) return error(res, 'Service not found', 404);
  return success(res, service);
});
