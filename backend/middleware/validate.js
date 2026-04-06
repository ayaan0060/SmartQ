/**
 * validate.js — Input validation middleware using express-validator
 * Applied to auth routes and any endpoint accepting user input.
 */
const { body, param, query, validationResult } = require('express-validator');

// ── Run validation and short-circuit on first error ──────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array({ onlyFirstError: true })[0];
    return res.status(400).json({ success: false, message: first.msg });
  }
  next();
};

// ── Reusable field rules ──────────────────────────────────────────────────────
const passwordRules = (field = 'password') =>
  body(field)
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character');

const emailRules = (field = 'email') =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email too long');

const phoneRules = (field = 'phone') =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\+?[\d\s\-(). ]{7,20}$/).withMessage('Enter a valid phone number');

const nameRules = (field = 'name') =>
  body(field)
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
    .matches(/^[a-zA-Z\s'.,-]+$/).withMessage('Name contains invalid characters');

const mongoIdParam = (field = 'id') =>
  param(field).isMongoId().withMessage(`Invalid ${field}`);

// ── Auth validation chains ────────────────────────────────────────────────────
const registerRules = [
  nameRules('name'),
  emailRules('email'),
  phoneRules('phone'),
  passwordRules('password'),
  body().custom((_, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error('Email or phone number is required');
    }
    return true;
  }),
];

const loginRules = [
  body('password').notEmpty().withMessage('Password is required').isLength({ max: 128 }),
  body().custom((_, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error('Email or phone number is required');
    }
    return true;
  }),
];

const registerStaffRules = [
  nameRules('name'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  passwordRules('password'),
];

const updateProfileRules = [
  body('name').optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
    .matches(/^[a-zA-Z\s'.,-]+$/).withMessage('Name contains invalid characters'),
  body('avatar').optional({ nullable: true })
    .isURL({ protocols: ['https'], require_protocol: true }).withMessage('Avatar must be a valid HTTPS URL')
    .isLength({ max: 500 }).withMessage('Avatar URL too long'),
  // Explicitly block privilege escalation fields
  body('role').not().exists().withMessage('Role cannot be changed via this endpoint'),
  body('isActive').not().exists().withMessage('isActive cannot be changed via this endpoint'),
  body('hospitalId').not().exists().withMessage('hospitalId cannot be changed via this endpoint'),
  body('password').not().exists().withMessage('Use the change-password endpoint to update your password'),
];

// ── Booking validation ────────────────────────────────────────────────────────
const bookTokenRules = [
  body('hospitalId').isMongoId().withMessage('Invalid hospitalId'),
  body('serviceId').isMongoId().withMessage('Invalid serviceId'),
];

const bookAppointmentRules = [
  body('hospitalId').isMongoId().withMessage('Invalid hospitalId'),
  body('serviceId').isMongoId().withMessage('Invalid serviceId'),
  body('doctorId').isMongoId().withMessage('Invalid doctorId'),
  body('date').isDate({ format: 'YYYY-MM-DD' }).withMessage('Invalid date format (YYYY-MM-DD)')
    .custom((val) => {
      const d = new Date(val);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (d < today) throw new Error('Appointment date cannot be in the past');
      return true;
    }),
  body('slot').trim().notEmpty().withMessage('Time slot is required')
    .matches(/^\d{2}:\d{2}$/).withMessage('Slot must be in HH:MM format'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
];

const slotsQueryRules = [
  query('doctorId').isMongoId().withMessage('Invalid doctorId'),
  query('date').isDate({ format: 'YYYY-MM-DD' }).withMessage('Invalid date format'),
];

// ── Payment validation ────────────────────────────────────────────────────────
const createOrderRules = [
  body('hospitalId').isMongoId().withMessage('Invalid hospitalId'),
  body('serviceId').isMongoId().withMessage('Invalid serviceId'),
];

const confirmPaymentRules = [
  body('paymentId').isMongoId().withMessage('Invalid paymentId'),
];

// ── Queue validation ──────────────────────────────────────────────────────────
const addTokenRules = [
  body('serviceId').isMongoId().withMessage('Invalid serviceId'),
  body('hospitalId').optional().isMongoId().withMessage('Invalid hospitalId'),
  body('patientType').optional()
    .isIn(['new', 'follow-up', 'emergency', 'standard']).withMessage('Invalid patientType'),
  body('priority').optional()
    .isIn(['normal', 'high', 'emergency']).withMessage('Invalid priority'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
];

const updateTokenRules = [
  mongoIdParam('id'),
  body('status').optional()
    .isIn(['waiting', 'in-progress', 'completed', 'skipped', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional()
    .isIn(['normal', 'high', 'emergency']).withMessage('Invalid priority'),
];

// ── Emergency validation ──────────────────────────────────────────────────────
const emergencyRequestRules = [
  body('hospitalId').isMongoId().withMessage('Invalid hospitalId'),
  body('emergencyType').optional()
    .isIn(['medical', 'accident', 'cardiac', 'respiratory', 'other']).withMessage('Invalid emergencyType'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
  body('patientLocation.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('patientLocation.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

const emergencyStatusRules = [
  mongoIdParam('id'),
  body('status')
    .isIn(['acknowledged', 'en_route', 'arriving', 'arrived', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  registerStaffRules,
  updateProfileRules,
  bookTokenRules,
  bookAppointmentRules,
  slotsQueryRules,
  createOrderRules,
  confirmPaymentRules,
  addTokenRules,
  updateTokenRules,
  emergencyRequestRules,
  emergencyStatusRules,
  mongoIdParam,
  passwordRules,
};
