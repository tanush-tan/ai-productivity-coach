import { useState } from 'react';
import './StudentTimer.css';

/**
 * StudentTimer Component
 *
 * Provides a dedicated, distraction-free study timer interface:
 *   - Subject selector & optional study goal input (when idle)
 *   - Accurate wall-clock elapsed time display
 *   - Start, Pause, Resume, and End session controls
 *   - Status pill (Active vs Paused vs Idle)
 *   - Confirmation dialog before ending a session
 *   - Post-session completion summary modal
 *   - Clear disclaimer that tracking is self-directed and manual
 */
function StudentTimer({
  profile,
  deviceName,
  timerState,
  elapsedSeconds,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onEndTimer,
  onViewHistory,
  onBackToDashboard,
}) {
  const subjectsList = [
    'Mathematics',
    'Science',
    'Social Studies',
    'Literature',
    'Languages',
    'Computer Science',
    'General Study',
  ];

  // Local form inputs for setting up a new session
  const [selectedSubject, setSelectedSubject] = useState(timerState.subject || 'Mathematics');
  const [goalText, setGoalText] = useState(timerState.goal || '');

  // Modals state
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [completedSummary, setCompletedSummary] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [endError, setEndError] = useState('');

  // Formatting helpers
  function formatDisplayTime(totalSecs) {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (num) => String(num).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }

  async function handleStartClick(e) {
    e.preventDefault();
    try {
      setIsStarting(true);
      setStartError('');
      await onStartTimer(selectedSubject, goalText);
    } catch (err) {
      setStartError(err.message || 'Failed to start study session.');
    } finally {
      setIsStarting(false);
    }
  }

  function handleEndClick() {
    setEndError('');
    setShowEndConfirm(true);
  }

  async function handleConfirmEnd() {
    try {
      setIsEnding(true);
      setEndError('');
      const recordedSession = await onEndTimer();
      setShowEndConfirm(false);
      setCompletedSummary(recordedSession);
    } catch (err) {
      setEndError(err.message || 'Failed to end study session.');
    } finally {
      setIsEnding(false);
    }
  }

  return (
    <div className="student-timer-view">
      {/* 1. Timer Setup Card (Shown when Idle) */}
      {timerState.status === 'idle' && (
        <div className="timer-setup-card">
          <div className="setup-header">
            <span className="setup-badge">Self-Directed Study</span>
            <h2 className="setup-title">Start a Focused Study Session</h2>
            <p className="setup-subtitle">
              Choose your subject and set an optional focus goal. Your study time will be tracked accurately.
            </p>
          </div>

          <form className="timer-setup-form" onSubmit={handleStartClick}>
            <div className="form-group">
              <label htmlFor="subject-select" className="form-label">
                Select Subject
              </label>
              <div className="subject-chips-row">
                {subjectsList.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    className={`subject-chip ${selectedSubject === subj ? 'chip-active' : ''}`}
                    onClick={() => setSelectedSubject(subj)}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="goal-input" className="form-label">
                Optional Study Goal or Topic
              </label>
              <input
                id="goal-input"
                type="text"
                className="goal-input"
                placeholder="e.g. Solve Chapter 4 calculus practice problems"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                maxLength={80}
              />
              <span className="form-helper">
                This helps you stay focused on your specific homework objective.
              </span>
            </div>

            {/* Standby clock display */}
            <div className="standby-clock-wrap">
              <span className="standby-digits">00:00</span>
              <span className="standby-label">Ready to begin</span>
            </div>

            {startError && (
              <div
                className="timer-error-msg"
                role="alert"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fca5a5',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {startError}
              </div>
            )}

            <div className="setup-actions">
              <button type="submit" className="start-session-btn" disabled={isStarting}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>{isStarting ? 'Starting Session…' : 'Start Focus Session'}</span>
              </button>
            </div>
          </form>

          <div className="manual-notice-box">
            <div className="notice-icon" aria-hidden="true">ℹ</div>
            <p className="notice-text">
              <strong>Notice:</strong> This session timer is managed manually by you. It does not monitor software applications, inspect browser tabs, or track background device activity.
            </p>
          </div>
        </div>
      )}

      {/* 2. Active / Paused Timer Display */}
      {timerState.status !== 'idle' && (
        <div className={`timer-active-card ${timerState.status === 'running' ? 'card-running' : 'card-paused'}`}>
          <div className="active-header">
            <div className="active-meta-left">
              <span className={`status-indicator-pill ${timerState.status === 'running' ? 'pill-active' : 'pill-paused'}`}>
                <span className="pill-pulse" aria-hidden="true" />
                {timerState.status === 'running' ? 'Session In Progress' : 'Session Paused'}
              </span>
              <span className="active-subject-badge">{timerState.subject}</span>
            </div>

            <span className="active-device-note">
              Supervised on {deviceName || profile?.device || 'Student Device'}
            </span>
          </div>

          {timerState.goal && (
            <div className="active-goal-box">
              <span className="goal-box-label">Goal:</span>
              <span className="goal-box-text">&ldquo;{timerState.goal}&rdquo;</span>
            </div>
          )}

          {/* Giant Live Elapsed Clock */}
          <div className="active-digits-container" aria-live="polite">
            <span className="active-digits">{formatDisplayTime(elapsedSeconds)}</span>
            <span className="active-digits-label">
              {timerState.status === 'running' ? 'Elapsed Focus Time' : 'Timer Paused'}
            </span>
          </div>

          {/* Timer Action Buttons */}
          <div className="active-controls-row">
            {timerState.status === 'running' ? (
              <button
                type="button"
                className="control-btn btn-pause"
                onClick={onPauseTimer}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                <span>Pause</span>
              </button>
            ) : (
              <button
                type="button"
                className="control-btn btn-resume"
                onClick={onResumeTimer}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Resume</span>
              </button>
            )}

            <button
              type="button"
              className="control-btn btn-end"
              onClick={handleEndClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              <span>End Session</span>
            </button>
          </div>

          <div className="active-tip-footer">
            <span className="tip-dot" aria-hidden="true" />
            <span>
              Tip: Keep your notes and designated reference tabs organized. Take a quick stretch break when you finish!
            </span>
          </div>
        </div>
      )}

      {/* 3. Confirmation Dialog before Ending Session */}
      {showEndConfirm && (
        <div className="timer-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="end-confirm-title">
          <div className="timer-modal-card">
            <div className="modal-icon-wrap" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </div>
            <h2 id="end-confirm-title" className="modal-title">End this Study Session?</h2>
            <p className="modal-desc">
              You have studied for <strong>{formatDisplayTime(elapsedSeconds)}</strong> on <strong>{timerState.subject}</strong>.
              Ending the session will save it to your completed study records and update today&apos;s goal progress.
            </p>

            {endError && (
              <div
                className="timer-error-msg"
                role="alert"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fca5a5',
                  fontSize: '13px',
                  marginBottom: '14px',
                }}
              >
                {endError}
              </div>
            )}

            <div className="modal-actions-row">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => {
                  setEndError('');
                  setShowEndConfirm(false);
                }}
                disabled={isEnding}
              >
                Keep Studying
              </button>
              <button
                type="button"
                className="modal-btn-confirm"
                onClick={handleConfirmEnd}
                disabled={isEnding}
              >
                {isEnding ? 'Saving…' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Post-Session Completion Summary Modal */}
      {completedSummary && (
        <div className="timer-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="summary-title">
          <div className="timer-modal-card summary-card-accent">
            <div className="summary-celebration-badge" aria-hidden="true">
              🎉
            </div>
            <h2 id="summary-title" className="modal-title">Focus Block Completed!</h2>
            <p className="modal-desc">
              Great work! Your study session was recorded and contributed to your daily goal.
            </p>

            <div className="summary-stats-box">
              <div className="summary-stat-row">
                <span className="stat-label">Subject</span>
                <span className="stat-value">{completedSummary.subject}</span>
              </div>
              <div className="summary-stat-row">
                <span className="stat-label">Total Duration</span>
                <span className="stat-value highlight-value">{completedSummary.durationText}</span>
              </div>
              {completedSummary.title !== `${completedSummary.subject} Focus Session` && (
                <div className="summary-stat-row">
                  <span className="stat-label">Topic / Goal</span>
                  <span className="stat-value">{completedSummary.title}</span>
                </div>
              )}
              <div className="summary-stat-row">
                <span className="stat-label">Focus Rating</span>
                <span className="stat-value score-value">
                  {completedSummary.focusScore} <small>(Simulated)</small>
                </span>
              </div>
              <div className="summary-stat-row">
                <span className="stat-label">Recorded At</span>
                <span className="stat-value">{completedSummary.time}</span>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => {
                  setCompletedSummary(null);
                  onViewHistory();
                }}
              >
                View in History
              </button>
              <button
                type="button"
                className="modal-btn-confirm"
                onClick={() => {
                  setCompletedSummary(null);
                  onBackToDashboard();
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentTimer;
