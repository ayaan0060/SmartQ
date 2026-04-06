const router = require('express').Router();
const ctrl = require('../controllers/emergencyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { validate, emergencyRequestRules, emergencyStatusRules, mongoIdParam } = require('../middleware/validate');

router.use(protect);

router.post('/request',
  authorize('patient'),
  emergencyRequestRules, validate,
  ctrl.createRequest
);

router.get('/requests',
  authorize('hospital-admin', 'staff', 'super-admin'),
  ctrl.getRequests
);

router.patch('/requests/:id/dispatch',
  authorize('hospital-admin', 'staff'),
  mongoIdParam('id'), validate,
  ctrl.dispatch
);

// Status updates: hospital staff set operational statuses; patients can only cancel
router.patch('/requests/:id/status',
  authorize('hospital-admin', 'staff', 'super-admin'),
  emergencyStatusRules, validate,
  ctrl.updateStatus
);

router.get('/requests/:id/track',
  authorize('patient', 'hospital-admin', 'staff'),
  mongoIdParam('id'), validate,
  ctrl.track
);

router.patch('/requests/:id/cancel',
  authorize('patient'),
  mongoIdParam('id'), validate,
  ctrl.cancelRequest
);

router.patch('/requests/:id/rate',
  authorize('patient'),
  mongoIdParam('id'), validate,
  ctrl.rateRequest
);

module.exports = router;
