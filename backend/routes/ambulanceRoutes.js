const router  = require('express').Router();
const ctrl    = require('../controllers/ambulanceController');
const { protect }    = require('../middleware/authMiddleware');
const { authorize }  = require('../middleware/rbacMiddleware');

router.use(protect);

router.get('/',           authorize('hospital-admin', 'staff', 'super-admin'), ctrl.getAll);
router.post('/',          authorize('hospital-admin'), ctrl.create);
router.put('/:id',        authorize('hospital-admin'), ctrl.update);
router.delete('/:id',     authorize('hospital-admin'), ctrl.remove);
router.patch('/:id/location', authorize('hospital-admin', 'staff'), ctrl.updateLocation);

module.exports = router;
