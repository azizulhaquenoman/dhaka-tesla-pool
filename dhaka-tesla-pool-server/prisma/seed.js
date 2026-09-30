// ─────────────────────────────────────────────────────────────
// prisma/seed.js
// Seed Dhaka Tesla Pool with the story cast.
//
// Run: npm run prisma:seed   (or: node prisma/seed.js)
//
// Story cast:
//   Driver : Jashim  (jashim@tesla.pool  / jashim123)
//             Tesla "Bullet", plate DTP-001, capacity 3
//   Passenger 1: passenger at nusrat@tesla.pool  / nusrat123
//   Passenger 2: passenger at rafiq@tesla.pool   / rafiq123
//   Passenger 3: passenger at shirin@tesla.pool  / shirin123
//
// All accounts are email-verified so they can login immediately.
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱  Seeding Dhaka Tesla Pool …');

  // ── Hash passwords ──────────────────────────────────────────
  const [
    driverHash,
    p1Hash,
    p2Hash,
    p3Hash,
  ] = await Promise.all([
    bcrypt.hash('jashim123', 12),
    bcrypt.hash('nusrat123', 12),
    bcrypt.hash('rafiq123', 12),
    bcrypt.hash('shirin123', 12),
  ]);

  // ── Driver — Jashim ────────────────────────────────────────
  const driver = await prisma.user.upsert({
    where: { email: 'jashim@tesla.pool' },
    update: {},
    create: {
      name: 'Jashim',
      email: 'jashim@tesla.pool',
      passwordHash: driverHash,
      role: 'DRIVER',
      emailVerified: true,
    },
  });
  console.log(`  ✓ Driver: ${driver.name} (${driver.email})`);

  // ── Tesla "Bullet" — assigned to Jashim ────────────────────
  const bullet = await prisma.tesla.upsert({
    where: { driverId: driver.id },
    update: {},
    create: {
      driverId: driver.id,
      name: 'Bullet',
      plate: 'DTP-001',
      capacity: 3,
      status: 'OFFLINE',
    },
  });
  console.log(`  ✓ Tesla: "${bullet.name}" (${bullet.plate}), capacity ${bullet.capacity}`);

  // ── Passenger 1 ────────────────────────────────────────────
  const p1 = await prisma.user.upsert({
    where: { email: 'nusrat@tesla.pool' },
    update: {},
    create: {
      name: 'Nusrat',
      email: 'nusrat@tesla.pool',
      passwordHash: p1Hash,
      role: 'PASSENGER',
      emailVerified: true,
    },
  });
  console.log(`  ✓ Passenger: ${p1.name} (${p1.email})`);

  // ── Passenger 2 ────────────────────────────────────────────
  const p2 = await prisma.user.upsert({
    where: { email: 'rafiq@tesla.pool' },
    update: {},
    create: {
      name: 'Rafiq',
      email: 'rafiq@tesla.pool',
      passwordHash: p2Hash,
      role: 'PASSENGER',
      emailVerified: true,
    },
  });
  console.log(`  ✓ Passenger: ${p2.name} (${p2.email})`);

  // ── Passenger 3 — concurrency test case ────────────────────
  const p3 = await prisma.user.upsert({
    where: { email: 'shirin@tesla.pool' },
    update: {},
    create: {
      name: 'Shirin',
      email: 'shirin@tesla.pool',
      passwordHash: p3Hash,
      role: 'PASSENGER',
      emailVerified: true,
    },
  });
  console.log(`  ✓ Passenger: ${p3.name} (${p3.email})`);

  console.log('\n✅  Seed complete.\n');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
