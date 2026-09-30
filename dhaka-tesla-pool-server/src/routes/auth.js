// ─────────────────────────────────────────────────────────────
// src/routes/auth.js
// Auth routes — most are public; verify-email and resend require
// a valid session (user just registered, not yet verified).
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const ctrl = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');
const authenticateMixed = require('../middlewares/authenticateMixed');      // ADD
const authenticateVerification = require('../middlewares/authenticateVerification');

// Public
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

// Session required (cookie set at registration, before verification)
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticateMixed, ctrl.getMe);         // CHANGED
router.post('/verify-email', authenticateVerification, ctrl.verifyEmail);
router.post('/resend-verification', authenticateVerification, ctrl.resendVerification);

module.exports = router;
