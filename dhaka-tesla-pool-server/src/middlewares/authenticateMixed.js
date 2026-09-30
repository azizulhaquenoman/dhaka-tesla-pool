const jwt = require('jsonwebtoken');
const { COOKIE_NAME, VERIFICATION_COOKIE_NAME } = require('../utils/jwt');

// Used only for GET /auth/me so it works after registration
// (dtp_verification) AND after login (dtp_token)
function authenticateMixed(req, res, next) {
    const token = req.cookies?.[COOKIE_NAME] ?? req.cookies?.[VERIFICATION_COOKIE_NAME];
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.userId, role: payload.role ?? null };
        next();
    } catch {
        return res.status(401).json({ message: 'Session expired or invalid' });
    }
}

module.exports = authenticateMixed;