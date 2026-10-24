import './StudentDashboard.css';

/**
 * StudentDashboard Component
 *
 * Primary overview for the Student role:
 *   - Student greeting & date pill
 *   - 4 Overview Metric Cards (Today's Study Time, Completed Sessions, Goal Progress, Demo Focus Score)
 *   - Prominent Action Banner to start or return to study sessions
 *   - Recent Study Sessions list with quick links
 *   - Weekly study-time visual CSS chart
 */
function StudentDashboard({
  profile,
  todayStudyMinutes,
  todaySessionsCount,
  dailyGoalMinutes,
  todayGoalPercent,
  sessions,
  timerStatus,
  timerSubject,
  elapsedSeconds,
  onStartSessionClick,
  onViewHistoryClick,
  onAdjustGoalClick,
}) {
  // Format today's study minutes
  const formattedTodayTime =
    todayStudyMinutes >= 60
      ? `${Math.floor(todayStudyMinutes / 60)}h ${todayStudyMinutes % 60}m`
      : `${todayStudyMinutes}m`;

  // Calculate average focus score from today's sessions (or overall if 0 today)
  const relevantSessions = sessions.filter((s) => s.focusScore);
  const avgScore =
    relevantSessions.length > 0
      ? Math.round(
          relevantSessions.reduce((acc, s) => acc + parseInt(s.focusScore, 10), 0) /
            relevantSessions.length
        ) + '%'
      : '92%';

  // Top 3 recent sessions
  const recentSessions = sessions.slice(0, 3);

  // Weekly study time overview (Mon - Sun demo data + today's real logged study)
  const weeklyData = [
    { day: 'Mon', hours: '1.8h', heightPercent: 65 },
    { day: 'Tue', hours: '2.1h', heightPercent: 75 },
    { day: 'Wed', hours: '1.2h', heightPercent: 45 },
    { day: 'Thu', hours: '2.5h', heightPercent: 90 },
    { day: 'Fri', hours: '1.5h', heightPercent: 55 },
    {
      day: 'Sat (Today)',
      hours: formattedTodayTime,
      heightPercent: Math.min(100, Math.max(15, Math.round((todayStudyMinutes / 180) * 100))),
      isToday: true,
    },
    { day: 'Sun', hours: '0h', heightPercent: 8 },
  ];

  function formatTimerPill(secs) {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }

  return (
    <div className="student-dashboard">
      {/* 1. Welcome Banner Header */}
      <section className="student-welcome-banner">
        <div className="welcome-text-col">
          <div className="welcome-tag-row">
            <span className="student-badge-pill">Study Dashboard</span>
            <span className="student-date-tag">Today · Oct 24, 2026</span>
          </div>
          <h2 className="student-welcome-title">Welcome back, {profile.name}! 👋</h2>
          <p className="student-welcome-subtitle">
            Track your focused study blocks, build strong study habits, and reach your daily learning goals.
          </p>
        </div>

        <div className="welcome-quick-action">
          {timerStatus === 'idle' ? (
            <button
              type="button"
              className="student-cta-btn"
              onClick={onStartSessionClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Start Study Session</span>
            </button>
          ) : (
            <button
              type="button"
              className="student-cta-btn cta-btn-active"
              onClick={onStartSessionClick}
            >
              <span className="cta-pulse-dot" aria-hidden="true" />
              <span>
                {timerStatus === 'running' ? `Active: ${timerSubject}` : `Paused: ${timerSubject}`} ({formatTimerPill(elapsedSeconds)})
              </span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. Key Metrics Row */}
      <section className="student-kpi-grid" aria-label="Today's Study Metrics">
        {/* Card 1: Today's Study Time */}
        <article className="student-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Today&apos;s Study Time</span>
            <div className="kpi-icon-wrap icon-time" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">{formattedTodayTime}</span>
            <span className="kpi-target-note">Target: {Math.floor(dailyGoalMinutes / 60)}h {dailyGoalMinutes % 60 > 0 ? `${dailyGoalMinutes % 60}m` : ''}</span>
          </div>
          <div className="kpi-footer-note">
            <span className="kpi-subtext">Across {todaySessionsCount} focus blocks today</span>
          </div>
        </article>

        {/* Card 2: Completed Sessions */}
        <article className="student-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Completed Sessions</span>
            <div className="kpi-icon-wrap icon-sessions" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">{todaySessionsCount}</span>
            <span className="kpi-unit">sessions</span>
          </div>
          <div className="kpi-footer-note">
            <span className="kpi-subtext">All planned blocks on schedule</span>
          </div>
        </article>

        {/* Card 3: Daily Study Goal Progress */}
        <article className="student-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Daily Goal Progress</span>
            <button
              type="button"
              className="kpi-edit-link"
              onClick={onAdjustGoalClick}
              title="Edit daily study goal"
            >
              Adjust &rarr;
            </button>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">{todayGoalPercent}%</span>
            <span className="kpi-unit">{todayStudyMinutes} / {dailyGoalMinutes}m</span>
          </div>
          <div className="goal-bar-track" aria-hidden="true">
            <div
              className={`goal-bar-fill ${todayGoalPercent >= 100 ? 'bar-complete' : ''}`}
              style={{ width: `${Math.min(100, todayGoalPercent)}%` }}
            />
          </div>
        </article>

        {/* Card 4: Focus Score (Demo data) */}
        <article className="student-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Average Focus Score</span>
            <span className="kpi-demo-badge" title="Fictional simulated demonstration metric">
              Demo Data
            </span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number text-accent">{avgScore}</span>
            <span className="kpi-unit">consistency</span>
          </div>
          <div className="kpi-footer-note">
            <span className="kpi-subtext">Simulated score for focus consistency</span>
          </div>
        </article>
      </section>

      {/* 3. Main Dashboard Two-Column Grid */}
      <div className="student-dash-grid">
        {/* Left Column: Recent Sessions */}
        <section className="student-card-panel" aria-label="Recent Study Sessions">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Recent Study Sessions</h3>
              <p className="panel-subtitle">Your latest logged study sessions and focus ratings</p>
            </div>
            <button
              type="button"
              className="panel-link-btn"
              onClick={onViewHistoryClick}
            >
              <span>View All ({sessions.length})</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>

          <div className="recent-sessions-list">
            {recentSessions.map((session) => (
              <div key={session.id} className="recent-session-item">
                <div className="session-item-left">
                  <div className="subject-icon-box" aria-hidden="true">
                    {session.subject.charAt(0)}
                  </div>
                  <div className="session-item-details">
                    <span className="session-item-title">{session.title}</span>
                    <div className="session-item-meta">
                      <span className="meta-subject-badge">{session.subject}</span>
                      <span>&bull;</span>
                      <span>{session.date}</span>
                      <span>&bull;</span>
                      <span>{session.time}</span>
                    </div>
                  </div>
                </div>

                <div className="session-item-right">
                  <span className="session-duration-tag">{session.durationText}</span>
                  <span className="session-score-pill" title="Simulated demonstration score">
                    {session.focusScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Weekly Study Time Overview */}
        <section className="student-card-panel" aria-label="Weekly Study-Time Overview">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Weekly Study Overview</h3>
              <p className="panel-subtitle">Study hours logged over the last 7 days</p>
            </div>
            <span className="panel-badge-secondary">Mon – Sun</span>
          </div>

          <div className="weekly-chart-wrap">
            <div className="weekly-bars-container">
              {weeklyData.map((item) => (
                <div key={item.day} className="weekly-bar-col">
                  <span className="bar-val-label">{item.hours}</span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${item.isToday ? 'bar-today' : ''}`}
                      style={{ height: `${item.heightPercent}%` }}
                    />
                  </div>
                  <span className={`bar-day-label ${item.isToday ? 'day-today' : ''}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="weekly-chart-footer">
            <span className="chart-footer-indicator" aria-hidden="true" />
            <span className="chart-footer-text">
              Great pacing! You are on track to achieve your weekly focus streak.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StudentDashboard;
