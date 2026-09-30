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
    // Return pooled as the display fare (best case); include solo for reference
    res.json({ fare: estimate.pooled, solo: estimate.solo, seats: estimate.seats });
  } catch (err) { next(err); }
}

async function requestRide(req, res, next) {
  try {
    const { pickupZone, dropoffZone, seatsRequested } = req.body;
    if (!pickupZone || !dropoffZone)
      return res.status(400).json({ message: 'pickupZone and dropoffZone are required' });
    const ride = await rideService.requestRide(req.user.id, { pickupZone, dropoffZone, seatsRequested });
    res.status(201).json({ ride });                                    // WRAPPED
  } catch (err) { next(err); }
}

async function getActiveRide(req, res, next) {
  try {
    const ride = await rideService.getActiveRide(req.user.id);
    res.json({ ride: ride ?? null });                                  // WRAPPED
  } catch (err) { next(err); }
}

async function getRideHistory(req, res, next) {
  try {
    const rides = await rideService.getRideHistory(req.user.id);
    res.json({ rides });                                               // WRAPPED
  } catch (err) { next(err); }
}

async function getRideById(req, res, next) {
  try {
    const ride = await rideService.getRideById(req.user.id, req.params.id);
    res.json({ ride });                                                // WRAPPED
  } catch (err) { next(err); }
}

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
