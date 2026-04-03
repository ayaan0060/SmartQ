const router = require('express').Router();
const { getStats } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, tenantFilter } = require('../middleware/rbacMiddleware');

router.use(protect, authorize('super-admin', 'hospital-admin', 'staff'), tenantFilter);
router.get('/', getStats);

module.exports = router;
