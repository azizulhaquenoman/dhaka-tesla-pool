export const RIDE_STATUS = {
  REQUESTED: 'REQUESTED',
  MATCHED: 'MATCHED',
  DRIVER_ARRIVED: 'DRIVER_ARRIVED',
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const STATUS_LABEL = {
  REQUESTED: 'Looking for driver',
  MATCHED: 'Driver assigned',
  DRIVER_ARRIVED: 'Driver arrived',
  STARTED: 'Ride in progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const STATUS_CLASS = {
  REQUESTED: 'status--requested',
  MATCHED: 'status--matched',
  DRIVER_ARRIVED: 'status--arrived',
  STARTED: 'status--started',
  COMPLETED: 'status--completed',
  CANCELLED: 'status--cancelled',
};

// Driver CTA for each state
export const DRIVER_TRANSITIONS = {
  OPEN: { label: 'Close pool', next: 'MATCHED' },        // ADD
  MATCHED: { label: 'Mark Arrived', next: 'DRIVER_ARRIVED' },
  DRIVER_ARRIVED: { label: 'Start Ride', next: 'STARTED' },
  STARTED: { label: 'Complete Ride', next: 'COMPLETED' },
};

export const canCancel = (s) =>
  [RIDE_STATUS.REQUESTED, RIDE_STATUS.MATCHED].includes(s);

export const isActive = (s) =>
  [RIDE_STATUS.REQUESTED, RIDE_STATUS.MATCHED,
  RIDE_STATUS.DRIVER_ARRIVED, RIDE_STATUS.STARTED].includes(s);
