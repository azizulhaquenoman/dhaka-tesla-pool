import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../api/auth.js';
import { useAuth } from '../hooks/useAuth.js';
import OtpInput from '../components/common/OtpInput.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';

export default function VerifyEmailPage() {
  const { user, refresh } = useAuth();
  const navigate          = useNavigate();

  const [otp,          setOtp]          = useState('');
  const [error,        setError]        = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [resending,    setResending]    = useState(false);
  const [resendMsg,    setResendMsg]    = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Enter the full 6-digit code.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await verifyEmail(otp);
      await refresh();
      navigate(user?.role === 'DRIVER' ? '/driver/dashboard' : '/passenger/dashboard');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid or expired code. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    setError('');
    try {
      await resendVerification();
      setResendMsg('A new code has been sent to your email.');
    } catch {
      setError('Could not resend. Try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__bolt">📧</span>
          <h1 className="auth-card__title">Verify your email</h1>
          <p className="auth-card__sub">
            We sent a 6-digit code to <strong>{user?.email ?? 'your email'}</strong>.
            Enter it below to activate your account.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleVerify}>
          <OtpInput value={otp} onChange={setOtp} length={6} />
          <ErrorMessage message={error} />
          {resendMsg && <p className="success-msg">{resendMsg}</p>}
          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={submitting || otp.length < 6}
          >
            {submitting ? 'Verifying…' : 'Verify email'}
          </button>
        </form>

        <p className="auth-card__footer">
          Didn't get the code?{' '}
          <button
            className="link-btn"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </p>
      </div>
    </div>
  );
}
