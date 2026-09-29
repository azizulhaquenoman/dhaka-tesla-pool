// ─────────────────────────────────────────────────────────────
// src/utils/otp.js
// OTP generation and cookie/token helpers shared across auth
// and profile flows.
//
// For MVP: OTPs are logged to console rather than emailed.
// Real email/WhatsApp delivery is out of scope — the comment
// below marks where a Nodemailer/Twilio call would go.
// ─────────────────────────────────────────────────────────────
const crypto = require('crypto');

/** Generate a 6-digit numeric OTP as a string (e.g. "048321") */
function generateOtp() {
  // Use 6 digits — range 100000–999999 to avoid leading-zero
  // confusion when stored as a string.
  return String(Math.floor(100000 + crypto.randomInt(900000)));
}

/** OTP validity window: 15 minutes from now */
function otpExpiry() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 15);
  return d;
}

/**
 * Simulate sending an email OTP.
 * In production: replace this with a Nodemailer / SendGrid call.
 */
function sendEmailOtp(email, otp, purpose = 'verification') {
  // MVP: log instead of send
  console.log(`[OTP][${purpose}] → ${email} : ${otp}`);
}

/**
 * Simulate sending a WhatsApp OTP.
 * In production: replace with a Twilio WhatsApp API call.
 */
function sendWhatsAppOtp(phone, otp) {
  console.log(`[OTP][whatsapp] → ${phone} : ${otp}`);
}

module.exports = { generateOtp, otpExpiry, sendEmailOtp, sendWhatsAppOtp };
