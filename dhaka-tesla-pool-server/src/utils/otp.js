// ─────────────────────────────────────────────────────────────
// src/utils/otp.js
// OTP generation and cookie/token helpers shared across auth
// and profile flows.
//
// Delivery defaults to console for local development. SMTP and Twilio are
// enabled explicitly through environment variables.
// ─────────────────────────────────────────────────────────────
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const emailProvider = process.env.OTP_EMAIL_PROVIDER || 'console';
const whatsappProvider = process.env.OTP_WHATSAPP_PROVIDER || 'console';
const logOtpValues = process.env.OTP_LOG_VALUES === 'true';

function logOtp(channel, recipient, otp, purpose) {
  if (logOtpValues) console.log(`[OTP][${channel}][${purpose}] → ${recipient} : ${otp}`);
}

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
async function sendEmailOtp(email, otp, purpose = 'verification') {
  if (emailProvider === 'console') {
    logOtp('email', email, otp, purpose);
    return;
  }

  if (emailProvider !== 'smtp') throw new Error(`Unsupported OTP_EMAIL_PROVIDER: ${emailProvider}`);
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing SMTP configuration: ${missing.join(', ')}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Dhaka Tesla Pool ${purpose} OTP`,
    text: `Your Dhaka Tesla Pool OTP is ${otp}. It expires in 15 minutes.`,
  });
}

/**
 * Simulate sending a WhatsApp OTP.
 * In production: replace with a Twilio WhatsApp API call.
 */
async function sendWhatsAppOtp(phone, otp) {
  if (whatsappProvider === 'console') {
    logOtp('whatsapp', phone, otp, 'phone-verification');
    return;
  }

  if (whatsappProvider !== 'twilio') throw new Error(`Unsupported OTP_WHATSAPP_PROVIDER: ${whatsappProvider}`);
  const required = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing Twilio configuration: ${missing.join(', ')}`);

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Your Dhaka Tesla Pool OTP is ${otp}. It expires in 15 minutes.`,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${phone.replace(/^whatsapp:/, '')}`,
  });
}

module.exports = { generateOtp, otpExpiry, sendEmailOtp, sendWhatsAppOtp };
