import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, getMe } from '../api/auth.js';
import { useAuth } from '../hooks/useAuth.js';
import ErrorMessage from '../components/common/ErrorMessage.jsx';

export default function LoginPage() {
  const { setUser } = useAuth();
  const navigate    = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      const { data } = await getMe();
      setUser(data.user);
      navigate(data.user.role === 'DRIVER' ? '/driver/dashboard' : '/passenger/dashboard');
    } catch (err) {
      if (err.response?.status === 403) {
        // Email not verified — send to verification page
        const { data } = await getMe().catch(() => ({ data: { user: null } }));
        if (data.user) setUser(data.user);
        navigate('/verify-email');
        return;
      }
      setError(err.response?.data?.message ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__bolt">⚡</span>
          <h1 className="auth-card__title">Sign in</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-field__label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-field__input"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              autoFocus
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-field__input"
              value={form.password}
              onChange={set('password')}
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          <ErrorMessage message={error} />

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-card__footer">
          <Link to="/forgot-password" className="auth-card__link">Forgot password?</Link>
        </p>
        <p className="auth-card__footer">
          New here? <Link to="/register" className="auth-card__link">Create an account</Link>
        </p>

        <div className="demo-creds">
          <p className="demo-creds__title">Demo credentials</p>
          <p>Driver — jashim@tesla.pool / jashim123</p>
          <p>Passenger — nusrat@tesla.pool / nusrat123</p>
          <p>Passenger — rafiq@tesla.pool / rafiq123</p>
        </div>
      </div>
    </div>
  );
}
