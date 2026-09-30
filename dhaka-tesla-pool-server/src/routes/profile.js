// ─────────────────────────────────────────────────────────────
// src/routes/profile.js
// Profile routes — any authenticated user (PASSENGER or DRIVER).
// ─────────────────────────────────────────────────────────────
const router       = require('express').Router();
const ctrl         = require('../controllers/profileController');
const authenticate = require('../middlewares/authenticate');

router.use(authenticate);

router.get('/',                    ctrl.getProfile);
router.patch('/name',              ctrl.updateName);

// Email change — 3-step flow
router.post('/email/request',      ctrl.requestEmailChange);
router.post('/email/verify-current', ctrl.verifyCurrentEmailOtp);
router.post('/email/verify-new',   ctrl.verifyNewEmailOtp);

// Phone — 2-step flow (WhatsApp OTP simulated)
router.post('/phone/request',      ctrl.requestPhoneOtp);
router.post('/phone/verify',       ctrl.verifyPhoneOtp);

module.exports = router;
