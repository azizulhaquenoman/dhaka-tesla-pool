import client from './client.js';

export const toggleOnline       = (status)             => client.patch('/driver/status', { status });
export const getDriverStatus    = ()                   => client.get('/driver/status');
export const getIncomingRequests = ()                  => client.get('/driver/requests');
export const acceptRequest      = (rideId)             => client.patch(`/driver/rides/${rideId}/accept`);
export const advancePoolStatus  = (poolId, status)     => client.patch(`/driver/pool/${poolId}/status`, { status });
export const getActivePool      = ()                   => client.get('/driver/pool/active');
export const getDriverHistory   = ()                   => client.get('/driver/history');
