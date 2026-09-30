// ─────────────────────────────────────────────────────────────
// src/utils/fare.js
// All monetary values stored and calculated as INTEGER PAISA.
// 1 taka = 100 paisa. Never use floats for money.
//
// Formula:
//   base             = 3000           (৳30)
//   distanceCharge   = km × 1500      (৳15/km)
//   subtotal         = base + distance
//   poolDiscount     = subtotal × 0.20  (only when pool has ≥ 2 passengers)
//   totalFare        = subtotal - poolDiscount
//
// Hand-verifiable: Banani → Mohakhali, 3 km, pooled
//   base=3000, dist=4500, subtotal=7500, discount=1500, total=6000 paisa (৳60)
// ─────────────────────────────────────────────────────────────

const { getDistanceKm } = require('./zones');

const FARE_CONFIG = {
  BASE_FARE_PAISA:    3000,  // ৳30 flat
  PER_KM_RATE_PAISA: 1500,  // ৳15/km
  POOL_DISCOUNT_RATE: 0.20, // 20% off when pooled
};

/**
 * Calculate fare breakdown for one passenger's ride.
 *
 * @param {string}  pickupZone  - zone id
 * @param {string}  dropoffZone - zone id
 * @param {boolean} isPooled    - true when pool has ≥ 2 passengers
 * @returns {{ baseFarePaisa, distanceChargePaisa, poolDiscountPaisa, totalFarePaisa, distanceKm }}
 */
function calculateFare(pickupZone, dropoffZone, isPooled) {
  const distanceKm     = getDistanceKm(pickupZone, dropoffZone);
  const base           = FARE_CONFIG.BASE_FARE_PAISA;
  // Math.round mirrors the frontend — keeps values identical
  const distanceCharge = Math.round(distanceKm * FARE_CONFIG.PER_KM_RATE_PAISA);
  const subtotal       = base + distanceCharge;
  const poolDiscount   = isPooled ? Math.round(subtotal * FARE_CONFIG.POOL_DISCOUNT_RATE) : 0;

  return {
    baseFarePaisa:       base,
    distanceChargePaisa: distanceCharge,
    poolDiscountPaisa:   poolDiscount,
    totalFarePaisa:      subtotal - poolDiscount,
    distanceKm,
  };
}

module.exports = { calculateFare, FARE_CONFIG };
