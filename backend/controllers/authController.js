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
  const user = await User.findOne(query);
  if (!user || !(await user.comparePassword(password))) {
    return error(res, 'Invalid credentials', 401);
  }

  if (!user.isActive) {
    return error(res, 'Account is deactivated', 403);
  }

  // Block hospital-admin login if their hospital is still pending
  if (['hospital-admin', 'receptionist'].includes(user.role) && user.hospitalId) {
    const hospital = await Hospital.findById(user.hospitalId).select('name status');
    if (hospital?.status === 'pending') {
      return error(res, 'Your hospital registration is under review.', 403);
    }
    if (hospital?.status === 'inactive') {
      return error(res, 'Your hospital registration was rejected. Please contact support.', 403);
    }
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Attach hospital name for hospital-admin users
  let hospitalName = null;
  if (user.hospitalId) {
    const hospital = await Hospital.findById(user.hospitalId).select('name');
    hospitalName = hospital?.name || null;
  }

  const token = signToken(user);
  return success(res, { token, user, hospitalName }, 200, 'Login successful');
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

module.exports = { register, login, getMe, updateProfile, registerReceptionist };
