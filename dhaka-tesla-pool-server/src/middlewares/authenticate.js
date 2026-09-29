// ─────────────────────────────────────────────────────────────
// src/middlewares/authenticate.js
// Reads the JWT from the httpOnly cookie `dtp_token`.
// Never reads from Authorization header — per project spec.
// Attaches req.user = { id, role } on success.
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.cookies?.dtp_token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired or invalid' });
  }
}

module.exports = authenticate;
