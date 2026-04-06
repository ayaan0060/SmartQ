const Payment = require('../models/Payment');
const Token = require('../models/Token');
const Service = require('../models/Service');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');
const { logIDOR } = require('../utils/logger');

// Generate a daily queue number for a given service
const generateQueueNumber = async (hospitalId, serviceId) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found when generating queue number');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await Token.countDocuments({
    hospitalId,
    serviceId,
    createdAt: { $gte: today }
  });

  return `${service.prefix}${count + 1}`;
};

// 1. Create a payment order (dummy — no gateway involved)
exports.createOrder = asyncHandler(async (req, res) => {
  const { hospitalId, serviceId } = req.body;

  if (!hospitalId || !serviceId) {
    return error(res, 'hospitalId and serviceId are required', 400);
  }

  const service = await Service.findById(serviceId);
  if (!service) return error(res, 'Service not found', 404);
  if (!service.isActive) return error(res, 'Service is currently offline', 400);

  const amountInPaise = Math.round(service.price * 100);
  if (amountInPaise <= 0) {
    return error(res, 'Service is free, bypass payment routing', 400);
  }

  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  const payment = await Payment.create({
    orderId,
    amount: service.price,
    currency: 'INR',
    status: 'created',
    userId: req.user._id,
    hospitalId,
    serviceId
  });

  return success(res, {
    paymentId: payment._id,
    orderId: payment.orderId,
    amount: amountInPaise,
    currency: 'INR'
  });
});

// 2. Confirm payment & atomically book the token
exports.confirmPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) return error(res, 'Payment not found', 404);

  // Ownership check — only the user who created the payment can confirm it
  if (payment.userId.toString() !== req.user._id.toString()) {
    logIDOR(req, 'Payment', paymentId);
    return error(res, 'Access denied', 403);
  }

  if (payment.status === 'paid') return success(res, { message: 'Already paid' });

  payment.status = 'paid';
  await payment.save();

  // Generate booking token
  const tokenRecord = await Token.create({
    tokenNumber: await generateQueueNumber(payment.hospitalId, payment.serviceId),
    userId: payment.userId,
    hospitalId: payment.hospitalId,
    serviceId: payment.serviceId,
    status: 'waiting',
    paymentId: payment._id
  });

  return success(res, { token: tokenRecord, payment }, 201);
});

// 3. Process card payment — receives card details, never stores them, books token
exports.processCardPayment = asyncHandler(async (req, res) => {
  const { cardholderName, cardNumber, expiry, cvv, amount, paymentId } = req.body;

  // Basic server-side validation
  if (!cardholderName || !cardNumber || !expiry || !cvv) {
    return error(res, 'All card fields are required', 400);
  }
  if (cardNumber.replace(/\s/g, '').length !== 16) {
    return error(res, 'Invalid card number', 400);
  }

  // CRITICAL: card details are validated here but NEVER saved to the database
  // In production replace this block with your payment gateway SDK call (Stripe, PayU, etc.)

  const payment = await Payment.findById(paymentId);
  if (!payment) return error(res, 'Payment session not found', 404);

  // Ownership check
  if (payment.userId.toString() !== req.user._id.toString()) {
    logIDOR(req, 'Payment', paymentId);
    return error(res, 'Access denied', 403);
  }

  if (payment.status === 'paid') return success(res, { message: 'Already paid' });

  // Mark payment as paid
  payment.status = 'paid';
  await payment.save();

  // Book the token
  const tokenRecord = await Token.create({
    tokenNumber: await generateQueueNumber(payment.hospitalId, payment.serviceId),
    userId: payment.userId,
    hospitalId: payment.hospitalId,
    serviceId: payment.serviceId,
    status: 'waiting',
    paymentId: payment._id,
  });

  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  return success(res, { transactionId, token: tokenRecord, payment }, 201);
});

// 4. Payment history for the logged-in user
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ userId: req.user._id })
    .populate('hospitalId', 'name location')
    .populate('serviceId', 'name')
    .sort({ createdAt: -1 });

  return success(res, payments);
});
