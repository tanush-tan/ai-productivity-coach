import './WelcomeScreen.css';

/**
 * WelcomeScreen Component
 *
 * Initial landing screen for the AI Productivity Coach application.
 * Allows users to choose between two role pathways:
 *   1. Parent / Guardian: Device supervision, monitoring, and family analytics.
 *   2. Student / Learner: Focus blocks, personal progress, and study timers.
 *
 * Props:
 *   onSelectRole — callback receiving ('parent' | 'student')
 */
function WelcomeScreen({ onSelectRole }) {
  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <div className="welcome-brand">
          <div className="welcome-brand-icon" aria-hidden="true">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="welcome-brand-text">
            <h1 className="welcome-title">AI Productivity Coach</h1>
            <p className="welcome-tagline">
              Parent-supervised device sessions & distraction-free student focus
            </p>
          </div>
        </div>
      </header>

      <main className="welcome-main">
        <div className="welcome-intro">
          <span className="welcome-badge">Welcome &amp; Role Setup</span>
          <h2 className="welcome-heading">Select your role to get started</h2>
          <p className="welcome-subheading">
            Choose how you would like to use AI Productivity Coach on this device.
            You can switch roles at any time.
          </p>
        </div>

        <div className="welcome-roles-grid">
          {/* Parent Role Card */}
          <article
            className="role-card role-card-parent"
            tabIndex={0}
            role="button"
            aria-label="Continue as Parent or Guardian"
            onClick={() => onSelectRole('parent')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectRole('parent');
              }
            }}
          >
            <div className="role-card-header">
              <div className="role-card-icon role-icon-parent" aria-hidden="true">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="role-card-pill">Supervision &amp; Admin</span>
            </div>

            <div className="role-card-body">
              <h3 className="role-card-title">Parent / Guardian</h3>
              <p className="role-card-desc">
                Supervise active device sessions, pair family computers, and
                review long-term study trends and productivity analytics.
              </p>

              <ul className="role-features-list">
                <li className="role-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Real-time device &amp; session supervision</span>
                </li>
                <li className="role-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Detailed focus scores &amp; app activity logs</span>
                </li>
                <li className="role-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Family analytics &amp; shareable report exports</span>
                </li>
              </ul>
            </div>

            <div className="role-card-footer">
              <button
                type="button"
                className="role-card-btn btn-parent"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRole('parent');
                }}
              >
                <span>Continue as Parent</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </article>

          {/* Student Role Card */}
          <article
            className="role-card role-card-student"
            tabIndex={0}
            role="button"
            aria-label="Continue as Student or Learner"
            onClick={() => onSelectRole('student')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectRole('student');
              }
            }}
          >
            <div className="role-card-header">
              <div className="role-card-icon role-icon-student" aria-hidden="true">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <path d="M9 10h6" />
                  <path d="M9 14h4" />
                </svg>
              </div>
              <span className="role-card-pill pill-student">Focus &amp; Study</span>
            </div>

            <div className="role-card-body">
              <h3 className="role-card-title">Student / Learner</h3>
              <p className="role-card-desc">
                Start structured focus sessions, work distraction-free on authorized
                tools, and track your daily study goals and milestones.
              </p>

              <ul className="role-features-list">
                <li className="role-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Start and conclude study focus blocks</span>
                </li>
                <li className="role-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Whitelisted academic tools and timers</span>
                </li>
                <li className="role-feature-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Personal focus score &amp; achievement streaks</span>
                </li>
              </ul>
            </div>

            <div className="role-card-footer">
              <button
                type="button"
                className="role-card-btn btn-student"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRole('student');
                }}
              >
                <span>Continue as Student</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </article>
        </div>
      </main>

      <footer className="welcome-footer">
        <p className="welcome-footer-note">
          Supervised sessions adhere to agreed parental consent and transparent productivity monitoring.
        </p>
      </footer>
    </div>
  );
}

export default WelcomeScreen;
