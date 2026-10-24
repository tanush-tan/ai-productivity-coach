import { useState } from 'react';
import './StudentGoals.css';

/**
 * StudentGoals Component
 *
 * Manages daily study targets & focus milestones:
 *   - Visual progress toward today's goal (live updated with timer sessions)
 *   - Target configuration form with presets (60m, 90m, 120m, 150m) and custom input validation
 *   - Weekly habit streaks
 *   - Quick action to jump straight into a study session
 */
function StudentGoals({
  dailyGoalMinutes,
  todayStudyMinutes,
  todayGoalPercent,
  onUpdateGoal,
  onStartSessionClick,
}) {
  const [customInput, setCustomInput] = useState(dailyGoalMinutes.toString());
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Target presets
  const presets = [
    { label: '45 mins (Short)', value: 45 },
    { label: '60 mins (1 hr)', value: 60 },
    { label: '90 mins (1.5 hrs)', value: 90 },
    { label: '120 mins (2 hrs)', value: 120 },
    { label: '150 mins (2.5 hrs)', value: 150 },
    { label: '180 mins (3 hrs)', value: 180 },
  ];

  function handlePresetSelect(val) {
    setCustomInput(val.toString());
    setErrorMsg('');
    onUpdateGoal(val);
    setFeedbackMsg(`Daily study target updated to ${val} minutes.`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const parsed = parseInt(customInput, 10);
    if (isNaN(parsed) || parsed < 15 || parsed > 480) {
      setErrorMsg('Please enter a realistic target between 15 and 480 minutes (8 hours).');
      setFeedbackMsg('');
      return;
    }

    setErrorMsg('');
    onUpdateGoal(parsed);
    setFeedbackMsg(`Daily study target successfully updated to ${parsed} minutes!`);
    setTimeout(() => setFeedbackMsg(''), 3500);
  }

  const remainingMinutes = Math.max(0, dailyGoalMinutes - todayStudyMinutes);
  const isGoalAchieved = todayStudyMinutes >= dailyGoalMinutes;

  return (
    <div className="student-goals-view">
      {/* 1. Current Goal Status Hero */}
      <div className={`goals-hero-card ${isGoalAchieved ? 'hero-achieved' : ''}`}>
        <div className="hero-status-tag">
          {isGoalAchieved ? '🎉 Target Achieved Today!' : 'Daily Focus Target'}
        </div>

        <div className="hero-progress-layout">
          <div className="hero-numbers">
            <span className="hero-percent">{todayGoalPercent}%</span>
            <div className="hero-text-group">
              <h2 className="hero-heading">
                {todayStudyMinutes} of {dailyGoalMinutes} minutes completed
              </h2>
              <p className="hero-desc">
                {isGoalAchieved
                  ? 'Fantastic job! You reached your study time goal for today. Any further sessions are bonus focus!'
                  : `${remainingMinutes} minutes left to hit your daily focus target.`}
              </p>
            </div>
          </div>

          <div className="hero-action-col">
            <button
              type="button"
              className="goals-start-btn"
              onClick={onStartSessionClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{isGoalAchieved ? 'Start Bonus Session' : 'Study Towards Goal'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="hero-progress-track" aria-hidden="true">
          <div
            className={`hero-progress-bar ${isGoalAchieved ? 'bar-gold' : ''}`}
            style={{ width: `${Math.min(100, todayGoalPercent)}%` }}
          />
        </div>
      </div>

      {/* 2. Configure Daily Target Form */}
      <div className="goals-config-panel">
        <div className="config-header">
          <h3 className="config-title">Configure Daily Target</h3>
          <p className="config-subtitle">
            Choose a quick preset or type a customized daily study duration in minutes.
          </p>
        </div>

        {feedbackMsg && (
          <div className="goals-feedback-banner banner-success" role="status">
            <span>✓ {feedbackMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="goals-feedback-banner banner-error" role="alert">
            <span>⚠ {errorMsg}</span>
          </div>
        )}

        {/* Preset Chips */}
        <div className="presets-section">
          <span className="presets-label">Popular Daily Targets:</span>
          <div className="presets-grid">
            {presets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`preset-btn ${dailyGoalMinutes === preset.value ? 'preset-active' : ''}`}
                onClick={() => handlePresetSelect(preset.value)}
              >
                <span>{preset.label}</span>
                {dailyGoalMinutes === preset.value && (
                  <span className="preset-check" aria-hidden="true">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Form */}
        <form className="custom-goal-form" onSubmit={handleFormSubmit}>
          <div className="form-input-row">
            <div className="input-field-wrap">
              <label htmlFor="custom-minutes-input" className="input-field-label">
                Custom Daily Target (in minutes):
              </label>
              <div className="input-with-unit">
                <input
                  id="custom-minutes-input"
                  type="number"
                  min="15"
                  max="480"
                  step="5"
                  className="goal-num-input"
                  value={customInput}
                  onChange={(e) => {
                    setCustomInput(e.target.value);
                    setErrorMsg('');
                  }}
                />
                <span className="unit-affix">minutes</span>
              </div>
            </div>

            <button type="submit" className="save-goal-btn">
              Update Goal Target
            </button>
          </div>
          <span className="input-helper-note">
            Equivalent to: {(parseInt(customInput, 10) / 60 || 0).toFixed(1)} hours per day
          </span>
        </form>
      </div>

      {/* 3. Weekly Habit Consistency Checklist */}
      <div className="goals-config-panel">
        <h3 className="config-title">Weekly Habit Consistency</h3>
        <p className="config-subtitle">
          Days this week where you met or exceeded your daily focus target
        </p>

        <div className="week-habit-row">
          {[
            { day: 'Mon', status: 'met', label: 'Met (1.8h)' },
            { day: 'Tue', status: 'met', label: 'Met (2.1h)' },
            { day: 'Wed', status: 'missed', label: '1.2h / 2.0h' },
            { day: 'Thu', status: 'met', label: 'Met (2.5h)' },
            { day: 'Fri', status: 'met', label: 'Met (1.5h)' },
            {
              day: 'Sat (Today)',
              status: isGoalAchieved ? 'met' : 'in-progress',
              label: isGoalAchieved ? 'Target Met!' : `${todayStudyMinutes}m logged`,
              isToday: true,
            },
            { day: 'Sun', status: 'pending', label: 'Planned' },
          ].map((item) => (
            <div key={item.day} className={`habit-day-card ${item.isToday ? 'habit-today' : ''}`}>
              <span className="habit-day-name">{item.day}</span>
              <div className={`habit-status-icon icon-${item.status}`} aria-hidden="true">
                {item.status === 'met' && '✓'}
                {item.status === 'missed' && '–'}
                {item.status === 'in-progress' && '⏳'}
                {item.status === 'pending' && '○'}
              </div>
              <span className="habit-day-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentGoals;
