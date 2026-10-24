import './StudentSettings.css';

/**
 * StudentSettings Component
 *
 * Provides workspace settings & device telemetry status for the student:
 *   - Profile details (Liam Jenkins, Grade 7, Lincoln Middle School, Student ID)
 *   - Supervised device status (clearly identified as Demo Mode)
 *   - Focus session preferences & privacy notices
 *   - Switch Role / Exit Student Workspace action
 */
function StudentSettings({ profile, dailyGoalMinutes, sessionsCount, onSwitchRole }) {
  return (
    <div className="student-settings-view">
      {/* 1. Student Profile Card */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-avatar-wrap">
            <div className="settings-avatar-large" aria-hidden="true">
              {profile.initials}
            </div>
            <div>
              <h3 className="settings-profile-name">{profile.name}</h3>
              <span className="settings-profile-role">{profile.role}</span>
            </div>
          </div>
          <span className="profile-active-tag">Active Account</span>
        </div>

        <div className="settings-info-grid">
          <div className="settings-info-item">
            <span className="item-label">Grade / Year</span>
            <span className="item-value">{profile.grade}</span>
          </div>
          <div className="settings-info-item">
            <span className="item-label">School</span>
            <span className="item-value">{profile.school}</span>
          </div>
          <div className="settings-info-item">
            <span className="item-label">Student ID</span>
            <span className="item-value">{profile.studentId}</span>
          </div>
          <div className="settings-info-item">
            <span className="item-label">Active Device</span>
            <span className="item-value">{profile.device}</span>
          </div>
        </div>
      </div>

      {/* 2. Supervised Device & Host Connection Status */}
      <div className="settings-card">
        <div className="settings-section-head">
          <div>
            <h3 className="settings-title">Device &amp; Supervision Status</h3>
            <p className="settings-desc">Hardware connection telemetry with parental supervision</p>
          </div>
          <span className="settings-demo-pill" title="Demonstration state">
            Demo Host
          </span>
        </div>

        <div className="device-status-box">
          <div className="device-row">
            <div className="device-icon" aria-hidden="true">💻</div>
            <div className="device-details">
              <span className="device-name">{profile.device}</span>
              <span className="device-sub">Local Desktop Agent v1.4.2 · Connected</span>
            </div>
            <div className="device-state-indicator">
              <span className="device-dot" aria-hidden="true" />
              <span>Host Active</span>
            </div>
          </div>

          <div className="supervision-features-list">
            <div className="supervision-item">
              <span className="sup-icon" aria-hidden="true">🛡️</span>
              <div>
                <strong>Supervised Study Mode</strong>
                <p>Parental supervision is configured for scheduled study blocks.</p>
              </div>
            </div>
            <div className="supervision-item">
              <span className="sup-icon" aria-hidden="true">📊</span>
              <div>
                <strong>Shared Session Summaries</strong>
                <p>Completed study times and session goals are shared to the family dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Session & Privacy Preferences */}
      <div className="settings-card">
        <div className="settings-section-head">
          <div>
            <h3 className="settings-title">Workspace Configuration</h3>
            <p className="settings-desc">Summary of current student defaults</p>
          </div>
        </div>

        <div className="settings-table-list">
          <div className="settings-table-row">
            <span className="row-key">Daily Target</span>
            <span className="row-val">{dailyGoalMinutes} minutes ({Math.floor(dailyGoalMinutes / 60)}h {dailyGoalMinutes % 60}m)</span>
          </div>
          <div className="settings-table-row">
            <span className="row-key">Total Sessions Logged</span>
            <span className="row-val">{sessionsCount} focus sessions</span>
          </div>
          <div className="settings-table-row">
            <span className="row-key">Distraction Detection</span>
            <span className="row-val">Manual Mode (Prototype)</span>
          </div>
        </div>
      </div>

      {/* 4. Switch Role / Exit */}
      <div className="settings-card settings-exit-card">
        <div>
          <h3 className="exit-title">Switch Role or Sign Out</h3>
          <p className="exit-desc">
            Return to the role-selection welcome screen to switch to the Parent supervision dashboard.
          </p>
        </div>

        <button
          type="button"
          className="exit-role-btn"
          onClick={onSwitchRole}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Exit to Role Selection</span>
        </button>
      </div>
    </div>
  );
}

export default StudentSettings;
