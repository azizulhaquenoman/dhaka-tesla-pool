// ─────────────────────────────────────────────────────────────
// src/services/authService.js
// Business logic for registration, login, OTP flows.
// Controllers stay thin — all DB access and rule enforcement
// live here.
// ─────────────────────────────────────────────────────────────
const bcrypt   = require('bcryptjs');
const prisma   = require('../prisma/client');
const AppError = require('../utils/AppError');
const { generateOtp, otpExpiry, sendEmailOtp } = require('../utils/otp');

// ── Register ──────────────────────────────────────────────────
async function register({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const otp          = generateOtp();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      emailVerificationOtp:       otp,
      emailVerificationOtpExpiry: otpExpiry(),
    },
  });

  sendEmailOtp(email, otp, 'email-verification');
  return user;
}

// ── Login ─────────────────────────────────────────────────────
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError('Invalid credentials', 401);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new AppError('Invalid credentials', 401);

  // Email must be verified before first login
  if (!user.emailVerified) {
    throw new AppError('Email not verified', 403);
  }

  return user;
}

// ── Verify email (OTP from registration) ─────────────────────
async function verifyEmail(userId, otp) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (user.emailVerified) {
    throw new AppError('Email already verified', 400);
  }
  if (!user.emailVerificationOtp || user.emailVerificationOtp !== otp) {
    throw new AppError('Invalid OTP', 400);
  }
  if (new Date() > new Date(user.emailVerificationOtpExpiry)) {
    throw new AppError('OTP expired', 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified:              true,
      emailVerificationOtp:       null,
      emailVerificationOtpExpiry: null,
    },
  });
}

// ── Resend verification OTP ───────────────────────────────────
async function resendVerification(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  if (user.emailVerified) throw new AppError('Email already verified', 400);

  const otp = generateOtp();
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationOtp:       otp,
      emailVerificationOtpExpiry: otpExpiry(),
    },
  });
  sendEmailOtp(user.email, otp, 'email-verification');
}

// ── Forgot password — send OTP ────────────────────────────────
async function forgotPassword(email) {
  // Always respond 200 — don't reveal whether email exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silent no-op

  const otp = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetOtp:       otp,
      passwordResetOtpExpiry: otpExpiry(),
    },
  });
  sendEmailOtp(email, otp, 'password-reset');
}

// ── Reset password ────────────────────────────────────────────
async function resetPassword({ email, otp, newPassword }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid request', 400);

  if (!user.passwordResetOtp || user.passwordResetOtp !== otp) {
    throw new AppError('Invalid OTP', 400);
  }
  if (new Date() > new Date(user.passwordResetOtpExpiry)) {
    throw new AppError('OTP expired', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetOtp:       null,
      passwordResetOtpExpiry: null,
    },
  });
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
