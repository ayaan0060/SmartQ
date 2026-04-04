const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

const signToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role, hospitalId: user.hospitalId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register — creates PATIENT accounts only
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !password || (!email && !phone)) {
    return error(res, 'Name, password, and email or phone are required', 400);
  }

  // Role is ALWAYS hardcoded to 'patient' — never accepted from req.body
  const user = await User.create({ name, email, phone, password, role: 'patient', hospitalId: null });

  const token = signToken(user);
  return success(res, { token, user, hospitalName: null }, 201, 'Registration successful');
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { phone, email, password } = req.body;

  if (!password || (!phone && !email)) {
    return error(res, 'Credentials required', 400);
  }

  const query = email ? { email } : { phone };
  // Normalize phone — try exact match first, then with +91 prefix
  let user;
  if (email) {
    user = await User.findOne({ email });
  } else {
    const normalized = phone.replace(/\s/g, '');
    user = await User.findOne({ phone: normalized }) ||
           await User.findOne({ phone: `+91${normalized}` }) ||
           await User.findOne({ phone: normalized.replace(/^\+?91/, '') }) ||
           await User.findOne({ phone: `+91${normalized.replace(/^\+?91/, '')}` });
  }
  if (!user || !(await user.comparePassword(password))) {
    return error(res, 'Invalid credentials', 401);
  }

  // Block hospital-admin login if their hospital is still pending or rejected
  if (['hospital-admin', 'receptionist', 'doctor'].includes(user.role) && user.hospitalId) {
    const hospital = await Hospital.findById(user.hospitalId).select('name status');
    if (hospital?.status === 'pending') {
      return error(res, 'Your hospital registration is currently under review by our team. You will be notified once approved.', 403);
    }
    if (hospital?.status === 'inactive') {
      return error(res, 'Your hospital registration was rejected. Please contact support@smartq.com for assistance.', 403);
    }
  }

  // Block deactivated accounts (rejected by super-admin)
  if (!user.isActive) {
    return error(res, 'Your account has been deactivated. Please contact support.', 403);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Attach hospital name and status for hospital-admin users
  let hospitalName = null;
  let hospitalStatus = null;
  if (user.hospitalId) {
    const hospital = await Hospital.findById(user.hospitalId).select('name status');
    hospitalName = hospital?.name || null;
    hospitalStatus = hospital?.status || null;
  }

  const token = signToken(user);
  return success(res, { token, user, hospitalName, hospitalStatus }, 200, 'Login successful');
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  return success(res, { user: req.user });
});

// PATCH /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, avatar },
    { new: true, runValidators: true }
  );
  return success(res, { user }, 200, 'Profile updated');
});

// POST /api/auth/register-receptionist — hospital-admin creates receptionist accounts
const registerReceptionist = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return error(res, 'Name, email and password are required', 400);
  if (password.length < 8)
    return error(res, 'Password must be at least 8 characters', 400);

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) return error(res, 'An account with this email already exists', 409);

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    role: 'receptionist',
    hospitalId: req.user.hospitalId,
  });
  return success(res, { user }, 201, 'Receptionist account created');
});

// POST /api/auth/verify-phone-email — verifies Phone.Email user_json_url
const verifyPhoneEmail = asyncHandler(async (req, res) => {
  const { user_json_url, user_country_code, user_phone_number } = req.body;

  // If frontend already has country code and phone number, use them directly
  // Phone.Email sends these in the userObj alongside user_json_url
  if (user_country_code && user_phone_number) {
    const phone = `${user_country_code}${user_phone_number}`;
    console.log('[PhoneEmail] Verified from widget:', phone);
    return success(res, { phone, country_code: user_country_code, phone_number: user_phone_number }, 200, 'Phone verified');
  }

  // Fallback: fetch from user_json_url
  if (!user_json_url) return error(res, 'user_json_url is required', 400);

  console.log('[PhoneEmail] Fetching URL:', user_json_url);
  const axios = require('axios');
  const r = await axios.get(user_json_url, {
    headers: { 'Accept': 'application/json' },
    timeout: 10000,
  });
  console.log('[PhoneEmail] Response:', JSON.stringify(r.data));

  const { user_country_code: cc, user_phone_number: ph } = r.data;
  if (!ph) return error(res, 'Could not retrieve phone number', 400);

  const phone = `${cc}${ph}`;
  return success(res, { phone, country_code: cc, phone_number: ph }, 200, 'Phone verified');
});

// POST /api/auth/register-doctor — hospital-admin creates doctor accounts
const registerDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, doctorId } = req.body;
  if (!name || !email || !password) return error(res, 'Name, email and password are required', 400);
  if (password.length < 8) return error(res, 'Password must be at least 8 characters', 400);

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) return error(res, 'An account with this email already exists', 409);

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    role: 'doctor',
    hospitalId: req.user.hospitalId,
  });

  // Link User to Doctor record if doctorId provided
  if (doctorId) {
    const Doctor = require('../models/Doctor');
    await Doctor.findByIdAndUpdate(doctorId, { userId: user._id });
  }

  return success(res, { user }, 201, 'Doctor account created');
});

module.exports = { register, login, getMe, updateProfile, registerReceptionist, registerDoctor, verifyPhoneEmail };
