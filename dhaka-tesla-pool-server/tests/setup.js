// ─────────────────────────────────────────────────────────────
// tests/setup.js
// Global test setup loaded before every test suite.
// Disconnects the Prisma singleton after all tests to avoid
// open handle warnings (Jest --detectOpenHandles).
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const prisma = require('../src/prisma/client');

afterAll(async () => {
  await prisma.$disconnect();
});
