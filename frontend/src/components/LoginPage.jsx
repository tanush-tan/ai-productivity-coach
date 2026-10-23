import { useState } from 'react';
import './LoginPage.css';

// Demo-only credentials. No real authentication is performed.
const DEMO_EMAIL = 'parent@demo.com';
const DEMO_PASSWORD = 'Demo1234';

/**
 * LoginPage Component
 *
 * Renders the first screen a parent sees when opening the app.
 * Handles email + password input, show/hide password toggle,
 * frontend-only validation, and demo credential checking.
 *
 * On successful demo login, calls `onLoginSuccess()` so App.jsx
 * can switch to the dashboard view.
 */
function LoginPage({ onLoginSuccess }) {
  // --- Controlled input state ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- UI state ---
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Validation error messages ---
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });

  // ------------------------------------------------------------------
  // validate()
  // Runs all checks in order. Returns true only when every check passes.
  // Order of precedence:
  //   1. Empty-field checks (email, then password)
  //   2. Email format check
  //   3. Demo credential match  ← checked BEFORE the length rule so that
  //      a wrong email+valid-length password gives "Incorrect credentials",
  //      not a misleading "Password too short" message.
  //   4. Password length (only reached if credentials were not matched)
  // ------------------------------------------------------------------
  function validate() {
    const nextErrors = { email: '', password: '', general: '' };
    let isValid = true;

    // 1a. Email – required
    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      // 2. Email – basic format
      nextErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    // 1b. Password – required
    if (!password) {
      nextErrors.password = 'Password is required.';
      isValid = false;
    }

    // Stop here if either field is empty / malformed — no need to check credentials yet.
    if (!isValid) {
      setErrors(nextErrors);
      return false;
    }

    // 3. Demo credential match (checked before password-length rule)
    const emailMatch = email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase();
    const passwordMatch = password === DEMO_PASSWORD;

    if (!emailMatch || !passwordMatch) {
      nextErrors.general =
        'Incorrect email or password. Use the demo credentials below.';
      setErrors(nextErrors);
      return false;
    }

    // All checks passed
    setErrors(nextErrors);
    return true;
  }

  // ------------------------------------------------------------------
  // handleSubmit()
  // Called when the form is submitted. Prevents page reload, runs
  // validation, and — on success — briefly disables the button before
  // notifying the parent (App) to switch to the dashboard.
  // ------------------------------------------------------------------
  function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    // Briefly disable the button to prevent double-submission
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess();
    }, 400);
  }

  // ------------------------------------------------------------------
  // JSX
  // ------------------------------------------------------------------
  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-brand-panel">
        <div className="login-brand-content">
          {/* Shield icon — inline SVG, no library needed */}
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
            Keep your children focused and safe during every device session.
          </p>

          {/* Feature highlights */}
          <ul className="login-feature-list">
            {[
              'Monitor active device sessions in real time',
              'Review session history and duration reports',
              'Manage paired devices from one dashboard',
            ].map((text) => (
              <li key={text} className="login-feature-item">
                {/* Checkmark icon */}
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
          {/* Card heading */}
          <div className="login-form-header">
            <h2 className="login-form-title">Parent Sign In</h2>
            <p className="login-form-subtitle">
              Sign in to access the supervision dashboard.
            </p>
          </div>

          {/* Login form */}
          <form
            id="login-form"
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* General / credential mismatch error */}
            {errors.general && (
              <div className="login-error-banner" role="alert">
                {/* Warning icon */}
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

            {/* Email field */}
            <div className="login-field-group">
              <label htmlFor="login-email" className="login-label">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className={`login-input ${errors.email ? 'login-input-error' : ''}`}
                placeholder="parent@demo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
              {errors.email && (
                <span
                  id="login-email-error"
                  className="login-field-error"
                  role="alert"
                >
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                />
                {/* Show / Hide password toggle */}
                <button
                  id="login-toggle-password"
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    /* Eye-off icon */
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.39 1 12a10.94 10.94 0 0 1 2.06-3.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.61 11 8-.57 1.52-1.43 2.89-2.49 4.06" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span
                  id="login-password-error"
                  className="login-field-error"
                  role="alert"
                >
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
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials notice */}
          <div className="login-demo-notice">
            <div className="login-demo-notice-header">
              {/* Info icon */}
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
              Demo mode — no real account required
            </div>
            <div className="login-demo-credentials">
              <div className="login-demo-row">
                <span className="login-demo-key">Email</span>
                <code className="login-demo-value">{DEMO_EMAIL}</code>
              </div>
              <div className="login-demo-row">
                <span className="login-demo-key">Password</span>
                <code className="login-demo-value">{DEMO_PASSWORD}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
