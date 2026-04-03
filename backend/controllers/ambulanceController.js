const Ambulance = require('../models/Ambulance');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

// GET /api/ambulances?hospitalId=xxx
const getAll = asyncHandler(async (req, res) => {
  const hospitalId = req.query.hospitalId || req.user.hospitalId;
  if (!hospitalId) return error(res, 'hospitalId required', 400);
  const ambulances = await Ambulance.find({ hospitalId }).lean();
  return success(res, { ambulances, count: ambulances.length });
});

// POST /api/ambulances
const create = asyncHandler(async (req, res) => {
  const { vehicleNumber, driverName, driverPhone } = req.body;
  const hospitalId = req.user.hospitalId;
  if (!vehicleNumber) return error(res, 'vehicleNumber is required', 400);
  const ambulance = await Ambulance.create({ vehicleNumber, driverName, driverPhone, hospitalId });
  return success(res, { ambulance }, 201, 'Ambulance added');
});

// PUT /api/ambulances/:id
const update = asyncHandler(async (req, res) => {
  const { vehicleNumber, driverName, driverPhone, status } = req.body;
  const ambulance = await Ambulance.findByIdAndUpdate(
    req.params.id,
    { vehicleNumber, driverName, driverPhone, status },
    { new: true, runValidators: true }
  );
  if (!ambulance) return error(res, 'Ambulance not found', 404);
  return success(res, { ambulance }, 200, 'Ambulance updated');
});

// DELETE /api/ambulances/:id
const remove = asyncHandler(async (req, res) => {
  const ambulance = await Ambulance.findByIdAndDelete(req.params.id);
  if (!ambulance) return error(res, 'Ambulance not found', 404);
  return success(res, {}, 200, 'Ambulance deleted');
});

// PATCH /api/ambulances/:id/location
const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (lat == null || lng == null) return error(res, 'lat and lng required', 400);

  const ambulance = await Ambulance.findByIdAndUpdate(
    req.params.id,
    { currentLocation: { lat, lng, updatedAt: new Date() } },
    { new: true }
  );
  if (!ambulance) return error(res, 'Ambulance not found', 404);

  // Broadcast to all clients tracking this ambulance
  const io = req.app.locals.io;
  io.to(`ambulance:${ambulance._id}`).emit('ambulance:location:updated', {
    ambulanceId: ambulance._id,
    lat,
    lng,
    updatedAt: new Date(),
  });

  return success(res, { ambulance }, 200, 'Location updated');
});

module.exports = { getAll, create, update, remove, updateLocation };
