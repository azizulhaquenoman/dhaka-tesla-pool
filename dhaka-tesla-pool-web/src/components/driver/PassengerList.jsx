import { getZoneById } from '../../utils/zones.js';
import { paisaToTaka } from '../../utils/fare.js';

export default function PassengerList({ passengers = [] }) {
  if (!passengers.length) {
    return <p className="empty-inline">No passengers in this pool yet.</p>;
  }

  return (
    <ul className="passenger-list">
      {passengers.map((p) => {
        const pickup  = getZoneById(p.pickupZone);
        const dropoff = getZoneById(p.dropoffZone);
        return (
          <li key={p.id} className="passenger-list__item">
            <div className="passenger-list__name">{p.passengerName}</div>
            <div className="passenger-list__route">
              {pickup?.label ?? p.pickupZone}
              <span className="route-arrow"> → </span>
              {dropoff?.label ?? p.dropoffZone}
            </div>
            <div className="passenger-list__meta">
              <span>{p.seatsRequested} seat{p.seatsRequested !== 1 ? 's' : ''}</span>
              {p.fare && (
                <span className="passenger-list__fare">
                  {paisaToTaka(p.fare.totalFarePaisa)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
