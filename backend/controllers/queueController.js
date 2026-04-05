const Token   = require('../models/Token');
const Service  = require('../models/Service');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const { logConsultation, recalculateQueue } = require('../utils/queueCalculator');

const emitQueueUpdate = (req, hospitalId, event, data) => {
  const io = req.app.locals.io;
  if (io) io.to(hospitalId.toString()).emit(event, data);
};

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_WAIT = 30; // minutes — used when not enough real data
const MIN_SAMPLES  = 3;  // minimum completed tokens needed for real avg

// ── Utilities ─────────────────────────────────────────────────────────────────

// Auto-expire tokens from previous days
const autoExpireStaleTokens = async (hospitalId) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  await Token.updateMany(
    { hospitalId, status: { $in: ['waiting', 'in-progress'] }, createdAt: { $lt: todayStart } },
    { $set: { status: 'cancelled' } }
  );
};

// Get real avg consultation time — falls back to DEFAULT_WAIT if not enough data
const getRealAvgTime = async (serviceId, serviceDefaultAvg) => {
  const completed = await Token.find({
    serviceId,
    status: 'completed',
    waitTime: { $gt: 0 },
  }).sort({ completedAt: -1 }).limit(20).select('waitTime').lean();

  if (completed.length >= MIN_SAMPLES) {
    return Math.round(completed.reduce((s, t) => s + t.waitTime, 0) / completed.length);
  }
  // Not enough real data — use service default or global default
  return serviceDefaultAvg || DEFAULT_WAIT;
};

// Priority sort: emergency first, then high, then normal, then by time
const PRIORITY_ORDER = { emergency: 3, high: 2, normal: 1 };
const sortByPriority = (tokens) =>
  [...tokens].sort((a, b) =>
    (PRIORITY_ORDER[b.priority] || 1) - (PRIORITY_ORDER[a.priority] || 1) ||
    new Date(a.createdAt) - new Date(b.createdAt)
  );

// Calculate safety level based on queue state
const calcSafetyLevel = (tokens) => {
  const waiting        = tokens.filter(t => t.status === 'waiting');
  const emergencyCount = waiting.filter(t => t.priority === 'emergency').length;
  const highCount      = waiting.filter(t => t.priority === 'high').length;
  const totalWaiting   = waiting.length;

  if (emergencyCount > 0)  return { level: 'Critical', color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   desc: `${emergencyCount} emergency case${emergencyCount > 1 ? 's' : ''} in queue` };
  if (highCount > 2)       return { level: 'High',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', desc: `${highCount} high priority patients` };
  if (totalWaiting > 10)   return { level: 'Busy',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', desc: `${totalWaiting} patients waiting` };
  if (totalWaiting > 0)    return { level: 'Moderate', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', desc: `${totalWaiting} patients in queue` };
  return                          { level: 'Clear',    color: '#10B981', bg: 'rgba(16,185,129,0.12)', desc: 'No patients waiting' };
};

// ── Call next waiting token automatically ─────────────────────────────────────
const callNextToken = async (req, hospitalId, serviceId, doctorId = null) => {
  const io = req.app.locals.io;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const filter = { hospitalId, status: 'waiting', createdAt: { $gte: todayStart } };
  if (doctorId) filter.doctorId = doctorId;
  else filter.serviceId = serviceId;

  const waiting = await Token.find(filter).lean();
  if (!waiting.length) return null;

  const sorted = sortByPriority(waiting);
  const next = await Token.findById(sorted[0]._id);
  next.status   = 'in-progress';
  next.calledAt = new Date();
  await next.save();

  const populated = await Token.findById(next._id)
    .populate('userId', 'name phone')
    .populate('patientId', 'name phone')
    .populate('serviceId', 'name')
    .lean();

  if (io) {
    io.to(hospitalId.toString()).emit('queue:update', populated);
    io.to(`token:${next._id}`).emit('token:called', {
      tokenNumber: next.tokenNumber,
      message: 'Your turn has come! Please proceed to the counter.',
    });
  }
  return populated;
};

// ── GET /api/queue ────────────────────────────────────────────────────────────
const getQueue = asyncHandler(async (req, res) => {
  const { serviceId, date } = req.query;
  const hospitalId = req.hospitalFilter?.hospitalId;

  if (hospitalId) await autoExpireStaleTokens(hospitalId);

  const filter = { ...req.hospitalFilter, status: { $in: ['waiting', 'in-progress'] } };
  if (serviceId) filter.serviceId = serviceId;

  if (date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  } else {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    filter.createdAt = { $gte: todayStart };
  }

  const rawTokens = await Token.find(filter)
    .populate('userId',    'name phone')
    .populate('patientId', 'name phone bloodGroup')
    .populate('doctorId',  'name specialization')
    .populate('serviceId', 'name avgTime')
    .lean();

  // Sort by priority then time
  const tokens = sortByPriority(rawTokens);

  // Calculate real-time estimated wait for each waiting token
  const waiting    = tokens.filter(t => t.status === 'waiting');
  const inProgress = tokens.find(t => t.status === 'in-progress');

  // Cache avg times per service to avoid repeated DB calls
  const avgCache = {};
  const getAvg = async (svcId, svcDefaultAvg) => {
    const key = svcId?.toString();
    if (!key) return DEFAULT_WAIT;
    if (avgCache[key] !== undefined) return avgCache[key];
    avgCache[key] = await getRealAvgTime(svcId, svcDefaultAvg);
    return avgCache[key];
  };

  // Cumulative wait: if someone is in-progress, add remaining time (5 min estimate)
  let cumulativeWait = inProgress ? 5 : 0;
  for (const token of waiting) {
    const avg = await getAvg(
      token.serviceId?._id || token.serviceId,
      token.serviceId?.avgTime
    );
    token.estimatedTime = cumulativeWait + avg;
    cumulativeWait += avg;
  }

  // Calculate safety level and overall avg wait
  const safety = calcSafetyLevel(tokens);
  const overallAvgWait = waiting.length > 0
    ? Math.round(waiting.reduce((s, t) => s + t.estimatedTime, 0) / waiting.length)
    : 0;

  return success(res, { tokens, count: tokens.length, safety, overallAvgWait });
});

// ── GET /api/queue/history ────────────────────────────────────────────────────
const getHistory = asyncHandler(async (req, res) => {
  const { date, patientId, userId, limit = 200 } = req.query;

  const filter = { ...req.hospitalFilter, status: { $in: ['completed', 'skipped', 'cancelled'] } };

  if (date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  }

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
const getPatientVisits = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { userId }    = req.query;

  const orClauses = [{ patientId }];
  if (userId) orClauses.push({ userId });

  const filter = { ...req.hospitalFilter, $or: orClauses };

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

  const count = await Token.countDocuments({ hospitalId, createdAt: { $gte: startOfDay } });
  const tokenNumber = `${datePrefix}-${String(count + 1).padStart(3, '0')}`;

  const token = await Token.create({ ...req.body, hospitalId, tokenNumber, position: count + 1 });
  const populated = await token.populate('serviceId', 'name');

  emitQueueUpdate(req, hospitalId, 'queue:add', populated);

  // Smart Queue: recalculate wait times after adding a token
  const io = req.app.locals.io;
  recalculateQueue({
    hospitalId,
    doctorId:  req.body.doctorId || null,
    serviceId: req.body.serviceId,
    io,
  }).catch(err => console.error('[SmartQ] Recalculate after add failed:', err.message));

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

  if (req.user.role === 'doctor') {
    const Doctor = require('../models/Doctor');
    await Doctor.findOneAndUpdate({ userId: req.user._id }, { lastActivity: new Date() });
  }

  const event = priority ? 'queue:priority-change' : 'queue:update';
  emitQueueUpdate(req, token.hospitalId, event, token);

  const io = req.app.locals.io;
  if (['completed', 'skipped'].includes(status)) {
    // Smart Queue: log consultation and recalculate
    if (status === 'completed') {
      logConsultation(token, io).catch(err =>
        console.error('[SmartQ] Log consultation failed:', err.message)
      );
    } else {
      // skipped — still recalculate
      recalculateQueue({
        hospitalId: token.hospitalId,
        doctorId:   token.doctorId || null,
        serviceId:  token.serviceId,
        io,
      }).catch(err => console.error('[SmartQ] Recalculate after skip failed:', err.message));
    }

    if (io) {
      io.to(`token:${token._id}`).emit('token:done', {
        status,
        message: status === 'completed'
          ? 'Your consultation is complete. Thank you!'
          : 'Your token was skipped. Please check with the reception.',
      });
    }
    await callNextToken(req, token.hospitalId, token.serviceId, token.doctorId || null);
  }

  if (status === 'in-progress' && io) {
    io.to(`token:${token._id}`).emit('token:called', {
      tokenNumber: token.tokenNumber,
      message: 'Your turn has come! Please proceed to the counter.',
    });
    // Recalculate on status change to in-progress too
    recalculateQueue({
      hospitalId: token.hospitalId,
      doctorId:   token.doctorId || null,
      serviceId:  token.serviceId,
      io,
    }).catch(err => console.error('[SmartQ] Recalculate after call failed:', err.message));
  }

  return success(res, { token }, 200, 'Queue updated');
});

// ── DELETE /api/queue/:id ─────────────────────────────────────────────────────
const removeToken = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(req.hospitalFilter || {}) };
  const token  = await Token.findOneAndUpdate(filter, { status: 'cancelled' }, { new: true });
  if (!token) return error(res, 'Token not found', 404);

  emitQueueUpdate(req, token.hospitalId, 'queue:remove', { _id: token._id });

  // Smart Queue: recalculate after removal
  const io = req.app.locals.io;
  recalculateQueue({
    hospitalId: token.hospitalId,
    doctorId:   token.doctorId || null,
    serviceId:  token.serviceId,
    io,
  }).catch(err => console.error('[SmartQ] Recalculate after remove failed:', err.message));

  return success(res, {}, 200, 'Token removed from queue');
});

// ── GET /api/queue/display/:hospitalId ───────────────────────────────────────
const getDisplayQueue = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const Hospital = require('../models/Hospital');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [rawTokens, completedCount, hospital] = await Promise.all([
    Token.find({ hospitalId, status: { $in: ['waiting', 'in-progress'] }, createdAt: { $gte: todayStart } })
      .populate('patientId', 'name')
      .populate('userId',    'name')
      .populate('serviceId', 'name')
      .lean(),
    Token.countDocuments({ hospitalId, status: 'completed', createdAt: { $gte: todayStart } }),
    Hospital.findById(hospitalId).select('name').lean(),
  ]);

  const tokens = sortByPriority(rawTokens);
  return success(res, { tokens, completedCount, hospitalName: hospital?.name || '' });
});

// ── GET /api/queue/doctor ─────────────────────────────────────────────────────
const getDoctorQueue = asyncHandler(async (req, res) => {
  const Doctor = require('../models/Doctor');
  const doctor = await Doctor.findOneAndUpdate(
    { userId: req.user._id },
    { lastActivity: new Date() },
    { new: true }
  ).lean();
  if (!doctor) return error(res, 'Doctor profile not found', 404);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [rawActive, history] = await Promise.all([
    Token.find({ doctorId: doctor._id, hospitalId: req.user.hospitalId, status: { $in: ['waiting', 'in-progress'] }, createdAt: { $gte: todayStart } })
      .populate('patientId', 'name phone bloodGroup gender dateOfBirth')
      .populate('userId',    'name phone')
      .populate('serviceId', 'name avgTime')
      .lean(),
    Token.find({ doctorId: doctor._id, hospitalId: req.user.hospitalId, status: { $in: ['completed', 'skipped'] }, createdAt: { $gte: todayStart } })
      .populate('patientId', 'name phone')
      .populate('userId',    'name phone')
      .populate('serviceId', 'name')
      .sort({ completedAt: -1 })
      .lean(),
  ]);

  // Sort active by priority and calculate estimated wait
  const active = sortByPriority(rawActive);
  const waiting = active.filter(t => t.status === 'waiting');
  const inProgress = active.find(t => t.status === 'in-progress');

  const avgCache = {};
  let cumulativeWait = inProgress ? 5 : 0;
  for (const token of waiting) {
    const key = token.serviceId?._id?.toString() || token.serviceId?.toString();
    if (!avgCache[key]) avgCache[key] = await getRealAvgTime(token.serviceId?._id || token.serviceId, token.serviceId?.avgTime);
    token.estimatedTime = cumulativeWait + avgCache[key];
    cumulativeWait += avgCache[key];
  }

  return success(res, { doctor, active, history, completedCount: history.length });
});

// ── GET /api/queue/stats/:hospitalId — public stats for dashboard ─────────────
const getHospitalQueueStats = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tokens = await Token.find({
    hospitalId,
    status: { $in: ['waiting', 'in-progress'] },
    createdAt: { $gte: todayStart },
  }).select('status priority estimatedTime serviceId').lean();

  const safety = calcSafetyLevel(tokens);
  const waiting = tokens.filter(t => t.status === 'waiting');

  // Calculate avg wait using real data
  const avgCache = {};
  let totalWait = 0;
  for (const t of waiting) {
    const key = t.serviceId?.toString();
    if (key && !avgCache[key]) avgCache[key] = await getRealAvgTime(t.serviceId, DEFAULT_WAIT);
    totalWait += avgCache[key] || DEFAULT_WAIT;
  }
  const avgWait = waiting.length > 0 ? Math.round(totalWait / waiting.length) : 0;

  return success(res, { safety, avgWait, waitingCount: waiting.length });
});

// ── GET /api/queue/my-status — patient's own active queue position ────────────
const getMyQueueStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Find patient's active token (waiting or in-progress)
  const myToken = await Token.findOne({
    userId,
    status: { $in: ['waiting', 'in-progress'] },
    createdAt: { $gte: todayStart },
  })
    .populate('serviceId', 'name avgTime')
    .populate('hospitalId', 'name')
    .lean();

  if (!myToken) {
    return success(res, {
      position: null,
      estimatedWaitTime: null,
      predictedTurnTime: null,
      arrivalSuggestion: null,
      totalWaiting: 0,
      patientsAhead: 0,
      tokenNumber: null,
      serviceName: null,
      hospitalName: null,
    });
  }

  // Get all waiting tokens for the same service/hospital today
  const allWaiting = await Token.find({
    hospitalId: myToken.hospitalId._id || myToken.hospitalId,
    serviceId: myToken.serviceId._id || myToken.serviceId,
    status: 'waiting',
    createdAt: { $gte: todayStart },
  }).sort({ createdAt: 1 }).lean();

  // Find patient's position
  const myIndex = allWaiting.findIndex(t => t._id.toString() === myToken._id.toString());
  const position = myToken.status === 'in-progress' ? 0 : (myIndex >= 0 ? myIndex + 1 : allWaiting.length);
  const patientsAhead = Math.max(0, position - 1);

  // Calculate estimated wait time
  const avgTime = myToken.serviceId?.avgTime || await getRealAvgTime(
    myToken.serviceId._id || myToken.serviceId,
    DEFAULT_WAIT
  );
  const estimatedWaitTime = myToken.status === 'in-progress' ? 0 : patientsAhead * avgTime;

  // Predicted turn time
  const now = new Date();
  const predictedTurnTime = new Date(now.getTime() + estimatedWaitTime * 60000);

  // Arrival suggestion (arrive 15 mins before turn)
  const TRAVEL_BUFFER = 15;
  const arrivalTime = new Date(now.getTime() + Math.max(0, estimatedWaitTime - TRAVEL_BUFFER) * 60000);
  const arrivalSuggestion = arrivalTime > now ? arrivalTime : now;

  return success(res, {
    position,
    estimatedWaitTime: Math.max(0, estimatedWaitTime),
    predictedTurnTime,
    arrivalSuggestion,
    totalWaiting: allWaiting.length,
    patientsAhead,
    tokenNumber: myToken.tokenNumber,
    serviceName: myToken.serviceId?.name || 'General',
    hospitalName: myToken.hospitalId?.name || 'Hospital',
    status: myToken.status,
  });
});

module.exports = {
  getQueue, getHistory, getPatientVisits, addToken, updateToken,
  removeToken, getDisplayQueue, getDoctorQueue, getHospitalQueueStats,
  getMyQueueStatus,
};
