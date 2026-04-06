const { logApiError } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired'; }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') { statusCode = 400; message = `Invalid ${err.path}`; }

  // Log 5xx errors
  if (statusCode >= 500) {
    logApiError(req, statusCode, err.message);
    // In production never expose internal error details
    if (process.env.NODE_ENV === 'production') {
      message = 'An unexpected error occurred. Please try again later.';
    }
  }

  const body = { success: false, message };

  // Only attach stack in development
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

module.exports = { errorHandler };
