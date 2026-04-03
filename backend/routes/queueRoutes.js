const router = require('express').Router();
const ctrl   = require('../controllers/queueController');
const { protect }                  = require('../middleware/authMiddleware');
const { authorize, tenantFilter }  = require('../middleware/rbacMiddleware');

// All queue routes require auth + tenant scoping
router.use(protect, tenantFilter);

// Read-only: admin, receptionist, staff, super-admin
router.get('/',                   authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), ctrl.getQueue);
router.get('/history',            authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), ctrl.getHistory);
router.get('/patient/:patientId', authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), ctrl.getPatientVisits);

// Write: receptionist + staff only (not hospital-admin — admin only monitors)
router.post('/',        authorize('super-admin', 'hospital-admin', 'receptionist', 'staff'), ctrl.addToken);
router.patch('/:id',   authorize('receptionist', 'staff'), ctrl.updateToken);
router.delete('/:id',  authorize('receptionist', 'staff'), ctrl.removeToken);

module.exports = router;
