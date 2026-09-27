import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveRide } from '../../api/passenger.js';
import { useAuth } from '../../hooks/useAuth.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { getZoneById } from '../../utils/zones.js';

export default function PassengerDashboardPage() {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    getActiveRide()
      .then(({ data }) => setActiveRide(data.ride))
      .catch((e) => {
        if (e.response?.status !== 404) setError('Could not load active ride.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Hi, {user.name.split(' ')[0]}</h1>
        <Link to="/passenger/request" className="btn btn--primary">Book a ride</Link>
      </div>

      <section className="page__section">
        <h2 className="section__title">Active ride</h2>
        <ErrorMessage message={error} />

        {!activeRide ? (
          <EmptyState
            icon="🛺"
            title="No active ride"
            description="Book a pool ride and share a seat with other passengers heading your way."
            action={<Link to="/passenger/request" className="btn btn--primary">Book now</Link>}
          />
        ) : (
          <div className="active-ride-card">
            <StatusBadge status={activeRide.status} />

            <div className="active-ride-card__route">
              <div className="route-step">
                <span className="zone-dot zone-dot--pickup" />
                <span>{getZoneById(activeRide.pickupZone)?.label}</span>
              </div>
              <div className="route-arrow-v" />
              <div className="route-step">
                <span className="zone-dot zone-dot--dropoff" />
                <span>{getZoneById(activeRide.dropoffZone)?.label}</span>
              </div>
            </div>

            {activeRide.driverName && (
              <p className="active-ride-card__driver">
                🚗 {activeRide.driverName} · {activeRide.teslaName}
              </p>
            )}

            <Link to={`/passenger/ride/${activeRide.id}`} className="btn btn--ghost">
              Track ride →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
