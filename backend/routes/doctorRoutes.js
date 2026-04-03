const router = require('express').Router();
const ctrl = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, tenantFilter } = require('../middleware/rbacMiddleware');

router.use(protect, authorize('super-admin', 'hospital-admin', 'staff'), tenantFilter);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authorize('super-admin', 'hospital-admin'), ctrl.create);
router.patch('/:id', authorize('super-admin', 'hospital-admin'), ctrl.update);
router.patch('/:id/availability', authorize('super-admin', 'hospital-admin'), ctrl.toggleAvailability);
router.delete('/:id', authorize('super-admin', 'hospital-admin'), ctrl.remove);

module.exports = router;
