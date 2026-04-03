const EmergencyRequest = require('../models/EmergencyRequest');
const Ambulance        = require('../models/Ambulance');
const User             = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

// ── POST /api/emergency/request ───────────────────────────────────────────────
const createRequest = asyncHandler(async (req, res) => {
  const { hospitalId, patientLocation, emergencyType, notes, source } = req.body;
  if (!hospitalId) return error(res, 'hospitalId is required', 400);

  const request = await EmergencyRequest.create({
    patientId:       req.user._id,
    hospitalId,
    patientLocation: patientLocation || {},
    emergencyType:   emergencyType   || 'medical',
    notes:           notes           || '',
    source:          source          || 'standard',
    status:          'requested',
  });

  // Notify admin room of this hospital
  const io = req.app.locals.io;
  io.to(`hospital:${hospitalId}`).emit('emergency:new', {
    requestId:       request._id,
    patientName:     req.user.name,
    emergencyType:   request.emergencyType,
    source:          request.source,
    patientLocation: patientLocation || {},
    notes:           notes || '',
    requestedAt:     request.requestedAt,
  });

  return success(res, { request }, 201, 'Emergency request sent');
});

// ── GET /api/emergency/requests ───────────────────────────────────────────────
const getRequests = asyncHandler(async (req, res) => {
  const hospitalId = req.query.hospitalId || req.user.hospitalId;
  const filter = { hospitalId };
  if (req.query.status) filter.status = req.query.status;

  const requests = await EmergencyRequest.find(filter)
    .populate('patientId',   'name phone email')
    .populate('ambulanceId', 'vehicleNumber driverName driverPhone currentLocation status')
    .sort({ requestedAt: -1 })
    .lean();

  return success(res, { requests, count: requests.length });
});

// ── PATCH /api/emergency/requests/:id/dispatch ────────────────────────────────
const dispatch = asyncHandler(async (req, res) => {
  const { ambulanceId } = req.body;
  if (!ambulanceId) return error(res, 'ambulanceId is required', 400);

  const request = await EmergencyRequest.findById(req.params.id)
    .populate('patientId', 'name');
  if (!request) return error(res, 'Request not found', 404);

  const ambulance = await Ambulance.findById(ambulanceId);
  if (!ambulance) return error(res, 'Ambulance not found', 404);
  if (ambulance.status !== 'available') return error(res, 'Ambulance is not available', 400);

  request.ambulanceId  = ambulanceId;
  request.status       = 'dispatched';
  request.dispatchedAt = new Date();
  await request.save();

  ambulance.status = 'dispatched';
  await ambulance.save();

  const io = req.app.locals.io;

  // Notify the patient's emergency room
  io.to(`emergency:${request._id}`).emit('emergency:dispatched', {
    requestId:     request._id,
    ambulanceId:   ambulance._id,
    vehicleNumber: ambulance.vehicleNumber,
    driverName:    ambulance.driverName,
    driverPhone:   ambulance.driverPhone,
  });

  // Notify hospital admin room
  io.to(`hospital:${request.hospitalId}`).emit('emergency:status:updated', {
    requestId: request._id,
    status:    'dispatched',
  });

  // Bridge: relay ambulance location updates into the patient's emergency room
  // so the patient map updates without joining the ambulance room directly
  io.to(`emergency:${request._id}`).emit('emergency:ambulance:assigned', {
    ambulanceId: ambulance._id.toString(),
  });

  return success(res, { request, ambulance }, 200, 'Ambulance dispatched');
});

// ── PATCH /api/emergency/requests/:id/status ──────────────────────────────────
const updateStatus = asyncHandler(async (req, res) => {
  const { status, notes, rating } = req.body;
  const allowed = ['acknowledged', 'en_route', 'arriving', 'arrived', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return error(res, 'Invalid status', 400);

  const request = await EmergencyRequest.findById(req.params.id);
  if (!request) return error(res, 'Request not found', 404);

  request.status = status;
  if (notes)  request.notes = notes;
  if (rating) request.rating = rating;

  if (status === 'en_route')  request.enRouteAt   = new Date();
  if (status === 'arrived')   request.arrivedAt   = new Date();
  if (status === 'completed') request.completedAt = new Date();

  // Free up ambulance when done
  if ((status === 'completed' || status === 'cancelled') && request.ambulanceId) {
    await Ambulance.findByIdAndUpdate(request.ambulanceId, { status: 'available' });
  }

  await request.save();

  const io = req.app.locals.io;

  // Notify patient room
  io.to(`emergency:${request._id}`).emit('emergency:status:updated', {
    requestId: request._id,
    status,
    message:   statusMessage(status),
  });

  // Notify admin room
  io.to(`hospital:${request.hospitalId}`).emit('emergency:status:updated', {
    requestId: request._id,
    status,
  });

  return success(res, { request }, 200, 'Status updated');
});

// ── PATCH /api/emergency/requests/:id/rate ────────────────────────────────────
const rateRequest = asyncHandler(async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) return error(res, 'Rating must be 1-5', 400);

  const request = await EmergencyRequest.findById(req.params.id);
  if (!request) return error(res, 'Request not found', 404);

  // Only the patient who made the request can rate it
  if (request.patientId.toString() !== req.user._id.toString()) {
    return error(res, 'Access denied', 403);
  }

  request.rating = rating;
  await request.save();

  return success(res, { request }, 200, 'Rating saved');
});

// ── GET /api/emergency/requests/:id/track ─────────────────────────────────────
const track = asyncHandler(async (req, res) => {
  const request = await EmergencyRequest.findById(req.params.id)
    .populate('ambulanceId', 'vehicleNumber driverName driverPhone currentLocation status')
    .populate('patientId',   'name phone')
    .lean();
  if (!request) return error(res, 'Request not found', 404);

  // Patients can only track their own request
  if (req.user.role === 'patient' && request.patientId._id.toString() !== req.user._id.toString()) {
    return error(res, 'Access denied', 403);
  }

  return success(res, {
    status:            request.status,
    emergencyType:     request.emergencyType,
    notes:             request.notes,
    patientLocation:   request.patientLocation,
    ambulanceLocation: request.ambulanceId?.currentLocation || null,
    ambulance:         request.ambulanceId || null,
    patient:           request.patientId   || null,
    requestedAt:       request.requestedAt,
    dispatchedAt:      request.dispatchedAt,
  });
});

// ── PATCH /api/emergency/requests/:id/cancel ─────────────────────────────────
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await EmergencyRequest.findById(req.params.id);
  if (!request) return error(res, 'Request not found', 404);

  // Only the patient who made the request can cancel
  if (request.patientId.toString() !== req.user._id.toString()) {
    return error(res, 'Access denied', 403);
  }

  // Cannot cancel once en_route or further
  const nonCancellable = ['en_route', 'arriving', 'arrived', 'completed'];
  if (nonCancellable.includes(request.status)) {
    return error(res, 'Cannot cancel — ambulance is already on the way', 400);
  }

  request.status = 'cancelled';
  await request.save();

  // Free ambulance if one was assigned
  if (request.ambulanceId) {
    await Ambulance.findByIdAndUpdate(request.ambulanceId, { status: 'available' });
  }

  const io = req.app.locals.io;
  io.to(`emergency:${request._id}`).emit('emergency:status:updated', {
    requestId: request._id,
    status:    'cancelled',
    message:   'Request was cancelled by patient.',
  });
  io.to(`hospital:${request.hospitalId}`).emit('emergency:status:updated', {
    requestId: request._id,
    status:    'cancelled',
  });

  return success(res, { request }, 200, 'Request cancelled');
});

// ── helpers ───────────────────────────────────────────────────────────────────
const statusMessage = (status) => {
  const map = {
    acknowledged: 'Hospital acknowledged your request. Dispatching ambulance...',
    dispatched:   'Ambulance is on the way!',
    en_route:     'Ambulance is en route to your location.',
    arriving:     'Ambulance is arriving — please come to the entrance.',
    arrived:      'Ambulance has arrived at your location.',
    completed:    'You have been assisted. Stay safe.',
    cancelled:    'Emergency request was cancelled.',
  };
  return map[status] || status;
};

module.exports = { createRequest, getRequests, dispatch, updateStatus, rateRequest, cancelRequest, track };
