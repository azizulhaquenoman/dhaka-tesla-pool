// ─────────────────────────────────────────────────────────────
// src/services/profileService.js
// Profile update logic — name, email change (3-step), phone (2-step).
// ─────────────────────────────────────────────────────────────
const bcrypt   = require('bcryptjs');
const prisma   = require('../prisma/client');
const AppError = require('../utils/AppError');
const { generateOtp, otpExpiry, sendEmailOtp, sendWhatsAppOtp } = require('../utils/otp');

// ── Get full profile ──────────────────────────────────────────
async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      id:            true,
      name:          true,
      email:         true,
      role:          true,
      emailVerified: true,
      phone:         true,
      phoneVerified: true,
      createdAt:     true,
    },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

// ── Update name ───────────────────────────────────────────────
async function updateName(userId, name) {
  if (!name || name.trim() === '') throw new AppError('Name is required', 400);
  return prisma.user.update({
    where: { id: userId },
    data:  { name: name.trim() },
    select: { id: true, name: true, email: true, role: true, emailVerified: true, phone: true },
  });
}

// ── Email change step 1: request ──────────────────────────────
// Verify current password, store pending email, send OTP to CURRENT email.
async function requestEmailChange(userId, { newEmail, currentPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) throw new AppError('Incorrect password', 403);

  const taken = await prisma.user.findUnique({ where: { email: newEmail } });
  if (taken) throw new AppError('Email already in use', 409);

  const otp = generateOtp();
  await prisma.user.update({
    where: { id: userId },
    data:  {
      pendingEmail:                newEmail,
      currentEmailChangeOtp:       otp,
      currentEmailChangeOtpExpiry: otpExpiry(),
    },
  });
  await sendEmailOtp(user.email, otp, 'current-email-change-verify');
}

// ── Email change step 2: verify current email OTP ─────────────
async function verifyCurrentEmailOtp(userId, otp) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (!user.currentEmailChangeOtp || user.currentEmailChangeOtp !== otp) {
    throw new AppError('Invalid OTP', 400);
  }
  if (new Date() > new Date(user.currentEmailChangeOtpExpiry)) {
    throw new AppError('OTP expired', 400);
  }

  // Send OTP to new (pending) email
  const newOtp = generateOtp();
  await prisma.user.update({
    where: { id: userId },
    data:  {
      currentEmailChangeOtp:       null,
      currentEmailChangeOtpExpiry: null,
      newEmailOtp:                 newOtp,
      newEmailOtpExpiry:           otpExpiry(),
    },
  });
  await sendEmailOtp(user.pendingEmail, newOtp, 'new-email-change-verify');
}

// ── Email change step 3: verify new email OTP → commit change ─
async function verifyNewEmailOtp(userId, otp) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (!user.newEmailOtp || user.newEmailOtp !== otp) {
    throw new AppError('Invalid OTP', 400);
  }
  if (new Date() > new Date(user.newEmailOtpExpiry)) {
    throw new AppError('OTP expired', 400);
  }
  if (!user.pendingEmail) throw new AppError('No pending email change', 400);

  await prisma.user.update({
    where: { id: userId },
    data:  {
      email:            user.pendingEmail,
      pendingEmail:     null,
      newEmailOtp:      null,
      newEmailOtpExpiry: null,
    },
  });
}

// ── Phone step 1: request OTP ─────────────────────────────────
async function requestPhoneOtp(userId, phone) {
  if (!phone) throw new AppError('Phone number is required', 400);

  const taken = await prisma.user.findFirst({ where: { phone, NOT: { id: userId } } });
  if (taken) throw new AppError('Phone number already in use', 409);

  const otp = generateOtp();
  await prisma.user.update({
    where: { id: userId },
    data:  {
      phone,
      phoneVerified:              false,
      phoneVerificationOtp:       otp,
      phoneVerificationOtpExpiry: otpExpiry(),
    },
  });
  await sendWhatsAppOtp(phone, otp);
}

// ── Phone step 2: verify OTP ───────────────────────────────────
async function verifyPhoneOtp(userId, otp) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (!user.phoneVerificationOtp || user.phoneVerificationOtp !== otp) {
    throw new AppError('Invalid OTP', 400);
  }
  if (new Date() > new Date(user.phoneVerificationOtpExpiry)) {
    throw new AppError('OTP expired', 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data:  {
      phoneVerified:              true,
      phoneVerificationOtp:       null,
      phoneVerificationOtpExpiry: null,
    },
  });
}

module.exports = {
  getProfile,
  updateName,
  requestEmailChange,
  verifyCurrentEmailOtp,
  verifyNewEmailOtp,
  requestPhoneOtp,
  verifyPhoneOtp,
};
