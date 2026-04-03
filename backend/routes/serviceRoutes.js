const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.post('/', protect, authorize('hospital-admin', 'super-admin'), serviceController.createService);
router.get('/:hospitalId', serviceController.getServicesByHospital);
router.put('/:id', protect, authorize('hospital-admin', 'super-admin'), serviceController.updateService);
router.delete('/:id', protect, authorize('hospital-admin', 'super-admin'), serviceController.deleteService);

module.exports = router;
