const router = require('express').Router();
const ctrl = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { validate, bookAppointmentRules, slotsQueryRules, mongoIdParam } = require('../middleware/validate');

router.use(protect);

router.get('/slots',  slotsQueryRules,       validate, ctrl.getSlots);
router.get('/my',                                      ctrl.getMyAppointments);
router.post('/book',  bookAppointmentRules,  validate, ctrl.bookAppointment);
router.delete('/:id', mongoIdParam('id'),    validate, ctrl.cancelAppointment);

module.exports = router;
