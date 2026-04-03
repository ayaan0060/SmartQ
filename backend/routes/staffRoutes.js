const router = require('express').Router();
const ctrl = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, tenantFilter } = require('../middleware/rbacMiddleware');

router.use(protect, authorize('super-admin', 'hospital-admin', 'staff'), tenantFilter);

router.get('/', ctrl.getDirectory);
router.post('/', authorize('super-admin', 'hospital-admin'), ctrl.createPersonnel);
router.patch('/:id', authorize('super-admin', 'hospital-admin'), ctrl.updatePersonnel);

module.exports = router;
