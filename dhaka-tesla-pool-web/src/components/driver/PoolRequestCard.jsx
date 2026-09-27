import { getZoneById } from '../../utils/zones.js';

export default function PoolRequestCard({ request, onAccept, accepting }) {
  const pickup  = getZoneById(request.pickupZone);
  const dropoff = getZoneById(request.dropoffZone);

  return (
    <div className="pool-req-card">
      <div className="pool-req-card__passenger">{request.passengerName}</div>
      <div className="pool-req-card__route">
        <span className="zone-dot zone-dot--pickup" />
        <span>{pickup?.label ?? request.pickupZone}</span>
        <span className="route-arrow"> → </span>
        <span className="zone-dot zone-dot--dropoff" />
        <span>{dropoff?.label ?? request.dropoffZone}</span>
      </div>
      <div className="pool-req-card__meta">
        {request.seatsRequested} seat{request.seatsRequested !== 1 ? 's' : ''}
      </div>
      <button
        className="btn btn--primary"
        onClick={() => onAccept(request.id)}
        disabled={accepting}
      >
        {accepting ? 'Accepting…' : 'Accept'}
      </button>
    </div>
  );
}
