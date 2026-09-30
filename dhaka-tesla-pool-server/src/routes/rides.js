// ─────────────────────────────────────────────────────────────
// src/routes/rides.js
// Passenger-only ride routes.
// IMPORTANT: static sub-paths (/fare-estimate, /active, /history)
// must be registered BEFORE /:id to avoid being captured by the
// dynamic segment. Express matches routes in registration order.
// ─────────────────────────────────────────────────────────────
const router       = require('express').Router();
const ctrl         = require('../controllers/rideController');
const authenticate = require('../middlewares/authenticate');
const requireRole  = require('../middlewares/requireRole');

// All ride routes require authentication + PASSENGER role
router.use(authenticate, requireRole('PASSENGER'));

// Static sub-paths first
router.get('/fare-estimate', ctrl.getFareEstimate);
router.get('/active',        ctrl.getActiveRide);
router.get('/history',       ctrl.getRideHistory);

// Dynamic segment
router.get('/:id',           ctrl.getRideById);

// Mutations
router.post('/request',      ctrl.requestRide);
router.patch('/:id/cancel',  ctrl.cancelRide);

module.exports = router;
