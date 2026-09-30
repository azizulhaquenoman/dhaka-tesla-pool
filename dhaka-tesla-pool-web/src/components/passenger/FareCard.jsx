import { paisaToTaka } from '../../utils/fare.js';

export default function FareCard({ fare }) {
  if (!fare) return null;
  const isPooled = fare.poolDiscountPaisa > 0;

  return (
    <div className="fare-card">
      <div className="fare-card__header">
        <span className="fare-card__label">Estimated fare</span>
        {isPooled && <span className="pool-tag">Pool discount applied</span>}
      </div>
      <div className="fare-card__total">{paisaToTaka(fare.totalFarePaisa)}</div>
      <dl className="fare-card__breakdown">
        <div className="fare-row">
          <dt>Base fare</dt>
          <dd>{paisaToTaka(fare.baseFarePaisa)}</dd>
        </div>
        <div className="fare-row">
          <dt>Distance ({fare.distanceKm} km)</dt>
          <dd>{paisaToTaka(fare.distanceChargePaisa)}</dd>
        </div>
        {isPooled && (
          <div className="fare-row fare-row--discount">
            <dt>Pool discount (20%)</dt>
            <dd>–{paisaToTaka(fare.poolDiscountPaisa)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
