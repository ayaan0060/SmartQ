const router = require('express').Router();
const ctrl   = require('../controllers/queueController');
const { protect }                  = require('../middleware/authMiddleware');
const { authorize, tenantFilter }  = require('../middleware/rbacMiddleware');

// Public display board — no auth
router.get('/display/:hospitalId', ctrl.getDisplayQueue);
router.get('/stats/:hospitalId',   ctrl.getHospitalQueueStats);

// All other queue routes require auth + tenant scoping
router.use(protect, tenantFilter);

// Patient's own queue status
router.get('/my-status', authorize('patient', 'super-admin', 'hospital-admin', 'staff'), ctrl.getMyQueueStatus);

// Doctor's own queue
router.get('/doctor', authorize('doctor'), ctrl.getDoctorQueue);

// Read-only: admin, receptionist, staff, super-admin
router.get('/',                   authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), ctrl.getQueue);
router.get('/history',            authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), ctrl.getHistory);
router.get('/patient/:patientId', authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), ctrl.getPatientVisits);

// Write: receptionist + staff only
router.post('/',        authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), ctrl.addToken);
router.patch('/:id',   authorize('receptionist', 'staff', 'doctor'), ctrl.updateToken);
router.delete('/:id',  authorize('receptionist', 'staff'), ctrl.removeToken);

module.exports = router;
