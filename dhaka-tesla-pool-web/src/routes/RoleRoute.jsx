import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

/** Redirects to correct dashboard when role doesn't match */
export default function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullscreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (user.role !== role) {
    const dest = user.role === 'DRIVER' ? '/driver/dashboard' : '/passenger/dashboard';
    return <Navigate to={dest} replace />;
  }
  return children;
}
