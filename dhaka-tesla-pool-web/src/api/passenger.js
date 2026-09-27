import client from './client.js';

export const requestRide     = (body)            => client.post('/rides/request', body);
export const getActiveRide   = ()                => client.get('/rides/active');
export const getRideById     = (id)              => client.get(`/rides/${id}`);
export const cancelRide      = (id)              => client.patch(`/rides/${id}/cancel`);
export const getRideHistory  = ()                => client.get('/rides/history');
export const getFareEstimate = (pickup, dropoff, seats) =>
  client.get('/rides/fare-estimate', { params: { pickup, dropoff, seats } });
