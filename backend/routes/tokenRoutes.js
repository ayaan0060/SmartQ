const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware');

// Legacy routes kept for backward compat
router.get('/history', protect, tokenController.getUserTokens);
router.post('/book', protect, tokenController.bookToken);
router.get('/status/:hospitalId/:serviceId', tokenController.getQueueStatus);
router.get('/:id', tokenController.getTokenById);
router.patch('/:tokenId', protect, tokenController.updateTokenStatus);

module.exports = router;
