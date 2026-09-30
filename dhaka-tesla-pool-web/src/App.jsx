import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/common/Navbar.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import PassengerDashboardPage from './pages/passenger/PassengerDashboardPage.jsx';
import RequestRidePage from './pages/passenger/RequestRidePage.jsx';
import TrackRidePage from './pages/passenger/TrackRidePage.jsx';
import PassengerHistoryPage from './pages/passenger/PassengerHistoryPage.jsx';
import DriverDashboardPage from './pages/driver/DriverDashboardPage.jsx';
import DriverRidePage from './pages/driver/DriverRidePage.jsx';
import DriverHistoryPage from './pages/driver/DriverHistoryPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main className="main">
          <Routes>
            {/* ── Public ─────────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* ── Auth-required (any role) ────────────────── */}
            <Route path="/verify-email" element={
              <ProtectedRoute><VerifyEmailPage /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />

            {/* ── Passenger ──────────────────────────────── */}
            <Route path="/passenger/dashboard" element={
              <RoleRoute role="PASSENGER"><PassengerDashboardPage /></RoleRoute>
            } />
            <Route path="/passenger/request" element={
              <RoleRoute role="PASSENGER"><RequestRidePage /></RoleRoute>
            } />
            <Route path="/passenger/ride/:id" element={
              <RoleRoute role="PASSENGER"><TrackRidePage /></RoleRoute>
            } />
            <Route path="/passenger/history" element={
              <RoleRoute role="PASSENGER"><PassengerHistoryPage /></RoleRoute>
            } />

            {/* ── Driver ─────────────────────────────────── */}
            <Route path="/driver/dashboard" element={
              <RoleRoute role="DRIVER"><DriverDashboardPage /></RoleRoute>
            } />
            <Route path="/driver/ride/:id" element={
              <RoleRoute role="DRIVER"><DriverRidePage /></RoleRoute>
            } />
            <Route path="/driver/history" element={
              <RoleRoute role="DRIVER"><DriverHistoryPage /></RoleRoute>
            } />

            {/* ── Fallback ───────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
