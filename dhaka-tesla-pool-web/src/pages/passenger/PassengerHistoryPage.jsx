import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRideHistory } from '../../api/passenger.js';
import RideCard from '../../components/passenger/RideCard.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function PassengerHistoryPage() {
  const [rides,   setRides]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getRideHistory()
      .then(({ data }) => setRides(data.rides))
      .catch(() => setError('Could not load ride history.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Ride history</h1>
      </div>

      <ErrorMessage message={error} />

      {!rides.length ? (
        <EmptyState
          icon="🗂️"
          title="No rides yet"
          description="Your completed and cancelled rides will appear here."
          action={<Link to="/passenger/request" className="btn btn--primary">Book your first ride</Link>}
        />
      ) : (
        <div className="rides-list">
          {rides.map((ride) => <RideCard key={ride.id} ride={ride} />)}
        </div>
      )}
    </div>
  );
}
