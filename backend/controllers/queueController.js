const Token   = require('../models/Token');
const Service  = require('../models/Service');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

const emitQueueUpdate = (req, hospitalId, event, data) => {
  const io = req.app.locals.io;
  if (io) io.to(hospitalId.toString()).emit(event, data);
};

// Auto-expire tokens from previous days still in waiting/in-progress
const autoExpireStaleTokens = async (hospitalId) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  await Token.updateMany(
    { hospitalId, status: { $in: ['waiting', 'in-progress'] }, createdAt: { $lt: todayStart } },
    { $set: { status: 'cancelled' } }
  );
};

// Call next waiting token automatically
const callNextToken = async (req, hospitalId, serviceId) => {
  const io = req.app.locals.io;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const priorityOrder = { emergency: 3, high: 2, normal: 1 };

  const waiting = await Token.find({
    hospitalId, serviceId, status: 'waiting',
    createdAt: { $gte: todayStart },
  }).populate('userId', 'name').populate('patientId', 'name').populate('serviceId', 'name').sort({ createdAt: 1 });

  if (!waiting.length) return null;
  waiting.sort((a, b) => (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1));

  const next = waiting[0];
  next.status = 'in-progress';
  next.calledAt = new Date();
  await next.save();

  if (io) {
    io.to(hospitalId.toString()).emit('queue:update', next);
    io.to(`token:${next._id}`).emit('token:called', {
      tokenNumber: next.tokenNumber,
      message: 'Your turn has come! Please proceed to the counter.',
    });
  }
  return next;
};

// ── GET /api/queue ────────────────────────────────────────────────────────────
// Active queue (waiting + in-progress) for a hospital/service.
// Supports optional ?date=YYYY-MM-DD to scope to a specific day.
const getQueue = asyncHandler(async (req, res) => {
  const { serviceId, date } = req.query;
  const hospitalId = req.hospitalFilter?.hospitalId;

  // Auto-expire stale tokens from previous days
  if (hospitalId) await autoExpireStaleTokens(hospitalId);

  const filter = {
    ...req.hospitalFilter,
    status: { $in: ['waiting', 'in-progress'] },
  };

  if (serviceId) filter.serviceId = serviceId;

  // Optional date scope — defaults to today when not supplied
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  } else {
    // Always scope active queue to today so stale tokens don't bleed through
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    filter.createdAt = { $gte: todayStart };
  }

  const tokens = await Token.find(filter)
    .populate('userId',    'name phone')
    .populate('patientId', 'name phone bloodGroup')
    .populate('doctorId',  'name specialization')
    .populate('serviceId', 'name')
    .sort({ priority: -1, createdAt: 1 })
    .lean();

  return success(res, { tokens, count: tokens.length });
});

// ── GET /api/queue/history ────────────────────────────────────────────────────
// All terminal tokens (completed / skipped / cancelled) for a hospital.
//
// Query params:
//   date       — YYYY-MM-DD  filter by booking date (createdAt)
//   patientId  — ObjectId    filter to one patient (Patient._id)
//   userId     — ObjectId    filter to one user    (User._id)
//   limit      — number      default 200
const getHistory = asyncHandler(async (req, res) => {
  const { date, patientId, userId, limit = 200 } = req.query;

  const filter = {
    ...req.hospitalFilter,
    status: { $in: ['completed', 'skipped', 'cancelled'] },
  };

  // Date filter — scopes to a single calendar day
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  }

  // Patient-scoped history (for VisitHistoryDrawer)
  if (patientId) filter.patientId = patientId;
  if (userId)    filter.userId    = userId;

  const tokens = await Token.find(filter)
    .populate('userId',    'name phone')
    .populate('patientId', 'name phone bloodGroup')
    .populate('doctorId',  'name specialization')
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  return success(res, { tokens });
});

// ── GET /api/queue/patient/:patientId ─────────────────────────────────────────
// All tokens (all statuses) for a single patient — used by VisitHistoryDrawer.
// Matches on patientId OR userId so both registration paths are covered.
const getPatientVisits = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { userId }    = req.query; // optional secondary lookup key

  // Build an $or so we catch tokens linked by either field
  const orClauses = [{ patientId }];
  if (userId) orClauses.push({ userId });

  const filter = {
    ...req.hospitalFilter,
    $or: orClauses,
  };

  const tokens = await Token.find(filter)
    .populate('userId',    'name phone')
    .populate('patientId', 'name phone bloodGroup')
    .populate('doctorId',  'name specialization')
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return success(res, { tokens, count: tokens.length });
});

// ── POST /api/queue ───────────────────────────────────────────────────────────
const addToken = asyncHandler(async (req, res) => {
  const hospitalId =
    ['hospital-admin', 'staff', 'receptionist'].includes(req.user.role)
      ? req.user.hospitalId
      : req.body.hospitalId;

  const today      = new Date();
  const datePrefix = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const count = await Token.countDocuments({
    hospitalId,
    createdAt: { $gte: startOfDay },
  });

  const tokenNumber = `${datePrefix}-${String(count + 1).padStart(3, '0')}`;

  const token = await Token.create({
    ...req.body,
    hospitalId,
    tokenNumber,
    position: count + 1,
  });

  const populated = await token.populate('serviceId', 'name');

  emitQueueUpdate(req, hospitalId, 'queue:add', populated);
  return success(res, { token: populated }, 201, 'Token added to queue');
});

// ── PATCH /api/queue/:id ──────────────────────────────────────────────────────
const updateToken = asyncHandler(async (req, res) => {
  const { status, priority } = req.body;

  const updateData = { ...req.body };
  if (status === 'in-progress') updateData.calledAt = new Date();
  if (status === 'completed') {
    updateData.completedAt = new Date();
    const existing = await Token.findById(req.params.id);
    if (existing?.calledAt) {
      updateData.waitTime = Math.round((new Date() - existing.calledAt) / 60000);
    }
  }

  const filter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const token  = await Token.findOneAndUpdate(filter, updateData, { new: true })
    .populate('userId',    'name')
    .populate('patientId', 'name')
    .populate('serviceId', 'name');

  if (!token) return error(res, 'Token not found', 404);

  const event = priority ? 'queue:priority-change' : 'queue:update';
  emitQueueUpdate(req, token.hospitalId, event, token);

  // If token is completed or skipped — notify patient + auto-call next
  const io = req.app.locals.io;
  if (['completed', 'skipped'].includes(status)) {
    // Notify the completed patient
    if (io) {
      io.to(`token:${token._id}`).emit('token:done', {
        status,
        message: status === 'completed'
          ? 'Your consultation is complete. Thank you!'
          : 'Your token was skipped. Please check with the reception.',
      });
    }
    // Auto-call next waiting patient
    await callNextToken(req, token.hospitalId, token.serviceId);
  }

  // If called to in-progress — notify that specific patient
  if (status === 'in-progress' && io) {
    io.to(`token:${token._id}`).emit('token:called', {
      tokenNumber: token.tokenNumber,
      message: 'Your turn has come! Please proceed to the counter.',
    });
  }

  return success(res, { token }, 200, 'Queue updated');
});

// ── DELETE /api/queue/:id ─────────────────────────────────────────────────────
const removeToken = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const token  = await Token.findOneAndUpdate(
    filter,
    { status: 'cancelled' },
    { new: true }
  );
  if (!token) return error(res, 'Token not found', 404);

  emitQueueUpdate(req, token.hospitalId, 'queue:remove', { _id: token._id });
  return success(res, {}, 200, 'Token removed from queue');
});

module.exports = { getQueue, getHistory, getPatientVisits, addToken, updateToken, removeToken };
