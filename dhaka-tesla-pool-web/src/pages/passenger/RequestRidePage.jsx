import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestRide, getFareEstimate } from '../../api/passenger.js';
import ZoneSelect from '../../components/passenger/ZoneSelect.jsx';
import SeatSelector from '../../components/passenger/SeatSelector.jsx';
import FareCard from '../../components/passenger/FareCard.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';

export default function RequestRidePage() {
  const navigate = useNavigate();

  const [pickup,      setPickup]      = useState('');
  const [dropoff,     setDropoff]     = useState('');
  const [seats,       setSeats]       = useState(1);
  const [fare,        setFare]        = useState(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  // Live fare estimate whenever inputs change
  useEffect(() => {
    if (!pickup || !dropoff || pickup === dropoff) { setFare(null); return; }
    setFareLoading(true);
    getFareEstimate(pickup, dropoff, seats)
      .then(({ data }) => setFare(data.fare))
      .catch(() => setFare(null))
      .finally(() => setFareLoading(false));
  }, [pickup, dropoff, seats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pickup === dropoff) { setError('Pickup and dropoff must be different areas.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { data } = await requestRide({
        pickupZone: pickup, dropoffZone: dropoff, seatsRequested: seats,
      });
      navigate(`/passenger/ride/${data.ride.id}`);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not request ride. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h1 className="page__title">Book a pool ride</h1>
      </div>

      <form className="ride-form" onSubmit={handleSubmit}>
        <ZoneSelect
          id="pickup"
          label="Pickup area"
          value={pickup}
          onChange={setPickup}
        />
        <ZoneSelect
          id="dropoff"
          label="Dropoff area"
          value={dropoff}
          onChange={setDropoff}
          exclude={pickup}
        />
        <SeatSelector value={seats} onChange={setSeats} max={3} />

        {fareLoading && <p className="fare-loading">Calculating fare…</p>}
        {fare && <FareCard fare={fare} />}

        <ErrorMessage message={error} />

        <button
          type="submit"
          className="btn btn--primary btn--full"
          disabled={!pickup || !dropoff || submitting}
        >
          {submitting ? 'Requesting…' : 'Request pool ride'}
        </button>
      </form>
    </div>
  );
}
