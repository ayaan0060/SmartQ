const router = require('express').Router();
const ctrl   = require('../controllers/emergencyController');
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(protect);

// Existing routes — untouched
router.post('/request',                authorize('patient'), ctrl.createRequest);
router.get('/requests',                authorize('hospital-admin', 'staff', 'super-admin'), ctrl.getRequests);
router.patch('/requests/:id/dispatch', authorize('hospital-admin', 'staff'), ctrl.dispatch);
router.patch('/requests/:id/status',   authorize('hospital-admin', 'staff', 'patient'), ctrl.updateStatus);
router.get('/requests/:id/track',      authorize('patient', 'hospital-admin', 'staff'), ctrl.track);

// New routes
router.patch('/requests/:id/cancel',   authorize('patient'), ctrl.cancelRequest);
router.patch('/requests/:id/rate',     authorize('patient'), ctrl.rateRequest);

module.exports = router;
