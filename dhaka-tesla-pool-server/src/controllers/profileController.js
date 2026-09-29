// ─────────────────────────────────────────────────────────────
// src/controllers/profileController.js
// ─────────────────────────────────────────────────────────────
const profileService = require('../services/profileService');

// GET /api/profile
async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfile(req.user.id);
    res.json(profile);
  } catch (err) { next(err); }
}

// PATCH /api/profile/name
async function updateName(req, res, next) {
  try {
    const { name } = req.body;
    const user = await profileService.updateName(req.user.id, name);
    res.json(user);
  } catch (err) { next(err); }
}

// POST /api/profile/email/request
async function requestEmailChange(req, res, next) {
  try {
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !currentPassword)
      return res.status(400).json({ message: 'newEmail and currentPassword are required' });
    await profileService.requestEmailChange(req.user.id, { newEmail, currentPassword });
    res.json({ message: 'OTP sent to your current email' });
  } catch (err) { next(err); }
}

// POST /api/profile/email/verify-current
async function verifyCurrentEmailOtp(req, res, next) {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'otp is required' });
    await profileService.verifyCurrentEmailOtp(req.user.id, String(otp));
    res.json({ message: 'Current email verified. OTP sent to new email.' });
  } catch (err) { next(err); }
}

// POST /api/profile/email/verify-new
async function verifyNewEmailOtp(req, res, next) {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'otp is required' });
    await profileService.verifyNewEmailOtp(req.user.id, String(otp));
    res.json({ message: 'Email updated successfully' });
  } catch (err) { next(err); }
}

// POST /api/profile/phone/request
async function requestPhoneOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'phone is required' });
    await profileService.requestPhoneOtp(req.user.id, phone);
    res.json({ message: 'WhatsApp OTP sent (simulated — check server logs)' });
  } catch (err) { next(err); }
}

// POST /api/profile/phone/verify
async function verifyPhoneOtp(req, res, next) {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'otp is required' });
    await profileService.verifyPhoneOtp(req.user.id, String(otp));
    res.json({ message: 'Phone verified successfully' });
  } catch (err) { next(err); }
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
