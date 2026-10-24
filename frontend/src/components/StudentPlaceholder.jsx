import './StudentPlaceholder.css';

/**
 * StudentPlaceholder Component
 *
 * Displays a clean, clearly-labeled milestone preview for the Student role.
 * Informs the user that the full student dashboard (focus blocks, timers,
 * distraction whitelists) will be introduced in the subsequent milestone.
 *
 * Props:
 *   onBackToWelcome — callback to return to the Welcome / Role selection screen
 */
function StudentPlaceholder({ onBackToWelcome }) {
  return (
    <div className="student-placeholder-page">
      <header className="student-placeholder-header">
        <button
          type="button"
          className="student-back-btn"
          onClick={onBackToWelcome}
          aria-label="Return to role selection"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Back to Role Selection</span>
        </button>

        <div className="student-header-badge">
          <span>Student Workspace · Milestone Preview</span>
        </div>
      </header>

      <main className="student-placeholder-main">
        <div className="student-placeholder-card">
          <div className="student-card-icon" aria-hidden="true">
            <svg
              width="36"
              height="36"
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

          <span className="student-preview-pill">Next Milestone</span>
          <h1 className="student-placeholder-title">Student Portal Coming Soon</h1>
          <p className="student-placeholder-desc">
            The student portal is planned for the next development phase. It will feature
            structured study focus blocks, authorized study tools, personal timers, and
            focus streak rewards.
          </p>

          <div className="student-upcoming-box">
            <h2 className="student-upcoming-title">Upcoming Student Features:</h2>
            <ul className="student-upcoming-list">
              <li>
                <span className="upcoming-dot" aria-hidden="true" />
                <span>Student sign-in and device pairing approval</span>
              </li>
              <li>
                <span className="upcoming-dot" aria-hidden="true" />
                <span>One-click Start &amp; End focus sessions</span>
              </li>
              <li>
                <span className="upcoming-dot" aria-hidden="true" />
                <span>Personal focus streak and milestone tracking</span>
              </li>
              <li>
                <span className="upcoming-dot" aria-hidden="true" />
                <span>Active session distraction shield</span>
              </li>
            </ul>
          </div>

          <div className="student-placeholder-actions">
            <button
              type="button"
              className="student-primary-btn"
              onClick={onBackToWelcome}
            >
              <span aria-hidden="true">&larr;</span>
              <span>Return to Role Selection</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentPlaceholder;
