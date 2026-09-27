export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-msg" role="alert">
      <span className="error-msg__text">{message}</span>
      {onRetry && (
        <button className="error-msg__retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
