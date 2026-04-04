const { body, validationResult } = require('express-validator');

// ── Fake detection patterns ───────────────────────────────────────────────────
const FAKE_NAME_PATTERNS = [
  /^(test|fake|dummy|sample|asdf|qwerty|abc|xyz|foo|bar|baz|hospital123|aaa|bbb|ccc|ddd|eee|fff|ggg|hhh|iii|jjj|kkk|lll|mmm|nnn|ooo|ppp|qqq|rrr|sss|ttt|uuu|vvv|www|xxx|yyy|zzz)/i,
  /(.)(\1){3,}/,           // 4+ repeated chars: "aaaa", "hhhh"
  /^[^a-zA-Z]/,            // starts with non-letter
  /^(.{1,2})$/,            // too short (1-2 chars)
  /^[a-z]{1,3}\d+$/i,      // like "abc123"
  /hospital\s*(1|2|test|demo|fake|sample)/i,
];

const FAKE_LOCATION_PATTERNS = [
  /^(test|fake|dummy|asdf|qwerty|abc|xyz|na|n\/a|none|nowhere|anywhere)/i,
  /(.)(\1){3,}/,
];

const FAKE_ADDRESS_PATTERNS = [
  /^(test|fake|dummy|asdf|qwerty|123\s*main|123\s*street|no address|na|n\/a)/i,
  /(.)(\1){4,}/,
];

const BLACKLISTED_CODES = [
  'TEST','FAKE','DEMO','XXXX','AAAA','ABCD','1234','ASDF',
  'QWER','ZXCV','AAAA','BBBB','CCCC','DDDD','EEEE','FFFF',
  'GGGG','HHHH','IIII','JJJJ','KKKK','LLLL','MMMM','NNNN',
];

const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com','guerrillamail.com','tempmail.com','throwaway.email',
  'yopmail.com','sharklasers.com','trashmail.com','10minutemail.com',
  'maildrop.cc','dispostable.com','getairmail.com','fakeinbox.com',
  'spamgourmet.com','trashmail.me','mailnull.com','spamfree24.org',
  'discard.email','spamhereplease.com','spam4.me','binkmail.com',
];

const FAKE_ADMIN_NAME_PATTERNS = [
  /^(test|fake|admin|user|doctor|staff|asdf|qwerty|abc|xyz|foo|bar)/i,
  /(.)(\1){3,}/,
  /^[^a-zA-Z]/,
];

function isFake(val, patterns) {
  return patterns.some(re => re.test(val?.trim() || ''));
}

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

// Check if name looks like a real hospital (has at least 2 meaningful words OR known keywords)
function isValidHospitalName(name) {
  const trimmed = name.trim();
  // Must have at least 2 words OR contain hospital-related keywords
  const words = trimmed.split(/\s+/).filter(w => w.length > 1);
  const hasKeyword = /(hospital|clinic|medical|health|care|centre|center|institute|nursing|apollo|aiims|fortis|max|manipal|narayana)/i.test(trimmed);
  return words.length >= 2 || hasKeyword;
}

// ── Validation chain ──────────────────────────────────────────────────────────
const hospitalRegistrationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Hospital name is required')
    .isLength({ min: 5, max: 100 }).withMessage('Name must be at least 5 characters')
    .custom((val) => {
      if (isFake(val, FAKE_NAME_PATTERNS)) throw new Error('Hospital name appears to be invalid or test data');
      if (!isValidHospitalName(val)) throw new Error('Please enter a valid hospital name (e.g. "City General Hospital")');
      return true;
    }),

  body('code')
    .trim()
    .notEmpty().withMessage('Short code is required')
    .toUpperCase()
    .matches(/^[A-Z0-9]{2,6}$/).withMessage('Code must be 2–6 uppercase letters/digits')
    .custom((val) => {
      if (BLACKLISTED_CODES.includes(val.toUpperCase())) throw new Error('This code is not allowed');
      return true;
    }),

  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ min: 3, max: 100 }).withMessage('Location must be at least 3 characters')
    .custom((val) => {
      if (isFake(val, FAKE_LOCATION_PATTERNS)) throw new Error('Location appears to be invalid');
      return true;
    }),

  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 15, max: 300 }).withMessage('Please enter a complete address (min 15 characters)')
    .custom((val) => {
      if (isFake(val, FAKE_ADDRESS_PATTERNS)) throw new Error('Address appears to be invalid');
      // Must contain at least one number (street number / pincode)
      if (!/\d/.test(val)) throw new Error('Address must include a street number or pincode');
      return true;
    }),

  body('contact')
    .trim()
    .notEmpty().withMessage('Contact number is required')
    .matches(/^\+?[\d\s\-().]{7,20}$/).withMessage('Enter a valid phone number')
    .custom((val) => {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 7) throw new Error('Phone number must have at least 7 digits');
      // Reject obviously fake numbers like 1234567890, 0000000000, 1111111111
      if (/^(\d)\1{6,}$/.test(digits)) throw new Error('Phone number appears to be invalid');
      if (digits === '1234567890' || digits === '0123456789') throw new Error('Phone number appears to be invalid');
      return true;
    }),

  body('timings')
    .trim()
    .notEmpty().withMessage('Operating hours are required')
    .isLength({ min: 3, max: 100 }).withMessage('Timings must be at least 3 characters'),

  body('adminName')
    .trim()
    .notEmpty().withMessage('Admin name is required')
    .isLength({ min: 3, max: 80 }).withMessage('Name must be at least 3 characters')
    .custom((val) => {
      if (isFake(val, FAKE_ADMIN_NAME_PATTERNS)) throw new Error('Admin name appears to be invalid');
      const words = val.trim().split(/\s+/);
      if (words.length < 2) throw new Error('Please enter your full name (first and last name)');
      return true;
    }),

  body('adminEmail')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail()
    .custom((val) => {
      if (isDisposableEmail(val)) throw new Error('Disposable/temporary email addresses are not allowed. Use your official hospital email.');
      return true;
    }),

  body('adminPassword')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),

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
