/**
 * queueCalculator.js — Smart Queue Engine
 *
 * Calculates estimated wait times using exponentially weighted rolling averages
 * from consultation logs. Falls back to service default or global default
 * when not enough historical data exists.
 */

const ConsultationLog = require('../models/ConsultationLog');
const Token           = require('../models/Token');
const Doctor          = require('../models/Doctor');

// ── Constants ────────────────────────────────────────────────────
const DEFAULT_CONSULTATION_MINS = 15;   // global fallback
const MIN_SAMPLES               = 3;    // minimum logs needed for real avg
const ROLLING_WINDOW            = 10;   // number of recent logs to consider
const TRAVEL_BUFFER_MINS        = 15;   // arrive X mins before your turn
const ALPHA                     = 0.3;  // exponential smoothing factor (higher = more recent bias)

// ── Rolling Average ──────────────────────────────────────────────

/**
 * Get the exponentially smoothed rolling average consultation time
 * for a specific doctor, optionally filtered by patient type.
 *
 * @param {ObjectId} doctorId
 * @param {string}   [patientType] — 'new', 'follow-up', 'emergency', 'standard'
 * @returns {Promise<number|null>}  — avg in minutes, or null if not enough data
 */
async function getRollingAverage(doctorId, patientType = null) {
  const filter = { doctorId };
  if (patientType) filter.patientType = patientType;

  const logs = await ConsultationLog.find(filter)
    .sort({ completedAt: -1 })
    .limit(ROLLING_WINDOW)
    .select('duration')
    .lean();

  if (logs.length < MIN_SAMPLES) return null;

  // Exponential weighted moving average — newest logs get more weight
  let ewa = logs[logs.length - 1].duration;
  for (let i = logs.length - 2; i >= 0; i--) {
    ewa = ALPHA * logs[i].duration + (1 - ALPHA) * ewa;
  }

  return Math.round(ewa);
}

// ── Per-Token Wait Calculation ───────────────────────────────────

/**
 * Calculate estimated wait time for a token based on its queue position
 * and the doctor's rolling average, falling back to service avg, then global default.
 *
 * @param {number}   patientsAhead  — count of patients before this one
 * @param {ObjectId} doctorId
 * @param {number}   [serviceAvg]   — service's configured avgTime (fallback)
 * @returns {Promise<number>}       — estimated wait in minutes
 */
async function calculateWaitTime(patientsAhead, doctorId, serviceAvg = null) {
  // Try rolling average from real consultation data
  const rollingAvg = doctorId ? await getRollingAverage(doctorId) : null;

  // Choose best available avg
  const avgTime = rollingAvg || serviceAvg || DEFAULT_CONSULTATION_MINS;

  return Math.max(0, patientsAhead * avgTime);
}

// ── Bulk Queue Recalculation ─────────────────────────────────────

/**
 * Recalculate estimated wait, predicted turn time, and arrival suggestion
 * for all waiting tokens belonging to a specific doctor (or service).
 *
 * Called after: token added, token completed, token skipped, priority change.
 *
 * @param {Object} params
 * @param {ObjectId} params.hospitalId
 * @param {ObjectId} [params.doctorId]    — filter by doctor
 * @param {ObjectId} [params.serviceId]   — filter by service (fallback)
 * @param {Object}   [params.io]          — Socket.IO instance for real-time push
 * @returns {Promise<void>}
 */
async function recalculateQueue({ hospitalId, doctorId, serviceId, io }) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const filter = {
    hospitalId,
    status: 'waiting',
    createdAt: { $gte: todayStart },
  };
  if (doctorId) filter.doctorId = doctorId;
  else if (serviceId) filter.serviceId = serviceId;

  // Fetch all waiting tokens, sorted by priority then creation time
  const PRIORITY_ORDER = { emergency: 3, high: 2, normal: 1 };
  const waitingTokens = await Token.find(filter)
    .populate('serviceId', 'avgTime')
    .sort({ createdAt: 1 })
    .lean();

  // Sort by priority, then time
  waitingTokens.sort((a, b) =>
    (PRIORITY_ORDER[b.priority] || 1) - (PRIORITY_ORDER[a.priority] || 1) ||
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Get avg from rolling data or fallback
  const rollingAvg = doctorId ? await getRollingAverage(doctorId) : null;

  // Check if there's an in-progress token
  const inProgressToken = await Token.findOne({
    hospitalId,
    ...(doctorId ? { doctorId } : serviceId ? { serviceId } : {}),
    status: 'in-progress',
    createdAt: { $gte: todayStart },
  }).lean();

  const now = new Date();
  let cumulativeWait = inProgressToken ? 5 : 0; // assume 5 mins remaining for in-progress

  const bulkOps = [];

  for (const token of waitingTokens) {
    const serviceAvg = token.serviceId?.avgTime || null;
    const avgTime = rollingAvg || serviceAvg || DEFAULT_CONSULTATION_MINS;

    const estimatedWaitTime = cumulativeWait;
    const predictedTurnTime = new Date(now.getTime() + estimatedWaitTime * 60000);
    const arrivalSuggestion = new Date(now.getTime() + Math.max(0, estimatedWaitTime - TRAVEL_BUFFER_MINS) * 60000);

    bulkOps.push({
      updateOne: {
        filter: { _id: token._id },
        update: {
          $set: {
            estimatedWaitTime,
            predictedTurnTime,
            arrivalSuggestion,
            position: bulkOps.length + 1,
          },
        },
      },
    });

    cumulativeWait += avgTime;
  }

  if (bulkOps.length > 0) {
    await Token.bulkWrite(bulkOps);
  }

  // Also update the doctor's cached avg consultation time
  if (doctorId && rollingAvg) {
    await Doctor.findByIdAndUpdate(doctorId, {
      avgConsultationTime: rollingAvg,
      lastCalculatedAt: now,
    });
  }

  // Emit real-time update to hospital room
  if (io && hospitalId) {
    io.to(hospitalId.toString()).emit('queue:updated', {
      hospitalId,
      doctorId,
      serviceId,
      updatedAt: now,
      count: waitingTokens.length,
    });
  }
}

// ── Log a Consultation ───────────────────────────────────────────

/**
 * Log a completed consultation and trigger queue recalculation.
 *
 * @param {Object} token — the completed token (with calledAt, completedAt populated)
 * @param {Object} [io]  — Socket.IO instance
 * @returns {Promise<void>}
 */
async function logConsultation(token, io) {
  if (!token.calledAt || !token.completedAt) return;

  const duration = Math.round((new Date(token.completedAt) - new Date(token.calledAt)) / 60000);
  if (duration <= 0) return;

  await ConsultationLog.create({
    doctorId:    token.doctorId,
    hospitalId:  token.hospitalId,
    serviceId:   token.serviceId,
    tokenId:     token._id,
    patientType: token.patientType || 'standard',
    duration,
    startedAt:   token.calledAt,
    completedAt: token.completedAt,
  });

  // Update doctor's patient count
  if (token.doctorId) {
    await Doctor.findByIdAndUpdate(token.doctorId, {
      $inc: { totalPatients: 1 },
      lastActivity: new Date(),
    });
  }

  // Recalculate the queue
  await recalculateQueue({
    hospitalId: token.hospitalId,
    doctorId:   token.doctorId || null,
    serviceId:  token.serviceId,
    io,
  });
}

module.exports = {
  getRollingAverage,
  calculateWaitTime,
  recalculateQueue,
  logConsultation,
  DEFAULT_CONSULTATION_MINS,
};
