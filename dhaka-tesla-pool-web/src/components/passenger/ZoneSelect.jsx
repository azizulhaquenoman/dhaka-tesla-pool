import { DHAKA_ZONES } from '../../utils/zones.js';

export default function ZoneSelect({ id, label, value, onChange, exclude }) {
  const zones = exclude ? DHAKA_ZONES.filter((z) => z.id !== exclude) : DHAKA_ZONES;
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>{label}</label>
      <select
        id={id}
        className="form-field__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">Select area</option>
        {zones.map((z) => (
          <option key={z.id} value={z.id}>{z.label}</option>
        ))}
      </select>
    </div>
  );
}
