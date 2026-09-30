// ─────────────────────────────────────────────────────────────
// src/middlewares/validate.js
// Manual validation helpers — no external validator library
// needed; keeps the dependency surface minimal.
// Returns 400 with { message, errors[] } on failure.
// ─────────────────────────────────────────────────────────────

/**
 * Produce a middleware that checks required fields exist and are
 * non-empty strings in req.body.
 * @param {...string} fields
 */
function requireBody(...fields) {
  return (req, res, next) => {
    const errors = [];
    for (const field of fields) {
      const val = req.body[field];
      if (val === undefined || val === null || String(val).trim() === '') {
        errors.push({ field, message: `${field} is required` });
      }
    }
    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    next();
  };
}

/**
 * Validate an email address with a simple RFC 5322-ish pattern.
 * Used inside route-level validation where needed.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

module.exports = { requireBody, isValidEmail };
