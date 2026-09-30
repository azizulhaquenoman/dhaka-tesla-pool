import { useState, useEffect } from 'react';
import { getDriverHistory } from '../../api/driver.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { paisaToTaka } from '../../utils/fare.js';

export default function DriverHistoryPage() {
  const [pools,   setPools]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getDriverHistory()
      .then(({ data }) => setPools(data.pools ?? []))
      .catch(() => setError('Could not load trip history.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Trip history</h1>
      </div>

      <ErrorMessage message={error} />

      {!pools.length ? (
        <EmptyState
          icon="🗂️"
          title="No trips yet"
          description="Completed pools will appear here once you finish your first ride."
        />
      ) : (
        <div className="rides-list">
          {pools.map((pool) => (
            <article key={pool.id} className="ride-card">
              <div className="ride-card__top">
                <StatusBadge status={pool.status} />
                <time className="ride-card__date" dateTime={pool.createdAt}>
                  {new Date(pool.createdAt).toLocaleDateString('en-BD', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </time>
              </div>
              <div className="ride-card__bottom">
                <span>
                  {pool.passengerCount} passenger{pool.passengerCount !== 1 ? 's' : ''}
                </span>
                {pool.totalFarePaisa != null && (
                  <span className="ride-card__fare">
                    {paisaToTaka(pool.totalFarePaisa)} collected
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
