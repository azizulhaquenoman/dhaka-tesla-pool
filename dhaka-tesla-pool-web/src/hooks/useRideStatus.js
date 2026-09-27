import { useState, useEffect, useRef } from 'react';
import { getRideById } from '../api/passenger.js';
import { isActive } from '../utils/rideStatus.js';

/**
 * Polls ride status every `intervalMs` ms.
 * Stops polling once the ride reaches a terminal state.
 */
export function useRideStatus(rideId, intervalMs = 5000) {
  const [ride, setRide]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const timerRef            = useRef(null);

  const fetch = async () => {
    try {
      const { data } = await getRideById(rideId);
      setRide(data.ride);
      setError(null);
      if (!isActive(data.ride.status)) clearInterval(timerRef.current);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load ride.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rideId) return;
    fetch();
    timerRef.current = setInterval(fetch, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [rideId]); // eslint-disable-line

  return { ride, loading, error };
}
