// ─────────────────────────────────────────────────────────────
// src/routes/driver.js
// Driver-only routes.
// /pool/active must be before /pool/:poolId/status to avoid
// 'active' being treated as a poolId.
// ─────────────────────────────────────────────────────────────
const router       = require('express').Router();
const ctrl         = require('../controllers/driverController');
const authenticate = require('../middlewares/authenticate');
const requireRole  = require('../middlewares/requireRole');

router.use(authenticate, requireRole('DRIVER'));

router.get('/status',                 ctrl.getStatus);
router.patch('/status',               ctrl.setStatus);
router.get('/requests',               ctrl.getIncomingRequests);
router.patch('/rides/:rideId/accept', ctrl.acceptRequest);
router.get('/pool/active',            ctrl.getActivePool);          // static before dynamic
router.patch('/pool/:poolId/status',  ctrl.advancePoolStatus);
router.get('/history',                ctrl.getDriverHistory);

module.exports = router;
