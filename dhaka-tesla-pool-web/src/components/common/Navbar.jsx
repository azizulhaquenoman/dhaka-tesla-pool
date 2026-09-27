import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { logout } from '../../api/auth.js';

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); } finally {
      setUser(null);
      navigate('/login');
    }
  };

  if (!user) return null;

  const isDriver        = user.role === 'DRIVER';
  const dashboardPath   = isDriver ? '/driver/dashboard'  : '/passenger/dashboard';
  const historyPath     = isDriver ? '/driver/history'    : '/passenger/history';

  return (
    <nav className="navbar">
      <Link to={dashboardPath} className="navbar__brand">
        <span className="navbar__bolt">⚡</span>
        <span>Tesla Pool</span>
      </Link>

      <div className="navbar__links">
        <NavLink to={dashboardPath} className={({ isActive }) =>
          `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to={historyPath} className={({ isActive }) =>
          `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
          History
        </NavLink>
        {!isDriver && (
          <NavLink to="/passenger/request" className={({ isActive }) =>
            `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
            Book ride
          </NavLink>
        )}
      </div>

      <div className="navbar__user">
        <span className="navbar__name">{user.name.split(' ')[0]}</span>
        <span className={`role-pill ${isDriver ? 'role-pill--driver' : 'role-pill--passenger'}`}>
          {isDriver ? 'Driver' : 'Passenger'}
        </span>
        <button className="navbar__logout" onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
  );
}
