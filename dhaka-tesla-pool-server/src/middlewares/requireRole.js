// ─────────────────────────────────────────────────────────────
// src/middlewares/requireRole.js
// Role-based access control factory.
// Usage: router.use(requireRole('DRIVER'))
// ─────────────────────────────────────────────────────────────

/**
 * @param {...string} roles - allowed roles, e.g. 'DRIVER', 'PASSENGER'
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access restricted to: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = requireRole;
