import { useState } from 'react';
import { loginUser, registerUser, setStoredToken } from '../services/auth';
import './LoginPage.css';

/**
 * LoginPage Component
 *
 * Renders sign-in / registration for Parents or Students.
 * Validates inputs and authenticates credentials with the backend Express API.
 * On success, stores the JWT and invokes onLoginSuccess with authenticated user data.
 */
function LoginPage({ role = 'parent', onLoginSuccess, onBackToWelcome, onContinueGuest }) {
  const isStudent = role === 'student';

  // --- Auth mode: 'login' | 'register' ---
  const [authMode, setAuthMode] = useState('login');

  // --- Controlled input state ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // --- UI state ---
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Validation error messages ---
  const [errors, setErrors] = useState({
    displayName: '',
    email: '',
    password: '',
    general: '',
  });

  // ------------------------------------------------------------------
  // validate()
  // ------------------------------------------------------------------
  function validate() {
    const nextErrors = { displayName: '', email: '', password: '', general: '' };
    let isValid = true;

    if (authMode === 'register') {
      if (!displayName.trim() || displayName.trim().length < 2) {
        nextErrors.displayName = 'Display name must be at least 2 characters.';
        isValid = false;
      }
    }

    // 1. Email – required & basic format
    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    // 2. Password – required & min 8 chars for register
    if (!password) {
      nextErrors.password = 'Password is required.';
      isValid = false;
    } else if (authMode === 'register') {
      if (password.length < 8) {
        nextErrors.password = 'Password must be at least 8 characters long.';
        isValid = false;
      } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        nextErrors.password = 'Password must contain at least one letter and one number.';
        isValid = false;
      }
    }

    setErrors(nextErrors);
    return isValid;
  }

  // ------------------------------------------------------------------
  // handleSubmit()
  // ------------------------------------------------------------------
  async function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: '' }));

    try {
      let data;
      if (authMode === 'register') {
        data = await registerUser({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          role,
        });
      } else {
        data = await loginUser(email.trim(), password);
      }

      // Verify that the user has the required role
      if (data.user?.role !== role) {
        const expectedRoleName = isStudent ? 'Student' : 'Parent';
        const otherRoleName = isStudent ? 'Parent' : 'Student';
        setErrors((prev) => ({
          ...prev,
          general: `This sign-in is reserved for ${expectedRoleName} accounts. This account is registered as a ${otherRoleName}.`,
        }));
        setIsSubmitting(false);
        return;
      }

      // Store authenticated JWT token
      if (data.token) {
        setStoredToken(data.token);
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general: err.message || 'Authentication failed. Please check your credentials.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-icon">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <h1 className="login-brand-name">AI Productivity Coach</h1>
          <p className="login-brand-tagline">
            {isStudent
              ? 'Stay focused and reach your study goals during every computer session.'
              : 'Keep your children focused and safe during every device session.'}
          </p>

          <ul className="login-feature-list">
            {(isStudent
              ? [
                  'Start distraction-free study blocks',
                  'Pair your device with parent supervision',
                  'Track daily focus goals and streak milestones',
                ]
              : [
                  'Generate single-use device pairing codes',
                  'Monitor connected hardware in real time',
                  'Review session history and duration reports',
                ]
            ).map((text) => (
              <li key={text} className="login-feature-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-form-card">
          {onBackToWelcome && (
            <button
              type="button"
              className="login-back-btn"
              onClick={onBackToWelcome}
              aria-label="Back to role selection"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Role Selection</span>
            </button>
          )}

          {/* Card heading */}
          <div className="login-form-header">
            <h2 className="login-form-title">
              {isStudent
                ? authMode === 'register' ? 'Student Registration' : 'Student Sign In'
                : authMode === 'register' ? 'Parent Registration' : 'Parent Sign In'}
            </h2>
            <p className="login-form-subtitle">
              {isStudent
                ? 'Sign in to access your study portal & link with parent supervision.'
                : 'Sign in to access the supervision dashboard & pair devices.'}
            </p>
          </div>

          {/* Login / Register mode tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color, #334155)', paddingBottom: '10px' }}>
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setErrors({ displayName: '', email: '', password: '', general: '' }); }}
              style={{
                background: authMode === 'login' ? 'var(--primary-color, #4f46e5)' : 'transparent',
                color: authMode === 'login' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrors({ displayName: '', email: '', password: '', general: '' }); }}
              style={{
                background: authMode === 'register' ? 'var(--primary-color, #4f46e5)' : 'transparent',
                color: authMode === 'register' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form
            id="login-form"
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* General error banner */}
            {errors.general && (
              <div className="login-error-banner" role="alert">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errors.general}
              </div>
            )}

            {/* Display Name field (Registration only) */}
            {authMode === 'register' && (
              <div className="login-field-group">
                <label htmlFor="login-name" className="login-label">
                  Your Full Name
                </label>
                <input
                  id="login-name"
                  type="text"
                  className={`login-input ${errors.displayName ? 'login-input-error' : ''}`}
                  placeholder={isStudent ? 'e.g. Alex Smith' : 'e.g. Sarah Jenkins'}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
                {errors.displayName && (
                  <span className="login-field-error" role="alert">
                    {errors.displayName}
                  </span>
                )}
              </div>
            )}

            {/* Email field */}
            <div className="login-field-group">
              <label htmlFor="login-email" className="login-label">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className={`login-input ${errors.email ? 'login-input-error' : ''}`}
                placeholder={isStudent ? 'student@school.edu' : 'parent@family.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {errors.email && (
                <span className="login-field-error" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password field */}
            <div className="login-field-group">
              <label htmlFor="login-password" className="login-label">
                Password
              </label>
              <div className="login-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`login-input login-password-input ${errors.password ? 'login-input-error' : ''}`}
                  placeholder={authMode === 'register' ? 'Min 8 characters (letters & numbers)' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                />
                <button
                  id="login-toggle-password"
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.39 1 12a10.94 10.94 0 0 1 2.06-3.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.61 11 8-.57 1.52-1.43 2.89-2.49 4.06" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="login-field-error" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Submit button */}
            <button
              id="login-submit-btn"
              type="submit"
              className="login-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Processing…'
                : authMode === 'register' ? 'Create Account & Continue' : 'Sign In'}
            </button>

            {/* Guest mode option for students */}
            {isStudent && onContinueGuest && (
              <button
                type="button"
                onClick={onContinueGuest}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  background: 'transparent',
                  border: '1px solid var(--border-color, #475569)',
                  color: 'var(--text-secondary, #94a3b8)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Continue in Guest / Demo Mode &rarr;
              </button>
            )}
          </form>

          {/* Authentication notice */}
          <div className="login-demo-notice">
            <div className="login-demo-notice-header">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="8" />
                <line x1="12" y1="12" x2="12" y2="16" />
              </svg>
              Backend Authentication Active
            </div>
            <div className="login-demo-credentials" style={{ display: 'block', padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Securely connecting to Neon PostgreSQL. Passwords are encrypted with bcrypt and verified by the Express backend API.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
