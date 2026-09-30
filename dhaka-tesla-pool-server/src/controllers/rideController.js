// ─────────────────────────────────────────────────────────────
// src/controllers/rideController.js
// Passenger ride request controller.
// ─────────────────────────────────────────────────────────────
const rideService = require('../services/rideService');

// GET /api/rides/fare-estimate?pickup=&dropoff=&seats=
async function getFareEstimate(req, res, next) {
  try {
    const { pickup, dropoff, seats } = req.query;
    if (!pickup || !dropoff)
      return res.status(400).json({ message: 'pickup and dropoff query params are required' });
    const estimate = rideService.estimateFare(pickup, dropoff, seats);
    res.json(estimate);
  } catch (err) { next(err); }
}

// POST /api/rides/request
async function requestRide(req, res, next) {
  try {
    const { pickupZone, dropoffZone, seatsRequested } = req.body;
    if (!pickupZone || !dropoffZone)
      return res.status(400).json({ message: 'pickupZone and dropoffZone are required' });
    const ride = await rideService.requestRide(req.user.id, { pickupZone, dropoffZone, seatsRequested });
    res.status(201).json(ride);
  } catch (err) { next(err); }
}

// GET /api/rides/active
async function getActiveRide(req, res, next) {
  try {
    const ride = await rideService.getActiveRide(req.user.id);
    if (!ride) return res.json(null);
    res.json(ride);
  } catch (err) { next(err); }
}

// GET /api/rides/history
async function getRideHistory(req, res, next) {
  try {
    const rides = await rideService.getRideHistory(req.user.id);
    res.json(rides);
  } catch (err) { next(err); }
}

// GET /api/rides/:id
// NOTE: /history and /fare-estimate and /active are defined BEFORE /:id in the
// router so they are not swallowed by this dynamic segment.
async function getRideById(req, res, next) {
  try {
    const ride = await rideService.getRideById(req.user.id, req.params.id);
    res.json(ride);
  } catch (err) { next(err); }
}

// PATCH /api/rides/:id/cancel
async function cancelRide(req, res, next) {
  try {
    await rideService.cancelRide(req.user.id, req.params.id);
    res.json({ message: 'Ride cancelled' });
  } catch (err) { next(err); }
}

module.exports = {
  getFareEstimate,
  requestRide,
  getActiveRide,
  getRideHistory,
  getRideById,
  cancelRide,
};
