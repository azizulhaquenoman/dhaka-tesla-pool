// ─────────────────────────────────────────────────────────────
// src/services/rideService.js
// Business logic for passenger ride requests.
// Key responsibilities:
//  - Validate zone ids
//  - Create RideRequest records
//  - Enforce ride status transition rules
//  - Log every transition to StatusHistory
// ─────────────────────────────────────────────────────────────
const prisma   = require('../prisma/client');
const AppError = require('../utils/AppError');
const { ZONE_IDS } = require('../utils/zones');
const { calculateFare } = require('../utils/fare');

// Valid one-step transitions allowed from each status
const ALLOWED_TRANSITIONS = {
  REQUESTED:      ['MATCHED', 'CANCELLED'],
  MATCHED:        ['DRIVER_ARRIVED', 'CANCELLED'],
  DRIVER_ARRIVED: ['STARTED', 'CANCELLED'],
  STARTED:        ['COMPLETED'],
  COMPLETED:      [],
  CANCELLED:      [],
};

// ── Fare estimate (no DB write) ───────────────────────────────
function estimateFare(pickupZone, dropoffZone, seats) {
  if (!ZONE_IDS.has(pickupZone))  throw new AppError(`Unknown pickup zone: ${pickupZone}`, 400);
  if (!ZONE_IDS.has(dropoffZone)) throw new AppError(`Unknown dropoff zone: ${dropoffZone}`, 400);
  if (pickupZone === dropoffZone) throw new AppError('Pickup and dropoff must differ', 400);

  // Estimate assumes no pool yet — show solo vs pooled breakdown
  const solo   = calculateFare(pickupZone, dropoffZone, false);
  const pooled = calculateFare(pickupZone, dropoffZone, true);
  return { solo, pooled, seats: Number(seats) || 1 };
}

// ── Request a ride ────────────────────────────────────────────
async function requestRide(passengerId, { pickupZone, dropoffZone, seatsRequested = 1 }) {
  if (!ZONE_IDS.has(pickupZone))  throw new AppError(`Unknown pickup zone: ${pickupZone}`, 400);
  if (!ZONE_IDS.has(dropoffZone)) throw new AppError(`Unknown dropoff zone: ${dropoffZone}`, 400);
  if (pickupZone === dropoffZone) throw new AppError('Pickup and dropoff must differ', 400);

  const seats = Number(seatsRequested);
  if (!Number.isInteger(seats) || seats < 1 || seats > 3) {
    throw new AppError('seatsRequested must be 1–3', 400);
  }

  // A passenger can only have one active ride at a time
  const active = await getActiveRide(passengerId);
  if (active) throw new AppError('You already have an active ride', 409);

  const ride = await prisma.rideRequest.create({
    data: {
      passengerId,
      pickupZone,
      dropoffZone,
      seatsRequested: seats,
      status: 'REQUESTED',
    },
  });

  // Log initial state entry — from '' to REQUESTED
  await prisma.statusHistory.create({
    data: {
      rideRequestId: ride.id,
      fromStatus:    '',
      toStatus:      'REQUESTED',
    },
  });

  return ride;
}

// ── Get active ride for a passenger ──────────────────────────
async function getActiveRide(passengerId) {
  return prisma.rideRequest.findFirst({
    where: {
      passengerId,
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
    },
    include: {
      pool:  { include: { tesla: { include: { driver: true } } } },
      fare:  true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
    },
  });
}

// ── Get ride by id (ownership enforced) ──────────────────────
async function getRideById(passengerId, rideId) {
  const ride = await prisma.rideRequest.findUnique({
    where: { id: rideId },
    include: {
      pool:  { include: { tesla: { include: { driver: true } } } },
      fare:  true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
    },
  });

  if (!ride) throw new AppError('Ride not found', 404);
  if (ride.passengerId !== passengerId) throw new AppError('Forbidden', 403);
  return ride;
}

// ── Cancel a ride ─────────────────────────────────────────────
async function cancelRide(passengerId, rideId) {
  const ride = await prisma.rideRequest.findUnique({ where: { id: rideId } });

  if (!ride)                              throw new AppError('Ride not found', 404);
  if (ride.passengerId !== passengerId)   throw new AppError('Forbidden', 403);

  // Passenger can only cancel before STARTED
  if (!['REQUESTED', 'MATCHED'].includes(ride.status)) {
    throw new AppError(
      `Cannot cancel a ride in status ${ride.status}`,
      400,
    );
  }

  await applyRideTransition(ride, 'CANCELLED');

  // If ride was part of a pool, free the seats
  if (ride.poolId) {
    await prisma.pool.update({
      where: { id: ride.poolId },
      data:  { seatsOccupied: { decrement: ride.seatsRequested } },
    });
    // If no other active passengers in the pool, cancel the pool too
    const remaining = await prisma.rideRequest.count({
      where: {
        poolId: ride.poolId,
        status: { notIn: ['CANCELLED'] },
      },
    });
    if (remaining === 0) {
      await prisma.pool.update({
        where: { id: ride.poolId },
        data:  { status: 'CANCELLED' },
      });
    }
  }
}

// ── Ride history ──────────────────────────────────────────────
async function getRideHistory(passengerId) {
  return prisma.rideRequest.findMany({
    where: {
      passengerId,
      status: { in: ['COMPLETED', 'CANCELLED'] },
    },
    include: { fare: true },
    orderBy: { updatedAt: 'desc' },
  });
}

// ── Internal: apply a status transition and write history ─────
/**
 * Validates the transition is legal, updates the ride, and inserts
 * a StatusHistory row. Used internally by cancel and driver service.
 */
async function applyRideTransition(ride, toStatus) {
  const allowed = ALLOWED_TRANSITIONS[ride.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new AppError(
      `Invalid transition: ${ride.status} → ${toStatus}`,
      400,
    );
  }

  await prisma.$transaction([
    prisma.rideRequest.update({
      where: { id: ride.id },
      data:  { status: toStatus },
    }),
    prisma.statusHistory.create({
      data: {
        rideRequestId: ride.id,
        fromStatus:    ride.status,
        toStatus,
      },
    }),
  ]);
}

module.exports = {
  estimateFare,
  requestRide,
  getActiveRide,
  getRideById,
  cancelRide,
  getRideHistory,
  applyRideTransition,
  ALLOWED_TRANSITIONS,
};
