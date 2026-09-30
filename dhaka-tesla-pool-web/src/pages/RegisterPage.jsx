import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth.js';
import { useAuth } from '../hooks/useAuth.js';
import ErrorMessage from '../components/common/ErrorMessage.jsx';

export default function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await register(form.name, form.email, form.password);
      setUser(data.user);           // use data from register response directly
      navigate('/verify-email');    // no getMe() call needed
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__bolt">⚡</span>
          <h1 className="auth-card__title">Create account</h1>
          <p className="auth-card__sub">Passengers only — drivers are onboarded by Tesla Pool.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-field__label" htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              className="form-field__input"
              value={form.name}
              onChange={set('name')}
              autoComplete="name"
              autoFocus
              required
              placeholder="Nusrat Jahan"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-field__input"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
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
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="8 or more characters"
            />
          </div>

          <ErrorMessage message={error} />

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
