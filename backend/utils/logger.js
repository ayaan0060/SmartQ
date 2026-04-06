/**
 * logger.js — Structured security & audit logger
 *
 * Logs to console in development (JSON-formatted for log aggregators in prod).
 * In production, pipe stdout to a log aggregator (Datadog, CloudWatch, etc.).
 *
 * Events logged:
 *  - auth:login_success / auth:login_failure
 *  - auth:register
 *  - auth:token_invalid
 *  - api:error (4xx/5xx)
 *  - security:rate_limit
 *  - security:idor_attempt
 *  - security:forbidden
 */

const isProd = process.env.NODE_ENV === 'production';

const log = (level, event, data = {}) => {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  // In production emit JSON for log aggregators; in dev pretty-print
  if (isProd) {
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
    console.log(`${color}[${level.toUpperCase()}]\x1b[0m [${event}]`, data);
  }
};

// ── Auth events ───────────────────────────────────────────────────────────────
const logLoginSuccess = (req, userId, role) =>
  log('info', 'auth:login_success', {
    userId: userId?.toString(),
    role,
    ip: req.ip,
    ua: req.headers['user-agent']?.slice(0, 120),
  });

const logLoginFailure = (req, reason, identifier) =>
  log('warn', 'auth:login_failure', {
    reason,
    identifier: identifier ? String(identifier).slice(0, 60) : undefined,
    ip: req.ip,
    ua: req.headers['user-agent']?.slice(0, 120),
  });

const logRegister = (req, userId, role) =>
  log('info', 'auth:register', {
    userId: userId?.toString(),
    role,
    ip: req.ip,
  });

const logTokenInvalid = (req, reason) =>
  log('warn', 'auth:token_invalid', {
    reason,
    ip: req.ip,
    path: req.path,
  });

// ── API errors ────────────────────────────────────────────────────────────────
const logApiError = (req, statusCode, message) => {
  if (statusCode >= 500) {
    log('error', 'api:error', {
      statusCode,
      message,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userId: req.user?._id?.toString(),
    });
  }
};

// ── Security events ───────────────────────────────────────────────────────────
const logIDOR = (req, resource, resourceId) =>
  log('warn', 'security:idor_attempt', {
    resource,
    resourceId: resourceId?.toString(),
    userId: req.user?._id?.toString(),
    role: req.user?.role,
    ip: req.ip,
    path: req.originalUrl,
  });

const logForbidden = (req, reason) =>
  log('warn', 'security:forbidden', {
    reason,
    userId: req.user?._id?.toString(),
    role: req.user?.role,
    ip: req.ip,
    path: req.originalUrl,
  });

const logRateLimit = (req) =>
  log('warn', 'security:rate_limit', {
    ip: req.ip,
    path: req.originalUrl,
    ua: req.headers['user-agent']?.slice(0, 120),
  });

// ── Request audit middleware (attach to sensitive routes) ─────────────────────
const auditMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (res.statusCode >= 400) {
      logApiError(req, res.statusCode, `${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
    }
    // Log unusually slow responses (potential DoS indicator)
    if (ms > 5000) {
      log('warn', 'api:slow_response', {
        method: req.method,
        path: req.originalUrl,
        ms,
        ip: req.ip,
      });
    }
  });
  next();
};

module.exports = {
  logLoginSuccess,
  logLoginFailure,
  logRegister,
  logTokenInvalid,
  logApiError,
  logIDOR,
  logForbidden,
  logRateLimit,
  auditMiddleware,
};
