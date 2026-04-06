const Token = require('../models/Token');
const Service = require('../models/Service');
const Hospital = require('../models/Hospital');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const { logIDOR } = require('../utils/logger');

// POST /api/tokens/book
exports.bookToken = asyncHandler(async (req, res) => {
  const { serviceId, hospitalId } = req.body;
  const userId = req.user._id;

  if (!hospitalId || !serviceId) {
    return error(res, 'hospitalId and serviceId are required', 400);
  }

  const [service, hospital] = await Promise.all([
    Service.findById(serviceId).lean(),
    Hospital.findById(hospitalId).lean(),
  ]);

  if (!service || !hospital) return error(res, 'Service or Hospital not found', 404);
  if (!service.isActive) return error(res, 'Service is currently unavailable', 400);
  if (hospital.status !== 'active') return error(res, 'Hospital is not active', 400);

  // PAID SERVICE
  if (service.price > 0) {
    const Payment = require('../models/Payment');
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const payment = await Payment.create({
      orderId,
      amount: service.price,
      currency: 'INR',
      status: 'created',
      userId,
      hospitalId,
      serviceId,
    });
    return success(res, {
      paymentRequired: true,
      paymentId: payment._id,
      amount: service.price,
      serviceName: service.name,
      hospitalName: hospital.name,
    }, 200);
  }

  // FREE SERVICE
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await Token.countDocuments({ serviceId, createdAt: { $gte: today } });
  const tokenNumber = `${hospital.code || hospital.name.slice(0, 3).toUpperCase()}-${service.prefix}${101 + count}`;
  const peopleAhead = await Token.countDocuments({ serviceId, status: 'waiting', createdAt: { $gte: today } });

  const token = await Token.create({
    tokenNumber,
    userId,
    hospitalId,
    serviceId,
    position: peopleAhead + 1,
    estimatedTime: (peopleAhead + 1) * service.avgTime,
  });

  const io = req.app.locals.io;
  if (io) io.to(hospitalId.toString()).emit('queue:add', token);

  return success(res, { paymentRequired: false, token }, 201);
});

// GET /api/tokens/status/:hospitalId/:serviceId — public queue status (no PII)
exports.getQueueStatus = asyncHandler(async (req, res) => {
  const { hospitalId, serviceId } = req.params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tokens = await Token.find({ hospitalId, serviceId, createdAt: { $gte: today } })
    .select('tokenNumber status position estimatedTime createdAt')  // no PII
    .sort('createdAt')
    .lean();

  return success(res, tokens);
});

// PATCH /api/tokens/:tokenId — staff/receptionist only (enforced in route)
exports.updateTokenStatus = asyncHandler(async (req, res) => {
  const { tokenId } = req.params;
  const { status } = req.body;

  const ALLOWED_STATUSES = ['waiting', 'in-progress', 'completed', 'skipped', 'cancelled'];
  if (!ALLOWED_STATUSES.includes(status)) {
    return error(res, 'Invalid status value', 400);
  }

  const token = await Token.findById(tokenId);
  if (!token) return error(res, 'Token not found', 404);

  // Patients can only cancel their own token
  if (req.user.role === 'patient') {
    if (token.userId?.toString() !== req.user._id.toString()) {
      logIDOR(req, 'Token', tokenId);
      return error(res, 'Access denied', 403);
    }
    if (status !== 'cancelled') {
      return error(res, 'Patients can only cancel tokens', 403);
    }
  }

  token.status = status;
  await token.save();

  if (['completed', 'skipped', 'in-progress'].includes(status)) {
    const waitTokens = await Token.find({ serviceId: token.serviceId, status: 'waiting' }).sort('createdAt');
    const service = await Service.findById(token.serviceId).lean();
    if (service) {
      await Promise.all(waitTokens.map((t, i) => {
        t.position = i + 1;
        t.estimatedTime = (i + 1) * service.avgTime;
        return t.save();
      }));
    }
  }

  const io = req.app.locals.io;
  if (io) io.to(token.hospitalId.toString()).emit('queue:update', token);

  return success(res, token);
});

// GET /api/tokens/:id — requires auth; patients can only see their own
exports.getTokenById = asyncHandler(async (req, res) => {
  const token = await Token.findById(req.params.id)
    .populate('serviceId', 'name avgTime price')
    .populate('hospitalId', 'name location')
    .lean();

  if (!token) return error(res, 'Token not found', 404);

  // Patients can only view their own tokens
  if (req.user.role === 'patient' && token.userId?.toString() !== req.user._id.toString()) {
    logIDOR(req, 'Token', req.params.id);
    return error(res, 'Access denied', 403);
  }

  return success(res, token);
});

// GET /api/tokens/history — patient's own tokens only
exports.getUserTokens = asyncHandler(async (req, res) => {
  const tokens = await Token.find({ userId: req.user._id })
    .populate('serviceId', 'name')
    .populate('hospitalId', 'name location')
    .sort('-createdAt')
    .lean();

  return success(res, tokens);
});
