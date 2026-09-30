// ─────────────────────────────────────────────────────────────
// src/utils/jwt.js
// JWT signing and cookie helpers.
// Token payload: { userId, role }
// Cookie: httpOnly, sameSite=lax, secure=false in dev
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'dtp_token';

/**
 * Sign a JWT and set it as an httpOnly cookie on the response.
 * @param {import('express').Response} res
 * @param {{ userId: string, role: string }} payload
 */
function issueTokenCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    // maxAge mirrors JWT expiry so cookie expires with token
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
}

/**
 * Clear the auth cookie on logout.
 */
function clearTokenCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax' });
}

module.exports = { issueTokenCookie, clearTokenCookie, COOKIE_NAME };
