export default function SeatSelector({ value, onChange, max = 3 }) {
  return (
    <div className="form-field">
      <label className="form-field__label">Seats needed</label>
      <div className="seat-selector" role="group" aria-label="Number of seats">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={`seat-btn ${value === n ? 'seat-btn--active' : ''}`}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
