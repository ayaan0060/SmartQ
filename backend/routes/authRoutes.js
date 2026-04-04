const router = require('express').Router();
const { register, login, getMe, updateProfile, registerReceptionist, registerDoctor, verifyPhoneEmail } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-phone-email', verifyPhoneEmail);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.post('/register-receptionist', protect, authorize('hospital-admin'), registerReceptionist);
router.post('/register-doctor', protect, authorize('hospital-admin'), registerDoctor);

module.exports = router;
