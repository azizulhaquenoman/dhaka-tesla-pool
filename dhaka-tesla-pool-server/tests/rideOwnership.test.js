// ─────────────────────────────────────────────────────────────
// tests/rideOwnership.test.js
// Verifies access-control rules:
//  - A passenger cannot view another passenger's ride (403)
//  - A passenger cannot cancel another passenger's ride (403)
//  - Cancellation is blocked after STARTED status (400)
// ─────────────────────────────────────────────────────────────
const prisma      = require('../src/prisma/client');
const rideService = require('../src/services/rideService');
const AppError    = require('../src/utils/AppError');
const bcrypt      = require('bcryptjs');

let ownerPassenger, otherPassenger;
let ownerRideId, startedRideId;

beforeAll(async () => {
  const hash = await bcrypt.hash('test123', 10);

  ownerPassenger = await prisma.user.create({
    data: {
      name: 'Ownership Test Owner', email: `owner-${Date.now()}@test.pool`,
      passwordHash: hash, role: 'PASSENGER', emailVerified: true,
    },
  });

  otherPassenger = await prisma.user.create({
    data: {
      name: 'Ownership Test Intruder', email: `intruder-${Date.now()}@test.pool`,
      passwordHash: hash, role: 'PASSENGER', emailVerified: true,
    },
  });

  // Ride owned by ownerPassenger
  const ownerRide = await prisma.rideRequest.create({
    data: {
      passengerId: ownerPassenger.id, pickupZone: 'banani',
      dropoffZone: 'mohakhali', seatsRequested: 1, status: 'REQUESTED',
    },
  });
  ownerRideId = ownerRide.id;
  await prisma.statusHistory.create({
    data: { rideRequestId: ownerRideId, fromStatus: '', toStatus: 'REQUESTED' },
  });

  // Ride in STARTED state — passenger cannot cancel
  const started = await prisma.rideRequest.create({
    data: {
      passengerId: ownerPassenger.id, pickupZone: 'gulshan-1',
      dropoffZone: 'dhanmondi', seatsRequested: 1, status: 'STARTED',
    },
  });
  startedRideId = started.id;
  await prisma.statusHistory.create({
    data: { rideRequestId: startedRideId, fromStatus: '', toStatus: 'STARTED' },
  });
});

afterAll(async () => {
  const ids = [ownerRideId, startedRideId].filter(Boolean);
  await prisma.statusHistory.deleteMany({ where: { rideRequestId: { in: ids } } });
  await prisma.rideRequest.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.deleteMany({
    where: { id: { in: [ownerPassenger?.id, otherPassenger?.id] } },
  });
});

describe('Ride ownership enforcement', () => {
  it('returns 403 when a passenger reads another passenger\'s ride', async () => {
    await expect(
      rideService.getRideById(otherPassenger.id, ownerRideId),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns 403 when a passenger cancels another passenger\'s ride', async () => {
    await expect(
      rideService.cancelRide(otherPassenger.id, ownerRideId),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns 400 when cancelling a STARTED ride', async () => {
    await expect(
      rideService.cancelRide(ownerPassenger.id, startedRideId),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('owner can read their own ride', async () => {
    const ride = await rideService.getRideById(ownerPassenger.id, ownerRideId);
    expect(ride.id).toBe(ownerRideId);
    expect(ride.passengerId).toBe(ownerPassenger.id);
  });

  it('owner can cancel their own REQUESTED ride', async () => {
    await expect(
      rideService.cancelRide(ownerPassenger.id, ownerRideId),
    ).resolves.not.toThrow();

    const updated = await prisma.rideRequest.findUnique({ where: { id: ownerRideId } });
    expect(updated.status).toBe('CANCELLED');
  });
});
