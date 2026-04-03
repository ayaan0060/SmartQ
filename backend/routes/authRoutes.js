const router = require('express').Router();
const { register, login, getMe, updateProfile, registerReceptionist } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.post('/register-receptionist', protect, authorize('hospital-admin'), registerReceptionist);

module.exports = router;
