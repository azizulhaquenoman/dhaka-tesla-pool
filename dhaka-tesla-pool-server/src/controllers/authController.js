// ─────────────────────────────────────────────────────────────
// src/controllers/authController.js
// Thin request/response layer — delegates all logic to authService.
// ─────────────────────────────────────────────────────────────
const authService               = require('../services/authService');
const { issueTokenCookie, clearTokenCookie } = require('../utils/jwt');
const { isValidEmail }          = require('../middlewares/validate');

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim())           return res.status(400).json({ message: 'name is required' });
    if (!isValidEmail(email))    return res.status(400).json({ message: 'Valid email is required' });
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'password must be at least 6 characters' });

    const user = await authService.register({ name: name.trim(), email, password });
    res.status(201).json({
      message: 'Registration successful. Check your email for the verification OTP.',
      userId:  user.id,
    });
  } catch (err) { next(err); }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'email and password are required' });

    const user = await authService.login({ email, password });
    issueTokenCookie(res, { userId: user.id, role: user.role });

    res.json({
      user: {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        role:          user.role,
        emailVerified: user.emailVerified,
        phone:         user.phone,
      },
    });
  } catch (err) { next(err); }
}

// POST /api/auth/logout
function logout(req, res) {
  clearTokenCookie(res);
  res.json({ message: 'Logged out' });
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const prisma = require('../prisma/client');
    const user   = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, phone: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
}

// POST /api/auth/verify-email
async function verifyEmail(req, res, next) {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'otp is required' });
    await authService.verifyEmail(req.user.id, String(otp));
    res.json({ message: 'Email verified successfully' });
  } catch (err) { next(err); }
}

// POST /api/auth/resend-verification
async function resendVerification(req, res, next) {
  try {
    await authService.resendVerification(req.user.id);
    res.json({ message: 'Verification OTP sent' });
  } catch (err) { next(err); }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });
    await authService.forgotPassword(email);
    // Always 200 — don't reveal whether email exists
    res.json({ message: 'If that email is registered, a reset OTP has been sent.' });
  } catch (err) { next(err); }
}

// POST /api/auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'email, otp, and newPassword are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'newPassword must be at least 6 characters' });
    await authService.resetPassword({ email, otp: String(otp), newPassword });
    res.json({ message: 'Password reset successful' });
  } catch (err) { next(err); }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
