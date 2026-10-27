import { useState } from 'react';
import './StudentHistory.css';

/**
 * StudentHistory Component
 *
 * Displays all completed study sessions:
 *   - Filter dropdown by Subject
 *   - Sessions list with date, time, subject, duration, simulated focus rating, and status
 *   - Immediate inclusion of sessions completed during the current timer session
 *   - Detail modal showing complete session metadata and focus notes
 *   - Empty state when filtered out or no sessions exist
 */
function StudentHistory({ sessions, onStartNewSession }) {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [activeModalSession, setActiveModalSession] = useState(null);

  // Extract unique subjects
  const subjectOptions = ['all', ...new Set(sessions.map((s) => s.subject))];

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    if (selectedSubjectFilter === 'all') return true;
    return s.subject === selectedSubjectFilter;
  });

  const totalFilteredMinutes = filteredSessions.reduce(
    (acc, s) => acc + s.durationMinutes,
    0
  );

  return (
    <div className="student-history-view">
      {/* 1. Header Toolbar */}
      <div className="history-toolbar">
        <div className="toolbar-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <h2 className="history-title" style={{ margin: 0 }}>Session History</h2>
            <span className="kpi-demo-badge" title="Historical demonstration records">Demo Records</span>
          </div>
          <p className="history-subtitle">
            {filteredSessions.length} sessions logged &bull; {Math.floor(totalFilteredMinutes / 60)}h{' '}
            {totalFilteredMinutes % 60}m total focused time
          </p>
        </div>

        <div className="toolbar-actions">
          <div className="filter-select-wrap">
            <label htmlFor="subject-filter" className="filter-label">
              Filter by Subject:
            </label>
            <select
              id="subject-filter"
              className="subject-select"
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            >
              <option value="all">All Subjects ({sessions.length})</option>
              {subjectOptions
                .filter((sub) => sub !== 'all')
                .map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
            </select>
          </div>

          <button
            type="button"
            className="history-new-btn"
            onClick={onStartNewSession}
          >
            <span>+ New Session</span>
          </button>
        </div>
      </div>

      {/* 2. Sessions List / Table */}
      {filteredSessions.length > 0 ? (
        <div className="history-card-panel">
          <div className="history-table-header">
            <span className="col-subject">Subject &amp; Activity</span>
            <span className="col-date">Date &amp; Time</span>
            <span className="col-duration">Duration</span>
            <span className="col-score">Focus Score</span>
            <span className="col-status">Status</span>
            <span className="col-action">Details</span>
          </div>

          <div className="history-list">
            {filteredSessions.map((session) => (
              <div key={session.id} className="history-row-item">
                <div className="col-subject col-content">
                  <div className="history-subject-icon" aria-hidden="true">
                    {session.subject.charAt(0)}
                  </div>
                  <div className="history-subject-info">
                    <span className="history-session-title">{session.title}</span>
                    <span className="history-session-subject">{session.subject}</span>
                    {session.isUserRecorded && (
                      <span className="live-recorded-badge">Recorded Today</span>
                    )}
                  </div>
                </div>

                <div className="col-date col-content">
                  <span className="row-date-text">{session.date}</span>
                  <span className="row-time-text">{session.time}</span>
                </div>

                <div className="col-duration col-content">
                  <span className="duration-pill">{session.durationText}</span>
                </div>

                <div className="col-score col-content">
                  <span className="focus-pill" title="Fictional simulated demonstration metric">
                    {session.focusScore}
                  </span>
                  <span className="simulated-tag">Simulated</span>
                </div>

                <div className="col-status col-content">
                  <span className="status-badge-completed">Completed</span>
                </div>

                <div className="col-action col-content">
                  <button
                    type="button"
                    className="view-details-btn"
                    onClick={() => setActiveModalSession(session)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="history-empty-state">
          <div className="empty-icon-wrap" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <h3 className="empty-title">No study sessions found</h3>
          <p className="empty-desc">
            {selectedSubjectFilter !== 'all'
              ? `No sessions recorded for "${selectedSubjectFilter}". Try selecting "All Subjects" or start a new study session.`
              : 'You haven’t completed any study sessions yet. Click below to start your first focus block!'}
          </p>
          <button
            type="button"
            className="empty-action-btn"
            onClick={onStartNewSession}
          >
            Start Focus Session
          </button>
        </div>
      )}

      {/* 3. Session Details Modal */}
      {activeModalSession && (
        <div
          className="history-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-session-title"
        >
          <div className="history-modal-card">
            <div className="modal-header-row">
              <div>
                <span className="modal-badge">{activeModalSession.subject}</span>
                <h3 id="modal-session-title" className="modal-session-title">
                  {activeModalSession.title}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setActiveModalSession(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="modal-details-grid">
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">{activeModalSession.date}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Start Time</span>
                <span className="detail-value">{activeModalSession.time}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Duration</span>
                <span className="detail-value text-highlight">
                  {activeModalSession.durationText}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value status-badge-completed">Completed</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Focus Rating</span>
                <span className="detail-value text-score">
                  {activeModalSession.focusScore}{' '}
                  <span className="sim-sub">(Simulated Demo)</span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Recording Mode</span>
                <span className="detail-value">
                  {activeModalSession.isUserRecorded ? 'User Timer Session' : 'Historical Demo Record'}
                </span>
              </div>
            </div>

            {activeModalSession.notes && (
              <div className="modal-notes-section">
                <h4 className="notes-heading">Study Notes &amp; Objectives:</h4>
                <p className="notes-content">{activeModalSession.notes}</p>
              </div>
            )}

            <div className="modal-disclaimer">
              <span>Notice:</span> Focus scores in this prototype are demonstration placeholders and do not imply real-time software analysis.
            </div>

            <div className="modal-footer-btn-row">
              <button
                type="button"
                className="modal-dismiss-btn"
                onClick={() => setActiveModalSession(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentHistory;
