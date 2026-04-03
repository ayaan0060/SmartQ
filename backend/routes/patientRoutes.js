const router = require('express').Router();
const ctrl   = require('../controllers/patientController');
const { protect }                 = require('../middleware/authMiddleware');
const { authorize, tenantFilter } = require('../middleware/rbacMiddleware');

router.use(protect, authorize('super-admin', 'hospital-admin', 'staff'), tenantFilter);

router.get('/',           ctrl.getAll);
router.get('/:id/visits', ctrl.getVisits);   // ← visit history for one patient
router.get('/:id',        ctrl.getOne);
router.post('/',          ctrl.create);
router.patch('/:id',      ctrl.update);
router.delete('/:id',     authorize('super-admin', 'hospital-admin'), ctrl.remove);

module.exports = router;
