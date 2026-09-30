import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
  toggleOnline, getDriverStatus, getIncomingRequests,
  acceptRequest, getActivePool,
} from '../../api/driver.js';
import DriverStatusToggle from '../../components/driver/DriverStatusToggle.jsx';
import PoolRequestCard from '../../components/driver/PoolRequestCard.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function DriverDashboardPage() {
  const { user } = useAuth();

  const [isOnline,    setIsOnline]    = useState(false);
  const [requests,    setRequests]    = useState([]);
  const [activePool,  setActivePool]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [toggling,    setToggling]    = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [error,       setError]       = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, reqRes, poolRes] = await Promise.allSettled([
        getDriverStatus(),
        getIncomingRequests(),
        getActivePool(),
      ]);
      if (statusRes.status === 'fulfilled')
        setIsOnline(statusRes.value.data.status === 'ONLINE');
      if (reqRes.status === 'fulfilled')
        setRequests(reqRes.value.data.requests ?? []);
      if (poolRes.status === 'fulfilled')
        setActivePool(poolRes.value.data.pool ?? null);
    } catch {
      setError('Failed to load driver state.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 8000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleToggle = async () => {
    setToggling(true);
    setError('');
    try {
      const next = isOnline ? 'OFFLINE' : 'ONLINE';
      await toggleOnline(next);
      setIsOnline(!isOnline);
    } catch {
      setError('Could not update availability.');
    } finally {
      setToggling(false);
    }
  };

  const handleAccept = async (rideId) => {
    setAcceptingId(rideId);
    setError('');
    try {
      const { data } = await acceptRequest(rideId);
      setActivePool(data.pool);
      setRequests([]);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Could not accept request.');
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Dashboard</h1>
          <p className="page__sub">Bullet · {user.teslaName ?? 'Tesla'}</p>
        </div>
        <DriverStatusToggle isOnline={isOnline} loading={toggling} onToggle={handleToggle} />
      </div>

      <ErrorMessage message={error} />

      {/* Active pool banner */}
      {activePool && (
        <section className="page__section">
          <h2 className="section__title">Active pool</h2>
          <div className="active-pool-card">
            <p className="active-pool-card__seats">
              {activePool.seatsOccupied} / {activePool.capacity} seats occupied
            </p>
            <Link to={`/driver/ride/${activePool.id}`} className="btn btn--primary">
              Manage pool →
            </Link>
          </div>
        </section>
      )}

      {/* Incoming requests (only when online and no active pool) */}
      {!activePool && isOnline && (
        <section className="page__section">
          <h2 className="section__title">Incoming requests</h2>
          {!requests.length ? (
            <EmptyState
              icon="📡"
              title="Waiting for requests"
              description="New pool requests matching Bullet's corridor will appear here."
            />
          ) : (
            <div className="requests-list">
              {requests.map((r) => (
                <PoolRequestCard
                  key={r.id}
                  request={r}
                  onAccept={handleAccept}
                  accepting={acceptingId === r.id}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Offline and idle */}
      {!isOnline && !activePool && (
        <EmptyState
          icon="🔌"
          title="You're offline"
          description="Go online to start receiving pool ride requests."
        />
      )}
    </div>
  );
}
