const Token = require('../models/Token');
const Service = require('../models/Service');
const Hospital = require('../models/Hospital');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

// POST /api/tokens/book — unified booking endpoint (free + paid)
exports.bookToken = asyncHandler(async (req, res) => {
  const { serviceId, hospitalId } = req.body;
  const userId = req.user._id;

  // Guard: both IDs must be present
  if (!hospitalId || !serviceId) {
    return error(res, 'hospitalId and serviceId are required', 400);
  }

  const [service, hospital] = await Promise.all([
    Service.findById(serviceId),
    Hospital.findById(hospitalId)
  ]);

  if (!service || !hospital) {
    return error(res, 'Service or Hospital not found', 404);
  }

  // PAID SERVICE — create a payment order and return details for PaymentModal
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

  // FREE SERVICE — book token directly
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await Token.countDocuments({ serviceId, createdAt: { $gte: today } });
  const tokenNumber = `${hospital.code || hospital.name.slice(0, 3).toUpperCase()}-${service.prefix}${101 + count}`;

  const peopleAhead = await Token.countDocuments({ serviceId, status: 'waiting', createdAt: { $gte: today } });
  const estimatedTime = (peopleAhead + 1) * service.avgTime;

  const token = await Token.create({
    tokenNumber,
    userId,
    hospitalId,
    serviceId,
    position: peopleAhead + 1,
    estimatedTime,
  });

  const io = req.app.locals.io;
  if (io) io.to(hospitalId.toString()).emit('queue:add', token);

  return success(res, { paymentRequired: false, token }, 201);
});

// GET /api/tokens/status/:hospitalId/:serviceId
exports.getQueueStatus = asyncHandler(async (req, res) => {
  const { hospitalId, serviceId } = req.params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tokens = await Token.find({
    hospitalId,
    serviceId,
    createdAt: { $gte: today }
  }).sort('createdAt').populate('userId', 'name');

  return success(res, tokens);
});

// PATCH /api/tokens/:tokenId
exports.updateTokenStatus = asyncHandler(async (req, res) => {
  const { tokenId } = req.params;
  const { status } = req.body;

  const token = await Token.findByIdAndUpdate(tokenId, { status }, { new: true });
  if (!token) return error(res, 'Token not found', 404);

  if (['completed', 'skipped', 'in-progress'].includes(status)) {
    const waitTokens = await Token.find({ serviceId: token.serviceId, status: 'waiting' }).sort('createdAt');
    const service = await Service.findById(token.serviceId);
    if (service) {
      await Promise.all(waitTokens.map((t, i) => {
        t.position = i + 1;
        t.estimatedTime = (i + 1) * service.avgTime;
        return t.save();
      }));
    }
  }

  const io = req.app.locals.io;
  if (io) {
    io.to(token.hospitalId.toString()).emit('queue:update', token);
  }

  return success(res, token);
});

// GET /api/tokens/:id
exports.getTokenById = asyncHandler(async (req, res) => {
  const token = await Token.findById(req.params.id)
    .populate('serviceId')
    .populate('hospitalId');
  if (!token) return error(res, 'Token not found', 404);
  return success(res, token);
});

// GET /api/tokens/history — user's own token history
exports.getUserTokens = asyncHandler(async (req, res) => {
  const tokens = await Token.find({ userId: req.user._id })
    .populate('serviceId')
    .populate('hospitalId')
    .sort('-createdAt');
  return success(res, tokens);
});
