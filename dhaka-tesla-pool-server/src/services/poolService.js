// ─────────────────────────────────────────────────────────────
// src/services/poolService.js
// Core pooling and driver logic.
//
// SEAT CLAIM RACE CONDITION — DESIGN DECISION:
// When two passengers simultaneously try to claim the last seat,
// a naive "SELECT … check … UPDATE" (check-then-write) has a
// TOCTOU window where both reads see seats available and both
// writes succeed, overbooking the vehicle.
//
// We prevent this with a single atomic conditional UPDATE:
//
//   UPDATE "Pool"
//   SET "seatsOccupied" = "seatsOccupied" + $seats
//   WHERE id = $poolId
//     AND "seatsOccupied" + $seats <= (
//           SELECT capacity FROM "Tesla" WHERE id = "teslaId"
//         )
//   RETURNING *;
//
// Postgres evaluates the WHERE and applies the write atomically
// at the row lock level — no window for a concurrent read between
// check and write. If RETURNING yields 0 rows the seat was gone
// and we return 409 Conflict.
//
// We use prisma.$queryRaw for this — Prisma's ORM API does not
// support conditional UPDATE ... RETURNING in a single call.
// ─────────────────────────────────────────────────────────────
const { Prisma } = require('@prisma/client');
const prisma     = require('../prisma/client');
const AppError   = require('../utils/AppError');
const { arePoolable } = require('../utils/zones');
const { calculateFare } = require('../utils/fare');
const { applyRideTransition } = require('./rideService');

// ── Driver status ─────────────────────────────────────────────
async function getDriverStatus(driverId) {
  const tesla = await prisma.tesla.findUnique({ where: { driverId } });
  if (!tesla) throw new AppError('No Tesla assigned to this driver', 404);
  return tesla;
}

async function setDriverStatus(driverId, status) {
  if (!['ONLINE', 'OFFLINE'].includes(status)) {
    throw new AppError('status must be ONLINE or OFFLINE', 400);
  }
  const tesla = await prisma.tesla.findUnique({ where: { driverId } });
  if (!tesla) throw new AppError('No Tesla assigned to this driver', 404);

  return prisma.tesla.update({
    where: { driverId },
    data:  { status },
  });
}

// ── Incoming requests matching this driver's corridor ─────────
async function getIncomingRequests(driverId) {
  const tesla = await prisma.tesla.findUnique({ where: { driverId } });
  if (!tesla) throw new AppError('No Tesla assigned to this driver', 404);
  if (tesla.status !== 'ONLINE') {
    throw new AppError('Go online to see incoming requests', 403);
  }

  // Return all REQUESTED (unmatched) rides — driver can decide which to accept.
  // The frontend filters by corridor visually; backend returns all unmatched
  // so a second driver with a different route can also see them.
  return prisma.rideRequest.findMany({
    where: { status: 'REQUESTED', poolId: null },
    include: {
      passenger: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

// ── Accept a ride request ─────────────────────────────────────
/**
 * Steps:
 *  1. Load the ride request, validate it's still REQUESTED.
 *  2. Find an OPEN pool for this driver that can accommodate the seats,
 *     OR create a new OPEN pool.
 *  3. Atomically claim seats using the conditional UPDATE to prevent
 *     race conditions (see module docstring above).
 *  4. Link the ride to the pool, set status → MATCHED.
 *  5. Recalculate fares for ALL passengers in the pool now that
 *     we know pool size (solo vs. pooled discount).
 */
async function acceptRideRequest(driverId, rideId) {
  const tesla = await prisma.tesla.findUnique({ where: { driverId } });
  if (!tesla) throw new AppError('No Tesla assigned to this driver', 404);
  if (tesla.status !== 'ONLINE') throw new AppError('Go online first', 403);

  const ride = await prisma.rideRequest.findUnique({ where: { id: rideId } });
  if (!ride) throw new AppError('Ride request not found', 404);
  if (ride.status !== 'REQUESTED') {
    throw new AppError('Ride is no longer available', 409);
  }

  // Find the driver's current active pool (if any)
  const activePool = await prisma.pool.findFirst({
    where: {
      teslaId: tesla.id,
      status:  { notIn: ['COMPLETED', 'CANCELLED'] },
    },
    include: {
      rideRequests: {
        where: { status: { notIn: ['CANCELLED'] } },
      },
    },
  });

  let pool;
  if (activePool) {
    if (activePool.status !== 'OPEN') {
      throw new AppError('Cannot accept new rides because the pool is no longer OPEN', 409);
    }
    const freeSeats = tesla.capacity - activePool.seatsOccupied;
    if (freeSeats < ride.seatsRequested) {
      throw new AppError('No seats available — pool just filled up', 409);
    }
    const compatible = activePool.rideRequests.every((r) =>
      arePoolable(r.pickupZone, r.dropoffZone, ride.pickupZone, ride.dropoffZone)
    );
    if (!compatible) {
      throw new AppError('Ride is not poolable with your current pool', 409);
    }

    // ── Atomic seat claim ─────────────────────────────────────
    // DESIGN: Single conditional UPDATE — no check-then-write.
    // If the WHERE fails (seats gone concurrently), RETURNING is empty → 409.
    const updated = await prisma.$queryRaw`
      UPDATE "Pool"
      SET "seatsOccupied" = "seatsOccupied" + ${ride.seatsRequested}
      WHERE id = ${activePool.id}
        AND "seatsOccupied" + ${ride.seatsRequested} <= (
              SELECT capacity FROM "Tesla" WHERE id = ${tesla.id}
            )
      RETURNING *
    `;

    if (!updated || updated.length === 0) {
      throw new AppError('No seats available — pool just filled up', 409);
    }
    pool = updated[0];
  } else {
    // Create a new pool; first passenger always fits
    pool = await prisma.pool.create({
      data: {
        teslaId:       tesla.id,
        status:        'OPEN',
        seatsOccupied: ride.seatsRequested,
      },
    });
  }

  // Transition ride: REQUESTED → MATCHED and link to pool
  await prisma.$transaction([
    prisma.rideRequest.update({
      where: { id: ride.id },
      data:  { poolId: pool.id, status: 'MATCHED' },
    }),
    prisma.statusHistory.create({
      data: {
        rideRequestId: ride.id,
        fromStatus:    'REQUESTED',
        toStatus:      'MATCHED',
      },
    }),
  ]);

  // Recalculate fares for all passengers in this pool now that we know size
  await recalculateFaresForPool(pool.id);

  return prisma.pool.findUnique({
    where: { id: pool.id },
    include: {
      rideRequests: {
        where:   { status: { notIn: ['CANCELLED'] } },
        include: { passenger: { select: { id: true, name: true } }, fare: true },
      },
    },
  });
}

// ── Recalculate fares for all active passengers in a pool ─────
/**
 * Called whenever the pool passenger count changes (new join or cancel).
 * Pool discount (20%) applies only when pool has ≥ 2 passengers.
 * Upserts Fare records — creates if not exists, updates if already set.
 */
async function recalculateFaresForPool(poolId) {
  const rides = await prisma.rideRequest.findMany({
    where: {
      poolId,
      status: { notIn: ['CANCELLED'] },
    },
  });

  const isPooled = rides.length >= 2;

  await Promise.all(
    rides.map((r) => {
      const fareBreakdown = calculateFare(r.pickupZone, r.dropoffZone, isPooled);
      return prisma.fare.upsert({
        where:  { rideRequestId: r.id },
        update: {
          baseFarePaisa:       fareBreakdown.baseFarePaisa,
          distanceChargePaisa: fareBreakdown.distanceChargePaisa,
          poolDiscountPaisa:   fareBreakdown.poolDiscountPaisa,
          totalFarePaisa:      fareBreakdown.totalFarePaisa,
        },
        create: {
          rideRequestId:       r.id,
          baseFarePaisa:       fareBreakdown.baseFarePaisa,
          distanceChargePaisa: fareBreakdown.distanceChargePaisa,
          poolDiscountPaisa:   fareBreakdown.poolDiscountPaisa,
          totalFarePaisa:      fareBreakdown.totalFarePaisa,
        },
      });
    }),
  );
}

// ── Active pool for the driver ────────────────────────────────
async function getActivePool(driverId) {
  const tesla = await prisma.tesla.findUnique({ where: { driverId } });
  if (!tesla) throw new AppError('No Tesla assigned to this driver', 404);

  const pool = await prisma.pool.findFirst({
    where: {
      teslaId: tesla.id,
      status:  { notIn: ['COMPLETED', 'CANCELLED'] },
    },
    include: {
      rideRequests: {
        where:   { status: { notIn: ['CANCELLED'] } },
        include: {
          passenger: { select: { id: true, name: true, phone: true } },
          fare: true,
          statusHistory: { orderBy: { changedAt: 'asc' } },
        },
      },
    },
  });

  return pool; // null if no active pool
}

// ── Advance pool status ───────────────────────────────────────
/**
 * Valid pool transitions (mirrors ride transitions):
 *   OPEN         → (happens implicitly when first ride matched)
 *   MATCHED      → DRIVER_ARRIVED
 *   DRIVER_ARRIVED → STARTED
 *   STARTED      → COMPLETED
 *
 * When pool advances, ALL non-cancelled rides in it advance too.
 * Each ride transition is logged to StatusHistory.
 */
const POOL_TRANSITIONS = {
  OPEN:           ['MATCHED', 'CANCELLED'],
  MATCHED:        ['DRIVER_ARRIVED', 'CANCELLED'],
  DRIVER_ARRIVED: ['STARTED', 'CANCELLED'],
  STARTED:        ['COMPLETED'],
  COMPLETED:      [],
  CANCELLED:      [],
};

async function advancePoolStatus(driverId, poolId, toStatus) {
  const tesla = await prisma.tesla.findUnique({ where: { driverId } });
  if (!tesla) throw new AppError('No Tesla assigned to this driver', 404);

  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      rideRequests: {
        where: { status: { notIn: ['CANCELLED'] } },
      },
    },
  });

  if (!pool) throw new AppError('Pool not found', 404);
  if (pool.teslaId !== tesla.id) throw new AppError('Forbidden', 403);

  const allowed = POOL_TRANSITIONS[pool.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new AppError(`Invalid pool transition: ${pool.status} → ${toStatus}`, 400);
  }

  // Advance all active rides in the pool first
  for (const ride of pool.rideRequests) {
    await applyRideTransition(ride, toStatus);
  }

  // Then advance the pool itself
  await prisma.pool.update({
    where: { id: poolId },
    data:  { status: toStatus },
  });

  return prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      rideRequests: {
        include: {
          passenger: { select: { id: true, name: true } },
          fare: true,
        },
      },
    },
  });
}

// ── Driver history ────────────────────────────────────────────
async function getDriverHistory(driverId) {
  const tesla = await prisma.tesla.findUnique({ where: { driverId } });
  if (!tesla) throw new AppError('No Tesla assigned to this driver', 404);

  const pools = await prisma.pool.findMany({
    where: {
      teslaId: tesla.id,
      status:  { in: ['COMPLETED', 'CANCELLED'] },
    },
    include: {
      rideRequests: {
        include: { fare: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return pools.map((pool) => {
    const completedRides = pool.rideRequests.filter((r) => r.status === 'COMPLETED');
    const totalFarePaisa = completedRides.reduce(
      (sum, r) => sum + (r.fare?.totalFarePaisa ?? 0), 0,
    );
    return {
      ...pool,
      passengerCount: completedRides.length,
      totalFarePaisa,
    };
  });
}

module.exports = {
  getDriverStatus,
  setDriverStatus,
  getIncomingRequests,
  acceptRideRequest,
  getActivePool,
  advancePoolStatus,
  getDriverHistory,
  recalculateFaresForPool,
};
