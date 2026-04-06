const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logTokenInvalid } = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      logTokenInvalid(req, err.name === 'TokenExpiredError' ? 'expired' : 'invalid');
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Always re-fetch from DB so deactivated accounts are blocked immediately
    const user = await User.findById(decoded.userId).select('-password').lean();
    if (!user) {
      logTokenInvalid(req, 'user_not_found');
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (!user.isActive) {
      logTokenInvalid(req, 'account_deactivated');
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

module.exports = { protect };
