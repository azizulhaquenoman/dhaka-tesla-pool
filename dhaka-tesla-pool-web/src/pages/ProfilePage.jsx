import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import {
  getProfile, updateName,
  requestEmailChange, verifyCurrentEmailOtp, verifyNewEmailOtp,
  requestPhoneOtp, verifyPhoneOtp,
} from '../api/profile.js';
import OtpInput from '../components/common/OtpInput.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

// Email change has 3 steps
const EMAIL_STEP = {
  IDLE:         'IDLE',         // default — show "Change email" button
  ENTER:        'ENTER',        // enter new email + current password
  CURRENT_OTP:  'CURRENT_OTP', // OTP sent to current email — verify it
  NEW_OTP:      'NEW_OTP',      // OTP sent to new email — verify it
  DONE:         'DONE',
};

// Phone has 2 steps
const PHONE_STEP = {
  IDLE:  'IDLE',
  ENTER: 'ENTER', // enter phone number
  OTP:   'OTP',   // WhatsApp OTP
  DONE:  'DONE',
};

export default function ProfilePage() {
  const { user, refresh } = useAuth();

  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);

  // Name section
  const [name,         setName]         = useState('');
  const [nameSaving,   setNameSaving]   = useState(false);
  const [nameMsg,      setNameMsg]      = useState('');
  const [nameErr,      setNameErr]      = useState('');

  // Email change section
  const [emailStep,    setEmailStep]    = useState(EMAIL_STEP.IDLE);
  const [newEmail,     setNewEmail]     = useState('');
  const [currentPass,  setCurrentPass]  = useState('');
  const [currentOtp,   setCurrentOtp]   = useState('');
  const [newOtp,       setNewOtp]       = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailErr,     setEmailErr]     = useState('');

  // Phone section
  const [phoneStep,    setPhoneStep]    = useState(PHONE_STEP.IDLE);
  const [phone,        setPhone]        = useState('');
  const [phoneOtp,     setPhoneOtp]     = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneErr,     setPhoneErr]     = useState('');

  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        setProfile(data.user);
        setName(data.user.name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Name save ────────────────────────────────────────────────
  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setNameErr('Name cannot be empty.'); return; }
    setNameSaving(true);
    setNameErr('');
    setNameMsg('');
    try {
      await updateName(name.trim());
      await refresh();
      setNameMsg('Name updated.');
    } catch (err) {
      setNameErr(err.response?.data?.message ?? 'Could not update name.');
    } finally {
      setNameSaving(false);
    }
  };

  // ── Email change: Step 1 — send OTP to current email ────────
  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmail || !currentPass) { setEmailErr('Fill in all fields.'); return; }
    setEmailLoading(true);
    setEmailErr('');
    try {
      await requestEmailChange(newEmail, currentPass);
      setEmailStep(EMAIL_STEP.CURRENT_OTP);
    } catch (err) {
      setEmailErr(err.response?.data?.message ?? 'Could not initiate email change.');
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Email change: Step 2 — verify current email OTP ─────────
  const handleVerifyCurrentOtp = async (e) => {
    e.preventDefault();
    if (currentOtp.length < 6) { setEmailErr('Enter the full 6-digit code.'); return; }
    setEmailLoading(true);
    setEmailErr('');
    try {
      await verifyCurrentEmailOtp(currentOtp);
      setEmailStep(EMAIL_STEP.NEW_OTP);
    } catch (err) {
      setEmailErr(err.response?.data?.message ?? 'Invalid or expired code.');
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Email change: Step 3 — verify new email OTP ─────────────
  const handleVerifyNewOtp = async (e) => {
    e.preventDefault();
    if (newOtp.length < 6) { setEmailErr('Enter the full 6-digit code.'); return; }
    setEmailLoading(true);
    setEmailErr('');
    try {
      await verifyNewEmailOtp(newOtp);
      await refresh();
      setEmailStep(EMAIL_STEP.DONE);
      setProfile((p) => ({ ...p, email: newEmail }));
    } catch (err) {
      setEmailErr(err.response?.data?.message ?? 'Invalid or expired code.');
    } finally {
      setEmailLoading(false);
    }
  };

  const resetEmailFlow = () => {
    setEmailStep(EMAIL_STEP.IDLE);
    setNewEmail(''); setCurrentPass('');
    setCurrentOtp(''); setNewOtp('');
    setEmailErr('');
  };

  // ── Phone: Step 1 — send WhatsApp OTP ───────────────────────
  const handleRequestPhoneOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { setPhoneErr('Enter a phone number.'); return; }
    setPhoneLoading(true);
    setPhoneErr('');
    try {
      await requestPhoneOtp(phone.trim());
      setPhoneStep(PHONE_STEP.OTP);
    } catch (err) {
      setPhoneErr(err.response?.data?.message ?? 'Could not send WhatsApp OTP.');
    } finally {
      setPhoneLoading(false);
    }
  };

  // ── Phone: Step 2 — verify WhatsApp OTP ─────────────────────
  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (phoneOtp.length < 6) { setPhoneErr('Enter the full 6-digit code.'); return; }
    setPhoneLoading(true);
    setPhoneErr('');
    try {
      await verifyPhoneOtp(phoneOtp);
      await refresh();
      setPhoneStep(PHONE_STEP.DONE);
      setProfile((p) => ({ ...p, phone }));
    } catch (err) {
      setPhoneErr(err.response?.data?.message ?? 'Invalid or expired code.');
    } finally {
      setPhoneLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h1 className="page__title">Profile</h1>
      </div>

      {/* ── Name ────────────────────────────────────────────── */}
      <section className="profile-section">
        <h2 className="section__title">Personal info</h2>
        <form className="auth-form" onSubmit={handleSaveName}>
          <div className="form-field">
            <label className="form-field__label" htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              className="form-field__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-field__label">Email</label>
            <input
              type="text"
              className="form-field__input form-field__input--readonly"
              value={profile?.email ?? ''}
              readOnly
              tabIndex={-1}
            />
          </div>
          <ErrorMessage message={nameErr} />
          {nameMsg && <p className="success-msg">{nameMsg}</p>}
          <button type="submit" className="btn btn--primary" disabled={nameSaving}>
            {nameSaving ? 'Saving…' : 'Save name'}
          </button>
        </form>
      </section>

      {/* ── Change email ─────────────────────────────────────── */}
      <section className="profile-section">
        <h2 className="section__title">Change email</h2>

        {emailStep === EMAIL_STEP.IDLE && (
          <button className="btn btn--ghost" onClick={() => setEmailStep(EMAIL_STEP.ENTER)}>
            Change email address
          </button>
        )}

        {emailStep === EMAIL_STEP.ENTER && (
          <form className="auth-form" onSubmit={handleRequestEmailChange}>
            <p className="profile-hint">
              Enter your new email and current password. We'll send a verification code to your <strong>current</strong> email first.
            </p>
            <div className="form-field">
              <label className="form-field__label" htmlFor="newEmail">New email</label>
              <input
                id="newEmail"
                type="email"
                className="form-field__input"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                autoFocus
                placeholder="new@example.com"
              />
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="currentPass">Current password</label>
              <input
                id="currentPass"
                type="password"
                className="form-field__input"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <ErrorMessage message={emailErr} />
            <div className="btn-row">
              <button type="submit" className="btn btn--primary" disabled={emailLoading}>
                {emailLoading ? 'Sending…' : 'Send verification code'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={resetEmailFlow}>Cancel</button>
            </div>
          </form>
        )}

        {emailStep === EMAIL_STEP.CURRENT_OTP && (
          <form className="auth-form" onSubmit={handleVerifyCurrentOtp}>
            <p className="profile-hint">
              Enter the code sent to your <strong>current</strong> email to confirm it's you.
            </p>
            <div className="form-field">
              <label className="form-field__label">Code from current email</label>
              <OtpInput value={currentOtp} onChange={setCurrentOtp} length={6} />
            </div>
            <ErrorMessage message={emailErr} />
            <div className="btn-row">
              <button type="submit" className="btn btn--primary" disabled={emailLoading || currentOtp.length < 6}>
                {emailLoading ? 'Verifying…' : 'Verify'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={resetEmailFlow}>Cancel</button>
            </div>
          </form>
        )}

        {emailStep === EMAIL_STEP.NEW_OTP && (
          <form className="auth-form" onSubmit={handleVerifyNewOtp}>
            <p className="profile-hint">
              Now enter the code sent to your <strong>new</strong> email ({newEmail}) to confirm ownership.
            </p>
            <div className="form-field">
              <label className="form-field__label">Code from new email</label>
              <OtpInput value={newOtp} onChange={setNewOtp} length={6} />
            </div>
            <ErrorMessage message={emailErr} />
            <div className="btn-row">
              <button type="submit" className="btn btn--primary" disabled={emailLoading || newOtp.length < 6}>
                {emailLoading ? 'Verifying…' : 'Confirm new email'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={resetEmailFlow}>Cancel</button>
            </div>
          </form>
        )}

        {emailStep === EMAIL_STEP.DONE && (
          <p className="success-msg">✅ Email updated to {newEmail}.</p>
        )}
      </section>

      {/* ── Phone number ─────────────────────────────────────── */}
      <section className="profile-section">
        <h2 className="section__title">Phone number</h2>

        {profile?.phone && phoneStep === PHONE_STEP.IDLE && (
          <p className="profile-current">Current: {profile.phone}</p>
        )}

        {phoneStep === PHONE_STEP.IDLE && (
          <button className="btn btn--ghost" onClick={() => setPhoneStep(PHONE_STEP.ENTER)}>
            {profile?.phone ? 'Change phone number' : 'Add phone number'}
          </button>
        )}

        {phoneStep === PHONE_STEP.ENTER && (
          <form className="auth-form" onSubmit={handleRequestPhoneOtp}>
            <p className="profile-hint">
              We'll send a 6-digit code via <strong>WhatsApp</strong> to verify your number.
            </p>
            <div className="form-field">
              <label className="form-field__label" htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                className="form-field__input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoFocus
                placeholder="+880 1X XX XXX XXX"
              />
            </div>
            <ErrorMessage message={phoneErr} />
            <div className="btn-row">
              <button type="submit" className="btn btn--primary" disabled={phoneLoading}>
                {phoneLoading ? 'Sending…' : 'Send WhatsApp code'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setPhoneStep(PHONE_STEP.IDLE)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {phoneStep === PHONE_STEP.OTP && (
          <form className="auth-form" onSubmit={handleVerifyPhoneOtp}>
            <p className="profile-hint">
              Enter the 6-digit code sent to <strong>{phone}</strong> via WhatsApp.
            </p>
            <div className="form-field">
              <label className="form-field__label">WhatsApp code</label>
              <OtpInput value={phoneOtp} onChange={setPhoneOtp} length={6} />
            </div>
            <ErrorMessage message={phoneErr} />
            <div className="btn-row">
              <button type="submit" className="btn btn--primary" disabled={phoneLoading || phoneOtp.length < 6}>
                {phoneLoading ? 'Verifying…' : 'Verify number'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setPhoneStep(PHONE_STEP.IDLE)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {phoneStep === PHONE_STEP.DONE && (
          <p className="success-msg">✅ Phone number {phone} verified.</p>
        )}
      </section>
    </div>
  );
}
