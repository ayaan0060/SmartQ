const { AppError } = require('../utils/asyncHandler');

// Restrict to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

// Auto-inject hospitalId filter for hospital-admin (tenant isolation)
const tenantFilter = (req, res, next) => {
  if (['hospital-admin', 'staff', 'receptionist', 'doctor'].includes(req.user?.role)) {
    req.hospitalFilter = { hospitalId: req.user.hospitalId };
  } else if (req.user?.role === 'super-admin') {
    req.hospitalFilter = {};
  }
  next();
};

// Ensure hospital-admin can only access their own hospital
const ownHospitalOnly = (req, res, next) => {
  if (req.user?.role === 'hospital-admin' || req.user?.role === 'staff') {
    const targetHospitalId = req.params.hospitalId || req.body.hospitalId;
    if (targetHospitalId && targetHospitalId !== req.user.hospitalId?.toString()) {
      return res.status(403).json({ success: false, message: 'Access to this hospital is denied' });
    }
  }
  next();
};

module.exports = { authorize, tenantFilter, ownHospitalOnly };
