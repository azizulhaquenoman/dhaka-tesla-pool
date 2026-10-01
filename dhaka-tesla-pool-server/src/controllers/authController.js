require('dotenv').config();
const authService = require('../services/authService');
const prisma = require('../prisma/client');
const {
  issueTokenCookie,
  clearTokenCookie,
  issueVerificationCookie,
  clearVerificationCookie,
} = require('../utils/jwt');
const { isValidEmail } = require('../middlewares/validate');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'name is required' });
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Valid email is required' });
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'password must be at least 6 characters' });

    const user = await authService.register({ name: name.trim(), email, password });
    issueVerificationCookie(res, user.id);

    // return full user so frontend sets AuthContext without calling /auth/me
    res.status(201).json({
      message: 'Registration successful. Check your email for the verification OTP.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        phone: user.phone ?? null,
      },
    });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'email and password are required' });

    const user = await authService.login({ email, password });

    if (!user.emailVerified) {
      issueVerificationCookie(res, user.id); // gives cookie so /verify-email works
      return res.status(403).json({
        message: 'Email not verified. Please check your inbox or resend the code.',
      });
    }

    issueTokenCookie(res, { userId: user.id, role: user.role });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        phone: user.phone ?? null,
      },
    });
  } catch (err) { next(err); }
}

function logout(req, res) {
  clearTokenCookie(res);
  res.json({ message: 'Logged out' });
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, phone: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
}

async function verifyEmail(req, res, next) {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'otp is required' });

    await authService.verifyEmail(req.user.id, String(otp));

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, role: true, name: true, email: true, phone: true },
    });

    clearVerificationCookie(res);
    issueTokenCookie(res, { userId: user.id, role: user.role }); // log in immediately
    res.json({ message: 'Email verified successfully', user });
  } catch (err) { next(err); }
}

async function resendVerification(req, res, next) {
  try {
    await authService.resendVerification(req.user.id);
    res.json({ message: 'Verification OTP sent' });
  } catch (err) { next(err); }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });
    await authService.forgotPassword(email);
    res.json({ message: 'If that email is registered, a reset OTP has been sent.' });
  } catch (err) { next(err); }
}

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
  register, login, logout, getMe,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
};