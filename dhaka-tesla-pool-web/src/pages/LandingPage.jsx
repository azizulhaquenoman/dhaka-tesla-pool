import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) {
    return <Navigate to={user.role === 'DRIVER' ? '/driver/dashboard' : '/passenger/dashboard'} replace />;
  }

  return (
    <div className="landing">
      <section className="landing__hero">
        <p className="landing__kicker">Dhaka · Electric · Pooled</p>
        <h1 className="landing__headline">
          Share a seat.<br />
          Split the fare.<br />
          Survive Dhaka traffic.
        </h1>
        <p className="landing__body">
          Battery-powered pool rides across Dhaka's key zones.
          No surge pricing. Always shared.
        </p>
        <div className="landing__cta">
          <Link to="/register" className="btn btn--primary btn--lg">Book a ride</Link>
          <Link to="/login"    className="btn btn--ghost   btn--lg">Sign in</Link>
        </div>
      </section>

      <section className="landing__features">
        <div className="feature-card">
          <span className="feature-card__icon">⚡</span>
          <h3 className="feature-card__title">Electric only</h3>
          <p className="feature-card__body">
            Every Bullet on the platform is battery-powered. Cleaner commutes, quieter rides.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-card__icon">👥</span>
          <h3 className="feature-card__title">True pooling</h3>
          <p className="feature-card__body">
            Share with passengers heading the same way. The fare is split fairly — you pay less, driver earns more.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-card__icon">🗺️</span>
          <h3 className="feature-card__title">Fixed Dhaka zones</h3>
          <p className="feature-card__body">
            Banani, Gulshan, Mohakhali, Dhanmondi and more — clear pickup/dropoff zones, no pin-dropping required.
          </p>
        </div>
      </section>
    </div>
  );
}
