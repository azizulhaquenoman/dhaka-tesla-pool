import { getDistanceKm } from './zones.js';

// All money in INTEGER PAISA (1 taka = 100 paisa) — no floats in fare math
export const FARE_CONFIG = {
  BASE_FARE_PAISA:    3000, // ৳30
  PER_KM_RATE_PAISA: 1500, // ৳15/km
  POOL_DISCOUNT_RATE: 0.20, // 20% off when pooled
};

/**
 * @param {string} pickup   - zone id
 * @param {string} dropoff  - zone id
 * @param {boolean} isPooled
 * @returns {{ baseFarePaisa, distanceChargePaisa, poolDiscountPaisa, totalFarePaisa, distanceKm }}
 */
export function calculateFare(pickup, dropoff, isPooled) {
  const distanceKm     = getDistanceKm(pickup, dropoff);
  const base           = FARE_CONFIG.BASE_FARE_PAISA;
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

export const paisaToTaka = (paisa) => `৳${(paisa / 100).toFixed(2)}`;
