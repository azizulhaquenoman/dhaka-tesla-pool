import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/auth.js';
import OtpInput from '../components/common/OtpInput.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';

const STEP = { EMAIL: 'EMAIL', RESET: 'RESET', DONE: 'DONE' };

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step,        setStep]        = useState(STEP.EMAIL);
  const [email,       setEmail]       = useState('');
  const [otp,         setOtp]         = useState('');
  const [password,    setPassword]    = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  // Step 1 — send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setStep(STEP.RESET);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not send reset code. Check the email address.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP + set new password
  const handleReset = async (e) => {
    e.preventDefault();
    if (otp.length < 6)          { setError('Enter the full 6-digit code.'); return; }
    if (password.length < 8)     { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPass) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email, otp, password);
      setStep(STEP.DONE);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid or expired code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Enter email ──────────────────────────────────────
  if (step === STEP.EMAIL) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <span className="auth-card__bolt">🔑</span>
            <h1 className="auth-card__title">Forgot password</h1>
            <p className="auth-card__sub">
              Enter your account email. We'll send a one-time code to reset your password.
            </p>
          </div>
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="form-field">
              <label className="form-field__label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-field__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
              />
            </div>
            <ErrorMessage message={error} />
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Sending code…' : 'Send reset code'}
            </button>
          </form>
          <p className="auth-card__footer">
            Remembered it? <Link to="/login" className="auth-card__link">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 2: Enter OTP + new password ────────────────────────
  if (step === STEP.RESET) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <span className="auth-card__bolt">🔑</span>
            <h1 className="auth-card__title">Reset password</h1>
            <p className="auth-card__sub">
              Enter the 6-digit code sent to <strong>{email}</strong> and choose a new password.
            </p>
          </div>
          <form className="auth-form" onSubmit={handleReset}>
            <div className="form-field">
              <label className="form-field__label">Verification code</label>
              <OtpInput value={otp} onChange={setOtp} length={6} />
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                className="form-field__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="8 or more characters"
              />
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="confirmPass">Confirm new password</label>
              <input
                id="confirmPass"
                type="password"
                className="form-field__input"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                required
                placeholder="Repeat password"
              />
            </div>
            <ErrorMessage message={error} />
            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={loading || otp.length < 6}
            >
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
          <p className="auth-card__footer">
            <button className="link-btn" onClick={() => { setStep(STEP.EMAIL); setError(''); }}>
              ← Use a different email
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__bolt">✅</span>
          <h1 className="auth-card__title">Password reset</h1>
          <p className="auth-card__sub">Your password has been updated. You can now sign in.</p>
        </div>
        <Link to="/login" className="btn btn--primary btn--full">Go to sign in</Link>
      </div>
    </div>
  );
}
