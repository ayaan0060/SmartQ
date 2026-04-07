const router = require('express').Router();
const ctrl   = require('../controllers/staffPortalController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

// All routes require authentication and 'staff' role
// hospital-admin is also allowed for testing/management purposes
const staffOnly = authorize('staff', 'hospital-admin', 'super-admin');

router.use(protect);

// Tasks
router.get('/tasks',                      staffOnly, ctrl.getMyTasks);
router.patch('/tasks/:id/status',         staffOnly, ctrl.updateTaskStatus);

// Schedule
router.get('/schedule',                   staffOnly, ctrl.getMySchedule);

// Announcements
router.get('/announcements',              authorize('staff', 'nurse', 'receptionist', 'doctor', 'hospital-admin', 'super-admin'), ctrl.getAnnouncements);
router.patch('/announcements/:id/read',   authorize('staff', 'nurse', 'receptionist', 'doctor', 'hospital-admin', 'super-admin'), ctrl.markAnnouncementRead);

module.exports = router;
