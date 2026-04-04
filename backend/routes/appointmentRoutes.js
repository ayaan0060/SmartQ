const router = require('express').Router();
const ctrl   = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/slots',  ctrl.getSlots);
router.get('/my',     ctrl.getMyAppointments);
router.post('/book',  ctrl.bookAppointment);
router.delete('/:id', ctrl.cancelAppointment);

module.exports = router;
