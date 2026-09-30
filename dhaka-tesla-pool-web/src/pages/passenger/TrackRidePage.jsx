import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cancelRide } from '../../api/passenger.js';
import { useRideStatus } from '../../hooks/useRideStatus.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import FareCard from '../../components/passenger/FareCard.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import { getZoneById } from '../../utils/zones.js';
import { canCancel } from '../../utils/rideStatus.js';

export default function TrackRidePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { ride, loading, error } = useRideStatus(id);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState('');

  const handleCancel = async () => {
    if (!confirm('Cancel this ride?')) return;
    setCancelling(true);
    try {
      await cancelRide(id);
      navigate('/passenger/dashboard');
    } catch (e) {
      setCancelErr(e.response?.data?.message ?? 'Cancel failed. Try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!ride) return null;

  const pickup = getZoneById(ride.pickupZone);
  const dropoff = getZoneById(ride.dropoffZone);

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h1 className="page__title">Ride status</h1>
        <StatusBadge status={ride.status} />
      </div>

      <div className="track-route">
        <div className="route-step">
          <span className="zone-dot zone-dot--pickup" />
          <div>
            <span className="route-step__meta">Pickup</span>
            <span className="route-step__zone">{pickup?.label ?? ride.pickupZone}</span>
          </div>
        </div>
        <div className="route-arrow-v" />
        <div className="route-step">
          <span className="zone-dot zone-dot--dropoff" />
          <div>
            <span className="route-step__meta">Dropoff</span>
            <span className="route-step__zone">{dropoff?.label ?? ride.dropoffZone}</span>
          </div>
        </div>
      </div>

      {activeRide.pool?.tesla?.driver && (
        <div className="driver-info-block">
          <span>🚗</span>
          <div>
            <p className="driver-info-block__name">{ride.pool.tesla.driver.name}</p>
            <p className="driver-info-block__tesla">
              {ride.pool.tesla.name} · {ride.seatsRequested} seat{ride.seatsRequested !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {ride.fare && <FareCard fare={ride.fare} />}

      <ErrorMessage message={cancelErr} />

      {canCancel(ride.status) && (
        <button className="btn btn--danger btn--full" onClick={handleCancel} disabled={cancelling}>
          {cancelling ? 'Cancelling…' : 'Cancel ride'}
        </button>
      )}

      {ride.status === 'COMPLETED' && (
        <div className="completed-banner">
          ✅ Ride completed. Thanks for pooling with Tesla Pool!
        </div>
      )}

      {ride.status === 'CANCELLED' && (
        <div className="cancelled-banner">
          Ride cancelled.
        </div>
      )}
    </div>
  );
}
