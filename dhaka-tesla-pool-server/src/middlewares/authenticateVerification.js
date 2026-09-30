const jwt = require('jsonwebtoken');
const { VERIFICATION_COOKIE_NAME } = require('../utils/jwt');

function authenticateVerification(req, res, next) {
  const token = req.cookies?.[VERIFICATION_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: 'Email verification session required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== 'email-verification' || !payload.userId) {
      throw new Error('Invalid verification token');
    }
    req.user = { id: payload.userId };
    next();
  } catch {
    return res.status(401).json({ message: 'Verification session expired or invalid' });
  }
}

module.exports = authenticateVerification;