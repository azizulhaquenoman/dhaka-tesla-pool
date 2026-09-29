// ─────────────────────────────────────────────────────────────
// src/middlewares/errorHandler.js
// Central error handler — must be registered as the LAST
// middleware in app.js (Express identifies it by arity = 4).
//
// Passes Prisma "Known Request Errors" (P2002 = unique
// constraint) as 409 so the client gets a human-readable
// message instead of a raw 500.
// ─────────────────────────────────────────────────────────────
const { Prisma } = require('@prisma/client');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err);

  // Prisma unique constraint violation → 409 Conflict
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] ?? 'field';
      return res.status(409).json({ message: `${field} already in use` });
    }
    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Record not found' });
    }
  }

  // Application errors surfaced with a known status
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Unexpected — don't leak internals
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = errorHandler;
