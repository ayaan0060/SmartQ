const router = require('express').Router();
const {
  register, login, getMe, updateProfile,
  registerReceptionist, registerDoctor, verifyPhoneEmail,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const {
  validate,
  registerRules,
  loginRules,
  registerStaffRules,
  updateProfileRules,
} = require('../middleware/validate');

router.post('/register',              registerRules,      validate, register);
router.post('/login',                 loginRules,         validate, login);
router.post('/verify-phone-email',    verifyPhoneEmail);
router.get('/me',                     protect, getMe);
router.patch('/profile',              protect, updateProfileRules, validate, updateProfile);
router.post('/register-receptionist', protect, authorize('hospital-admin'), registerStaffRules, validate, registerReceptionist);
router.post('/register-doctor',       protect, authorize('hospital-admin'), registerStaffRules, validate, registerDoctor);

module.exports = router;
