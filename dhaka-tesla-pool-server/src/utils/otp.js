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

  if (whatsappProvider !== 'greenapi') throw new Error(`Unsupported OTP_WHATSAPP_PROVIDER: ${whatsappProvider}`);
  const required = ['GREENAPI_BASE_URL', 'GREENAPI_INSTANCE_ID', 'GREENAPI_API_TOKEN'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing Green API configuration: ${missing.join(', ')}`);

  let normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.startsWith('0')) normalizedPhone = `${process.env.GREENAPI_COUNTRY_CODE || '88'}${normalizedPhone.slice(1)}`;
  if (!normalizedPhone.startsWith(process.env.GREENAPI_COUNTRY_CODE || '88')) normalizedPhone = `${process.env.GREENAPI_COUNTRY_CODE || '88'}${normalizedPhone}`;

  const response = await fetch(
    `${process.env.GREENAPI_BASE_URL}/waInstance${process.env.GREENAPI_INSTANCE_ID}/sendMessage/${process.env.GREENAPI_API_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: `${normalizedPhone}@c.us`,
        message: `Your Dhaka Tesla Pool OTP is ${otp}. It expires in 15 minutes.`,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Green API request failed with status ${response.status}`);
  }
}

module.exports = { generateOtp, otpExpiry, sendEmailOtp, sendWhatsAppOtp };
