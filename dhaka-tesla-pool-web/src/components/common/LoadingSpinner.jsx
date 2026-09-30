export default function LoadingSpinner({ fullscreen = false }) {
  if (fullscreen) {
    return (
      <div className="spinner-fullscreen" aria-label="Loading">
        <div className="spinner" />
      </div>
    );
  }
  return <div className="spinner" aria-label="Loading" />;
}
