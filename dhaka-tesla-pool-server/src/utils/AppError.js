// ─────────────────────────────────────────────────────────────
// src/utils/AppError.js
// Typed application error — thrown from services/controllers
// and caught by the central error handler to produce the right
// HTTP status without scattering res.status() calls everywhere.
// ─────────────────────────────────────────────────────────────

class AppError extends Error {
  /**
   * @param {string} message - human-readable error
   * @param {number} statusCode - HTTP status (400, 403, 404, 409, …)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

module.exports = AppError;
