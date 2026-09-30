// ─────────────────────────────────────────────────────────────
// tests/rideTransitions.test.js
// Ensures invalid status transitions are rejected and valid ones
// go through, with StatusHistory logged on each.
//
// Uses a Prisma transaction that rolls back after each test so
// the DB stays clean between runs. Requires a live DB connection.
// ─────────────────────────────────────────────────────────────
const prisma = require('../src/prisma/client');
const { applyRideTransition, ALLOWED_TRANSITIONS } = require('../src/services/rideService');
const AppError = require('../src/utils/AppError');

// Helper — minimal ride stub that satisfies applyRideTransition
function makeRide(id, status) {
  return { id, status };
}

describe('Ride status transitions', () => {
  let rideId;

  beforeEach(async () => {
    // Create a minimal passenger + ride for each test
    const pass = await prisma.user.create({
      data: {
        name:          'Transition Test Passenger',
        email:         `transition-${Date.now()}@test.pool`,
        passwordHash:  'x',
        role:          'PASSENGER',
        emailVerified: true,
      },
    });
    const ride = await prisma.rideRequest.create({
      data: {
        passengerId:    pass.id,
        pickupZone:     'banani',
        dropoffZone:    'mohakhali',
        seatsRequested: 1,
        status:         'REQUESTED',
      },
    });
    rideId = ride.id;

    // Log initial state
    await prisma.statusHistory.create({
      data: { rideRequestId: ride.id, fromStatus: '', toStatus: 'REQUESTED' },
    });
  });

  afterEach(async () => {
    // Clean up — delete in FK order
    await prisma.statusHistory.deleteMany({ where: { rideRequestId: rideId } });
    await prisma.rideRequest.deleteMany({ where: { id: rideId } });
    // Users with non-pool email
    await prisma.user.deleteMany({ where: { email: { contains: '@test.pool' } } });
  });

  it('REQUESTED → MATCHED is valid', async () => {
    const ride = await prisma.rideRequest.findUnique({ where: { id: rideId } });
    await expect(applyRideTransition(ride, 'MATCHED')).resolves.not.toThrow();

    const updated = await prisma.rideRequest.findUnique({ where: { id: rideId } });
    expect(updated.status).toBe('MATCHED');
  });

  it('REQUESTED → COMPLETED is invalid (skips steps)', async () => {
    const ride = await prisma.rideRequest.findUnique({ where: { id: rideId } });
    await expect(applyRideTransition(ride, 'COMPLETED')).rejects.toThrow(AppError);
    await expect(applyRideTransition(ride, 'COMPLETED')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('REQUESTED → STARTED is invalid', async () => {
    const ride = await prisma.rideRequest.findUnique({ where: { id: rideId } });
    await expect(applyRideTransition(ride, 'STARTED')).rejects.toThrow(AppError);
  });

  it('CANCELLED → REQUESTED is invalid (terminal state)', async () => {
    // First cancel the ride
    const ride = await prisma.rideRequest.findUnique({ where: { id: rideId } });
    await applyRideTransition(ride, 'CANCELLED');

    const cancelled = await prisma.rideRequest.findUnique({ where: { id: rideId } });
    await expect(applyRideTransition(cancelled, 'REQUESTED')).rejects.toThrow(AppError);
  });

  it('logs a StatusHistory row on every valid transition', async () => {
    const ride = await prisma.rideRequest.findUnique({ where: { id: rideId } });
    await applyRideTransition(ride, 'MATCHED');

    const history = await prisma.statusHistory.findMany({
      where: { rideRequestId: rideId },
      orderBy: { changedAt: 'asc' },
    });
    // Initial entry + REQUESTED→MATCHED
    expect(history.length).toBeGreaterThanOrEqual(2);
    const last = history[history.length - 1];
    expect(last.fromStatus).toBe('REQUESTED');
    expect(last.toStatus).toBe('MATCHED');
  });

  it('ALLOWED_TRANSITIONS covers every possible status', () => {
    const allStatuses = ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED'];
    for (const status of allStatuses) {
      expect(ALLOWED_TRANSITIONS).toHaveProperty(status);
    }
  });
});
