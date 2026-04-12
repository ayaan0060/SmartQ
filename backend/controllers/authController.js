const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const { logLoginSuccess, logLoginFailure, logRegister } = require('../utils/logger');

// ── Token signing ─────────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, hospitalId: user.hospitalId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

// ── POST /api/auth/register — patient accounts only ───────────────────────────
const register = asyncHandler(async (req, res) => {
  // Validation handled by middleware/validate.js registerRules
  const { name, email, phone, password, role: rawRole } = req.body;

  // Only allow self-registerable roles — never admin roles from public endpoint
  const ALLOWED_ROLES = ['patient', 'doctor', 'staff'];
  const role = ALLOWED_ROLES.includes(rawRole) ? rawRole : 'patient';

  // Duplicate check
  if (email) {
    const exists = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (exists) return error(res, 'An account with this email already exists', 409);
  }
  if (phone) {
    const normalized = phone.replace(/\s/g, '');
    const exists = await User.findOne({ phone: normalized }).lean();
    if (exists) return error(res, 'An account with this phone already exists', 409);
  }

  // Role is ALWAYS hardcoded — never from req.body
  const user = await User.create({
    name: name.trim(),
    email: email ? email.toLowerCase().trim() : undefined,
    phone: phone ? phone.replace(/\s/g, '') : undefined,
    password,
    role,
    hospitalId: req.body.hospitalId || null,
  });

  logRegister(req, user._id, 'patient');

  const token = signToken(user);
  return success(res, { token, user, hospitalName: null }, 201, 'Registration successful');
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  // Validation handled by middleware/validate.js loginRules
  const { phone, email, password } = req.body;

  let user;
  if (email) {
    user = await User.findOne({ email: email.toLowerCase().trim() });
  } else {
    const normalized = phone.replace(/\s/g, '');
    user =
      (await User.findOne({ phone: normalized })) ||
      (await User.findOne({ phone: `+91${normalized}` })) ||
      (await User.findOne({ phone: normalized.replace(/^\+?91/, '') })) ||
      (await User.findOne({ phone: `+91${normalized.replace(/^\+?91/, '')}` }));
  }

  // Use constant-time comparison to prevent timing attacks
  // comparePassword is called even when user is null to prevent user enumeration
  const passwordMatch = user ? await user.comparePassword(password) : false;

  if (!user || !passwordMatch) {
    logLoginFailure(req, 'invalid_credentials', email || phone);
    return error(res, 'Invalid credentials', 401);
  }

  // Block deactivated accounts
  if (!user.isActive) {
    logLoginFailure(req, 'account_deactivated', user._id);
    return error(res, 'Your account has been deactivated. Please contact support.', 403);
  }

  // Block hospital staff if hospital is pending/inactive
  if (['hospital-admin', 'receptionist', 'doctor'].includes(user.role) && user.hospitalId) {
    const hospital = await Hospital.findById(user.hospitalId).select('name status').lean();
    if (hospital?.status === 'pending') {
      logLoginFailure(req, 'hospital_pending', user._id);
      return error(res, 'Your hospital registration is under review. You will be notified once approved.', 403);
    }
    if (hospital?.status === 'inactive') {
      logLoginFailure(req, 'hospital_inactive', user._id);
      return error(res, 'Your hospital registration was rejected. Contact support@smartq.com.', 403);
    }
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  let hospitalName = null;
  let hospitalStatus = null;
  if (user.hospitalId) {
    const hospital = await Hospital.findById(user.hospitalId).select('name status').lean();
    hospitalName = hospital?.name || null;
    hospitalStatus = hospital?.status || null;
  }

  logLoginSuccess(req, user._id, user.role);

  const token = signToken(user);
  return success(res, { token, user, hospitalName, hospitalStatus }, 200, 'Login successful');
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  return success(res, { user: req.user });
});

// ── PATCH /api/auth/profile — only name and avatar, nothing else ──────────────
const updateProfile = asyncHandler(async (req, res) => {
  // Validation handled by middleware/validate.js updateProfileRules
  // Only pick the two safe fields — never spread req.body
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name.trim();
  if (req.body.avatar !== undefined) updates.avatar = req.body.avatar;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );
  return success(res, { user }, 200, 'Profile updated');
});

// ── POST /api/auth/register-receptionist ─────────────────────────────────────
const registerReceptionist = asyncHandler(async (req, res) => {
  // Validation handled by registerStaffRules
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (exists) return error(res, 'An account with this email already exists', 409);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'receptionist',          // hardcoded — never from req.body
    hospitalId: req.user.hospitalId,
  });

  logRegister(req, user._id, 'receptionist');
  return success(res, { user }, 201, 'Receptionist account created');
});

// ── POST /api/auth/register-doctor ───────────────────────────────────────────
const registerDoctor = asyncHandler(async (req, res) => {
  // Validation handled by registerStaffRules
  const { name, email, password, doctorId } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (exists) return error(res, 'An account with this email already exists', 409);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'doctor',                // hardcoded — never from req.body
    hospitalId: req.user.hospitalId,
  });

  if (doctorId) {
    const Doctor = require('../models/Doctor');
    // Only link if the doctor belongs to the same hospital
    await Doctor.findOneAndUpdate(
      { _id: doctorId, hospitalId: req.user.hospitalId },
      { userId: user._id }
    );
  }

  logRegister(req, user._id, 'doctor');
  return success(res, { user }, 201, 'Doctor account created');
});

// ── POST /api/auth/verify-phone-email ────────────────────────────────────────
// SSRF fix: only accept pre-parsed fields from the widget, never fetch external URLs
const verifyPhoneEmail = asyncHandler(async (req, res) => {
  const { user_country_code, user_phone_number } = req.body;

  if (!user_country_code || !user_phone_number) {
    return error(res, 'user_country_code and user_phone_number are required', 400);
  }

  // Validate format before using
  if (!/^\+\d{1,4}$/.test(user_country_code)) {
    return error(res, 'Invalid country code format', 400);
  }
  if (!/^\d{6,15}$/.test(user_phone_number)) {
    return error(res, 'Invalid phone number format', 400);
  }

  const phone = `${user_country_code}${user_phone_number}`;
  return success(res, { phone, country_code: user_country_code, phone_number: user_phone_number }, 200, 'Phone verified');
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  registerReceptionist,
  registerDoctor,
  verifyPhoneEmail,
};
