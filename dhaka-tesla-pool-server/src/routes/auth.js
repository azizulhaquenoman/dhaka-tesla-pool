// ─────────────────────────────────────────────────────────────
// src/routes/auth.js
// Auth routes — most are public; verify-email and resend require
// a valid session (user just registered, not yet verified).
// ─────────────────────────────────────────────────────────────
const router       = require('express').Router();
const ctrl         = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');

// Public
router.post('/register',             ctrl.register);
router.post('/login',                ctrl.login);
router.post('/forgot-password',      ctrl.forgotPassword);
router.post('/reset-password',       ctrl.resetPassword);

// Session required (cookie set at registration, before verification)
router.post('/logout',               authenticate, ctrl.logout);
router.get('/me',                    authenticate, ctrl.getMe);
router.post('/verify-email',         authenticate, ctrl.verifyEmail);
router.post('/resend-verification',  authenticate, ctrl.resendVerification);

module.exports = router;
