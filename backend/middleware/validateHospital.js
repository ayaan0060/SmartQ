const { body, validationResult } = require('express-validator');

// ── Suspicious pattern detectors ─────────────────────────────────────────────
const FAKE_NAME_PATTERNS = [
  /^(test|fake|dummy|sample|asdf|qwerty|abc|xyz|foo|bar|hospital123|aaa+|bbb+)/i,
  /(.)\1{4,}/,          // 5+ repeated chars: "aaaaa", "hhhhh"
  /^[^a-zA-Z]/,         // starts with non-letter
];

const BLACKLISTED_CODES = ['TEST', 'FAKE', 'DEMO', 'XXXX', 'AAAA', 'ABCD', '1234', 'ASDF'];

const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'trashmail.com', '10minutemail.com',
  'maildrop.cc', 'dispostable.com',
];

function isFakeName(name) {
  return FAKE_NAME_PATTERNS.some((re) => re.test(name.trim()));
}

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

// ── Validation chain ──────────────────────────────────────────────────────────
const hospitalRegistrationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Hospital name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be 3–100 characters')
    .custom((val) => {
      if (isFakeName(val)) throw new Error('Hospital name appears to be invalid or test data');
      return true;
    }),

  body('code')
    .trim()
    .notEmpty().withMessage('Short code is required')
    .toUpperCase()
    .matches(/^[A-Z0-9]{2,6}$/).withMessage('Code must be 2–6 uppercase letters/digits')
    .custom((val) => {
      if (BLACKLISTED_CODES.includes(val)) throw new Error('This code is not allowed');
      return true;
    }),

  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ min: 3, max: 100 }).withMessage('Location must be 3–100 characters'),

  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 10, max: 300 }).withMessage('Please enter a full address (min 10 characters)'),

  body('contact')
    .trim()
    .notEmpty().withMessage('Contact number is required')
    .matches(/^\+?[\d\s\-().]{7,20}$/).withMessage('Enter a valid phone number'),

  body('timings')
    .trim()
    .notEmpty().withMessage('Operating hours are required')
    .isLength({ min: 3, max: 100 }).withMessage('Timings must be 3–100 characters'),

  body('adminName')
    .trim()
    .notEmpty().withMessage('Admin name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),

  body('adminEmail')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail()
    .custom((val) => {
      if (isDisposableEmail(val)) throw new Error('Disposable email addresses are not allowed');
      return true;
    }),

  body('adminPassword')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('confirmPassword')
    .custom((val, { req }) => {
      if (val !== req.body.adminPassword) throw new Error('Passwords do not match');
      return true;
    }),
];

// ── Middleware that runs after the chain ──────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(400).json({ success: false, message: first.msg, errors: errors.array() });
  }
  next();
};

module.exports = { hospitalRegistrationRules, handleValidationErrors };
