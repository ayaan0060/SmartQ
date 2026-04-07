const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',                    ctrl.getNotifications);
router.patch('/read-all',          ctrl.markAllRead);
router.patch('/:id/read',          ctrl.markRead);

module.exports = router;
