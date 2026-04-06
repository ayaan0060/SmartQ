const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { validate, createOrderRules, confirmPaymentRules } = require('../middleware/validate');

router.use(protect);

router.post('/create-order', createOrderRules,   validate, paymentController.createOrder);
router.post('/card',         confirmPaymentRules, validate, paymentController.processCardPayment);
router.post('/confirm',      confirmPaymentRules, validate, paymentController.confirmPayment);
router.get('/history',                                      paymentController.getPaymentHistory);

module.exports = router;
