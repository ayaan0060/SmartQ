const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/hospitalController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, tenantFilter } = require('../middleware/rbacMiddleware');
const { hospitalRegistrationRules, handleValidationErrors } = require('../middleware/validateHospital');

// Strict limiter: max 5 in prod, 100 in dev
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 100,
  message: { success: false, message: 'Too many registration attempts. Please try again in 1 hour.' },
});

// ── Public route (needed by Register page) — optionally attach user if token present ──
router.get('/', (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
      req.user = decoded;
    } catch (_) { /* invalid token — treat as public */ }
  }
  next();
}, ctrl.getAll);

// ── Public hospital + admin registration (rate-limited + validated) ──
router.post('/register', registerLimiter, hospitalRegistrationRules, handleValidationErrors, ctrl.registerWithAdmin);

// ── All routes below require authentication ──
router.use(protect);

// Create hospital only (super-admin only, no admin account created)
router.post('/', authorize('super-admin'), ctrl.create);

// Hospital sub-resources (detail, drill-down)
router.get('/:id',          tenantFilter, ctrl.getOne);
router.get('/:id/stats',    ctrl.getStats);
router.get('/:id/doctors',  ctrl.getHospitalDoctors);
router.get('/:id/patients', ctrl.getHospitalPatients);
router.get('/:id/queue',    ctrl.getHospitalQueue);

// Mutations
router.patch('/:id',         authorize('super-admin', 'hospital-admin'), ctrl.update);
router.patch('/:id/approve', authorize('super-admin'), ctrl.approve);
router.patch('/:id/reject',  authorize('super-admin'), ctrl.reject);
router.delete('/:id',        authorize('super-admin'), ctrl.remove);

module.exports = router;
