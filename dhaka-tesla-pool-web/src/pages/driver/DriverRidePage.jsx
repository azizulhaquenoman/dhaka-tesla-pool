import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { advancePoolStatus, getActivePool } from '../../api/driver.js';
import PassengerList from '../../components/driver/PassengerList.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import { DRIVER_TRANSITIONS } from '../../utils/rideStatus.js';

export default function DriverRidePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getActivePool()
      .then(({ data }) => setPool(data.pool))
      .catch(() => setError('Could not load pool.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdvance = async () => {
    const transition = DRIVER_TRANSITIONS[pool.status];
    if (!transition) return;
    setAdvancing(true);
    setError('');
    try {
      const { data } = await advancePoolStatus(pool.id, transition.next);
      setPool(data.pool);
      if (transition.next === 'COMPLETED') {
        setTimeout(() => navigate('/driver/dashboard'), 2000);
      }
    } catch (e) {
      setError(e.response?.data?.message ?? 'Status update failed.');
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!pool) return <ErrorMessage message={error || 'Pool not found.'} />;

  const transition = DRIVER_TRANSITIONS[pool.status];

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h1 className="page__title">Active pool</h1>
        <StatusBadge status={pool.status} />
      </div>

      <div className="pool-capacity-bar">
        <span className="pool-capacity-bar__label">
          {pool.seatsOccupied} / {pool.tesla?.capacity ?? '?'} seats occupied
        </span>
        <div className="pool-capacity-bar__track">
          <div
            className="pool-capacity-bar__fill"
            style={{ width: pool.tesla ? `${(pool.seatsOccupied / pool.tesla.capacity) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <section className="page__section">
        <h2 className="section__title">Passengers</h2>
        <PassengerList passengers={pool.passengers} />
      </section>

      <ErrorMessage message={error} />

      {transition && (
        <button
          className="btn btn--primary btn--full"
          onClick={handleAdvance}
          disabled={advancing}
        >
          {advancing ? 'Updating…' : transition.label}
        </button>
      )}

      {pool.status === 'COMPLETED' && (
        <div className="completed-banner">
          ✅ Pool completed. Redirecting to dashboard…
        </div>
      )}
    </div>
  );
}
