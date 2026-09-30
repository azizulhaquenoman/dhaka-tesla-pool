import { STATUS_LABEL, STATUS_CLASS } from '../../utils/rideStatus.js';

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${STATUS_CLASS[status] ?? ''}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
