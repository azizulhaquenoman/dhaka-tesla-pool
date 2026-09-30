// ─────────────────────────────────────────────────────────────
// src/controllers/driverController.js
// Driver-facing ride pooling controller.
// ─────────────────────────────────────────────────────────────
const poolService = require('../services/poolService');

// GET /api/driver/status
async function getStatus(req, res, next) {
  try {
    const tesla = await poolService.getDriverStatus(req.user.id);
    res.json({ status: tesla.status, tesla });
  } catch (err) { next(err); }
}

// PATCH /api/driver/status
async function setStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required' });
    const tesla = await poolService.setDriverStatus(req.user.id, status);
    res.json({ status: tesla.status, tesla });
  } catch (err) { next(err); }
}

async function getIncomingRequests(req, res, next) {
  try {
    const requests = await poolService.getIncomingRequests(req.user.id);
    res.json({ requests });                                            // WRAPPED
  } catch (err) { next(err); }
}

async function acceptRequest(req, res, next) {
  try {
    const pool = await poolService.acceptRideRequest(req.user.id, req.params.rideId);
    res.json({ pool });                                                // WRAPPED
  } catch (err) { next(err); }
}

async function getActivePool(req, res, next) {
  try {
    const pool = await poolService.getActivePool(req.user.id);
    res.json({ pool: pool ?? null });                                  // WRAPPED
  } catch (err) { next(err); }
}

async function advancePoolStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required' });
    const pool = await poolService.advancePoolStatus(req.user.id, req.params.poolId, status);
    res.json({ pool });                                                // WRAPPED
  } catch (err) { next(err); }
}

async function getDriverHistory(req, res, next) {
  try {
    const pools = await poolService.getDriverHistory(req.user.id);
    res.json({ pools });                                               // WRAPPED
  } catch (err) { next(err); }
}


module.exports = {
  getStatus,
  setStatus,
  getIncomingRequests,
  acceptRequest,
  getActivePool,
  advancePoolStatus,
  getDriverHistory,
};
