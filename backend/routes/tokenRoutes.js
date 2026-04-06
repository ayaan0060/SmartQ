const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { validate, bookTokenRules, mongoIdParam } = require('../middleware/validate');

// All token routes require authentication
router.use(protect);

router.get('/history',                                                    tokenController.getUserTokens);
router.post('/book',                   bookTokenRules, validate,          tokenController.bookToken);
router.get('/status/:hospitalId/:serviceId',                              tokenController.getQueueStatus);
router.get('/:id',                     mongoIdParam('id'), validate,      tokenController.getTokenById);
router.patch('/:tokenId',
  authorize('receptionist', 'staff', 'hospital-admin', 'super-admin', 'patient'),
  mongoIdParam('tokenId'), validate,
  tokenController.updateTokenStatus
);

module.exports = router;
