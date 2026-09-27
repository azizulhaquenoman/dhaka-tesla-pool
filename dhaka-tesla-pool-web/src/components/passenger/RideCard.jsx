import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge.jsx';
import { getZoneById } from '../../utils/zones.js';
import { paisaToTaka } from '../../utils/fare.js';

export default function RideCard({ ride }) {
  const pickup  = getZoneById(ride.pickupZone);
  const dropoff = getZoneById(ride.dropoffZone);

  return (
    <article className="ride-card">
      <div className="ride-card__top">
        <StatusBadge status={ride.status} />
        <time className="ride-card__date" dateTime={ride.createdAt}>
          {new Date(ride.createdAt).toLocaleDateString('en-BD', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </time>
      </div>

      <div className="ride-card__route">
        <div className="route-step">
          <span className="zone-dot zone-dot--pickup" />
          <span>{pickup?.label ?? ride.pickupZone}</span>
        </div>
        <div className="route-line" />
        <div className="route-step">
          <span className="zone-dot zone-dot--dropoff" />
          <span>{dropoff?.label ?? ride.dropoffZone}</span>
        </div>
      </div>

      <div className="ride-card__bottom">
        <span className="ride-card__fare">
          {ride.fare ? paisaToTaka(ride.fare.totalFarePaisa) : '—'}
        </span>
        <Link to={`/passenger/ride/${ride.id}`} className="ride-card__link">
          Details →
        </Link>
      </div>
    </article>
  );
}
