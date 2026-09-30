// ─────────────────────────────────────────────────────────────
// src/prisma/client.js — singleton Prisma client
//
// Prisma 7 requires an explicit driver adapter — the traditional
// DATABASE_URL-only approach was removed.  We use @prisma/adapter-pg
// with the `pg` Pool so that all Prisma operations share one
// connection pool rather than opening a new connection per request.
//
// Singleton pattern: store on globalThis in dev so hot-reloads
// (nodemon) don't accumulate open connections.
// ─────────────────────────────────────────────────────────────
const { PrismaClient } = require('@prisma/client');
const { PrismaPg }     = require('@prisma/adapter-pg');
const { Pool }         = require('pg');

function createPrismaClient() {
  const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// In development, reuse the client across hot-reloads to avoid
// connection leaks.  In production/test, always create fresh.
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

module.exports = prisma;
