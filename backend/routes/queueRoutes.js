const router = require('express').Router();
const ctrl = require('../controllers/queueController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, tenantFilter } = require('../middleware/rbacMiddleware');
const { validate, addTokenRules, updateTokenRules, mongoIdParam } = require('../middleware/validate');

// Public display board — no auth, no PII
router.get('/display/:hospitalId', mongoIdParam('hospitalId'), validate, ctrl.getDisplayQueue);
router.get('/stats/:hospitalId',   mongoIdParam('hospitalId'), validate, ctrl.getHospitalQueueStats);

// All other queue routes require auth + tenant scoping
router.use(protect, tenantFilter);

router.get('/my-status', authorize('patient', 'super-admin', 'hospital-admin', 'staff'), ctrl.getMyQueueStatus);
router.get('/doctor',    authorize('doctor'), ctrl.getDoctorQueue);

router.get('/',                   authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), ctrl.getQueue);
router.get('/history',            authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), ctrl.getHistory);
router.get('/patient/:patientId', authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'),
  mongoIdParam('patientId'), validate, ctrl.getPatientVisits);

router.post('/',      authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), addTokenRules,    validate, ctrl.addToken);
router.patch('/:id',  authorize('receptionist', 'staff', 'doctor'),                        updateTokenRules,  validate, ctrl.updateToken);
router.delete('/:id', authorize('receptionist', 'staff'),                                  mongoIdParam('id'), validate, ctrl.removeToken);

module.exports = router;
