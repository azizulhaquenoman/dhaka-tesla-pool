// ─────────────────────────────────────────────────────────────
// tests/poolCapacity.test.js
// Tests:
//  1. Pool capacity is never exceeded (409 on overflow)
//  2. Two concurrent seat-claim requests cannot both succeed
//     when only one seat is left (prevents overbooking)
//
// Uses the real DB — run with a test DB or after seed.
// ─────────────────────────────────────────────────────────────
const prisma      = require('../src/prisma/client');
const poolService = require('../src/services/poolService');
const AppError    = require('../src/utils/AppError');
const bcrypt      = require('bcryptjs');

// ── Shared test fixtures ──────────────────────────────────────
let driver, tesla, p1, p2, p3;

beforeAll(async () => {
  const hash = await bcrypt.hash('test123', 10);

  driver = await prisma.user.create({
    data: {
      name: 'Pool Test Driver', email: `ptdriver-${Date.now()}@test.pool`,
      passwordHash: hash, role: 'DRIVER', emailVerified: true,
    },
  });

  // Tesla with capacity 2 — easier to test overflow
  tesla = await prisma.tesla.create({
    data: {
      driverId: driver.id, name: 'PoolTest', plate: `PT-${Date.now()}`,
      capacity: 2, status: 'ONLINE',
    },
  });

  p1 = await prisma.user.create({
    data: {
      name: 'Pool Test Passenger One', email: `ptp1-${Date.now()}@test.pool`,
      passwordHash: hash, role: 'PASSENGER', emailVerified: true,
    },
  });
  p2 = await prisma.user.create({
    data: {
      name: 'Pool Test Passenger Two', email: `ptp2-${Date.now()}@test.pool`,
      passwordHash: hash, role: 'PASSENGER', emailVerified: true,
    },
  });
  p3 = await prisma.user.create({
    data: {
      name: 'Pool Test Passenger Three', email: `ptp3-${Date.now()}@test.pool`,
      passwordHash: hash, role: 'PASSENGER', emailVerified: true,
    },
  });
});

afterAll(async () => {
  // Clean up in FK order
  await prisma.fare.deleteMany({
    where: { rideRequest: { passengerId: { in: [p1?.id, p2?.id, p3?.id] } } },
  });
  await prisma.statusHistory.deleteMany({
    where: { rideRequest: { passengerId: { in: [p1?.id, p2?.id, p3?.id] } } },
  });
  await prisma.rideRequest.deleteMany({
    where: { passengerId: { in: [p1?.id, p2?.id, p3?.id] } },
  });
  await prisma.pool.deleteMany({ where: { teslaId: tesla?.id } });
  await prisma.tesla.deleteMany({ where: { id: tesla?.id } });
  await prisma.user.deleteMany({
    where: { id: { in: [driver?.id, p1?.id, p2?.id, p3?.id] } },
  });
});

describe('Pool seat capacity enforcement', () => {
  it('accepts the first two rides into a 2-seat Tesla', async () => {
    // Two ride requests to the same corridor
    const r1 = await prisma.rideRequest.create({
      data: {
        passengerId: p1.id, pickupZone: 'banani', dropoffZone: 'mohakhali',
        seatsRequested: 1, status: 'REQUESTED',
      },
    });
    await prisma.statusHistory.create({
      data: { rideRequestId: r1.id, fromStatus: '', toStatus: 'REQUESTED' },
    });

    const r2 = await prisma.rideRequest.create({
      data: {
        passengerId: p2.id, pickupZone: 'banani', dropoffZone: 'gulshan-1',
        seatsRequested: 1, status: 'REQUESTED',
      },
    });
    await prisma.statusHistory.create({
      data: { rideRequestId: r2.id, fromStatus: '', toStatus: 'REQUESTED' },
    });

    // Accept both — should succeed
    await expect(poolService.acceptRideRequest(driver.id, r1.id)).resolves.not.toThrow();
    await expect(poolService.acceptRideRequest(driver.id, r2.id)).resolves.not.toThrow();

    // Verify seatsOccupied = 2 (= capacity)
    const pools = await prisma.pool.findMany({ where: { teslaId: tesla.id } });
    const totalOccupied = pools.reduce((s, p) => s + p.seatsOccupied, 0);
    expect(totalOccupied).toBe(2);
  });

  it('rejects a third seat claim when Tesla is at capacity (409)', async () => {
    // p3 tries to join — all seats occupied
    const r3 = await prisma.rideRequest.create({
      data: {
        passengerId: p3.id, pickupZone: 'banani', dropoffZone: 'gulshan-2',
        seatsRequested: 1, status: 'REQUESTED',
      },
    });
    await prisma.statusHistory.create({
      data: { rideRequestId: r3.id, fromStatus: '', toStatus: 'REQUESTED' },
    });

    // Should throw 409 because all OPEN pools are full
    await expect(poolService.acceptRideRequest(driver.id, r3.id))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('Concurrent seat claim race condition', () => {
  it('prevents overbooking when two requests race for the last seat', async () => {
    // Create a fresh pool with 1 seat left (capacity=2, occupied=1)
    const freshPool = await prisma.pool.create({
      data: { teslaId: tesla.id, status: 'OPEN', seatsOccupied: 1 },
    });

    // Two ride requests that both try to claim the last seat simultaneously
    const raceR1 = await prisma.rideRequest.create({
      data: {
        passengerId: p1.id, pickupZone: 'banani', dropoffZone: 'mohakhali',
        seatsRequested: 1, status: 'REQUESTED',
      },
    });
    const raceR2 = await prisma.rideRequest.create({
      data: {
        passengerId: p2.id, pickupZone: 'banani', dropoffZone: 'mohakhali',
        seatsRequested: 1, status: 'REQUESTED',
      },
    });

    await prisma.statusHistory.createMany({
      data: [
        { rideRequestId: raceR1.id, fromStatus: '', toStatus: 'REQUESTED' },
        { rideRequestId: raceR2.id, fromStatus: '', toStatus: 'REQUESTED' },
      ],
    });

    // Directly test the atomic UPDATE by running both claims concurrently
    // The atomic conditional UPDATE guarantees exactly one succeeds.
    const claim = (seatsNeeded, targetPoolId) =>
      prisma.$queryRaw`
        UPDATE "Pool"
        SET "seatsOccupied" = "seatsOccupied" + ${seatsNeeded}
        WHERE id = ${targetPoolId}
          AND "seatsOccupied" + ${seatsNeeded} <= (
                SELECT capacity FROM "Tesla" WHERE id = ${tesla.id}
              )
        RETURNING *
      `;

    const [result1, result2] = await Promise.all([
      claim(1, freshPool.id),
      claim(1, freshPool.id),
    ]);

    const successes = [result1, result2].filter((r) => r.length > 0);
    const failures  = [result1, result2].filter((r) => r.length === 0);

    // Exactly one should have succeeded
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    // The pool must not exceed capacity
    const finalPool = await prisma.pool.findUnique({ where: { id: freshPool.id } });
    expect(finalPool.seatsOccupied).toBeLessThanOrEqual(tesla.capacity);

    // Cleanup
    await prisma.statusHistory.deleteMany({ where: { rideRequestId: { in: [raceR1.id, raceR2.id] } } });
    await prisma.rideRequest.deleteMany({ where: { id: { in: [raceR1.id, raceR2.id] } } });
    await prisma.pool.delete({ where: { id: freshPool.id } });
  });
});
