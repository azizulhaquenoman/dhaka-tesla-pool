export default function DriverStatusToggle({ isOnline, loading, onToggle }) {
  return (
    <div className="driver-toggle">
      <span className={`online-dot ${isOnline ? 'online-dot--on' : ''}`} />
      <span className="driver-toggle__label">{isOnline ? 'Online' : 'Offline'}</span>
      <button
        className={`toggle-btn ${isOnline ? 'toggle-btn--go-offline' : 'toggle-btn--go-online'}`}
        onClick={onToggle}
        disabled={loading}
      >
        {loading ? 'Updating…' : isOnline ? 'Go offline' : 'Go online'}
      </button>
    </div>
  );
}
