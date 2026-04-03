const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, paymentController.createOrder);
router.post('/card',         protect, paymentController.processCardPayment);
router.post('/confirm',      protect, paymentController.confirmPayment);
router.get('/history',       protect, paymentController.getPaymentHistory);

module.exports = router;
