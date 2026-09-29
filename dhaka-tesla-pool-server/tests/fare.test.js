// ─────────────────────────────────────────────────────────────
// tests/fare.test.js
// Verifies fare calculation in paisa with no floats.
//
// Hand-verifiable:
//   Banani → Mohakhali  3 km  solo:   base=3000 + dist=4500 = 7500
//                              pooled: 7500 - 1500 = 6000 (৳60)
//   Banani → Gulshan-1  2.5km solo:   base=3000 + dist=3750 = 6750
//                              pooled: 6750 - 1350 = 5400 (৳54)
// ─────────────────────────────────────────────────────────────
const { calculateFare } = require('../src/utils/fare');

describe('Fare calculation (paisa math)', () => {
  // Story cast: Nusrat's route
  describe('Banani → Mohakhali (3 km)', () => {
    it('calculates solo fare correctly', () => {
      const f = calculateFare('banani', 'mohakhali', false);
      expect(f.baseFarePaisa).toBe(3000);
      expect(f.distanceChargePaisa).toBe(4500);      // 3 × 1500
      expect(f.poolDiscountPaisa).toBe(0);
      expect(f.totalFarePaisa).toBe(7500);
      expect(f.distanceKm).toBe(3.0);
    });

    it('calculates pooled fare correctly (20% discount)', () => {
      const f = calculateFare('banani', 'mohakhali', true);
      expect(f.baseFarePaisa).toBe(3000);
      expect(f.distanceChargePaisa).toBe(4500);
      expect(f.poolDiscountPaisa).toBe(1500);        // 7500 × 0.20
      expect(f.totalFarePaisa).toBe(6000);           // ৳60
    });
  });

  // Story cast: second passenger's route
  describe('Banani → Gulshan-1 (2.5 km)', () => {
    it('calculates solo fare correctly', () => {
      const f = calculateFare('banani', 'gulshan-1', false);
      expect(f.baseFarePaisa).toBe(3000);
      expect(f.distanceChargePaisa).toBe(3750);      // 2.5 × 1500
      expect(f.poolDiscountPaisa).toBe(0);
      expect(f.totalFarePaisa).toBe(6750);
    });

    it('calculates pooled fare correctly', () => {
      const f = calculateFare('banani', 'gulshan-1', true);
      expect(f.poolDiscountPaisa).toBe(1350);        // 6750 × 0.20
      expect(f.totalFarePaisa).toBe(5400);
    });
  });

  it('never returns a float — all values are integers', () => {
    const routes = [
      ['banani', 'mohakhali'],
      ['banani', 'gulshan-1'],
      ['gulshan-1', 'dhanmondi'],
      ['farmgate', 'motijheel'],
    ];
    for (const [p, d] of routes) {
      for (const pooled of [false, true]) {
        const f = calculateFare(p, d, pooled);
        expect(Number.isInteger(f.baseFarePaisa)).toBe(true);
        expect(Number.isInteger(f.distanceChargePaisa)).toBe(true);
        expect(Number.isInteger(f.poolDiscountPaisa)).toBe(true);
        expect(Number.isInteger(f.totalFarePaisa)).toBe(true);
      }
    }
  });
});
