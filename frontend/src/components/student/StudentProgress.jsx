import './StudentProgress.css';

/**
 * StudentProgress Component
 *
 * Visualizes student personal focus and study trends:
 *   - Daily and weekly aggregate study time
 *   - Study-goal completion rate
 *   - Focus score consistency trends (labelled as simulated)
 *   - Responsive pure-CSS weekly study time bar chart
 *   - Subject distribution breakdown
 *   - Most productive day and subject insights
 *   - Distinguishes demo historical analytics from dynamically recorded timer blocks
 */
function StudentProgress({ sessions, dailyGoalMinutes, todayStudyMinutes }) {
  // Aggregate total minutes across all sessions
  const totalMinutesAll = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHoursAll = (totalMinutesAll / 60).toFixed(1);

  // Subject breakdown
  const subjectMap = {};
  sessions.forEach((s) => {
    subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.durationMinutes;
  });

  const subjectBreakdown = Object.entries(subjectMap).map(([name, minutes]) => {
    const percent = Math.round((minutes / (totalMinutesAll || 1)) * 100);
    return { name, minutes, percent };
  }).sort((a, b) => b.minutes - a.minutes);

  const topSubject = subjectBreakdown[0] ? subjectBreakdown[0].name : 'Mathematics';

  // Weekly chart bars (Mon to Sun demo baseline + today's real logged study)
  const todayHrsDecimal = (todayStudyMinutes / 60).toFixed(1);
  const weeklyChartBars = [
    { day: 'Monday', short: 'Mon', hours: '1.8h', valueNum: 1.8, isToday: false },
    { day: 'Tuesday', short: 'Tue', hours: '2.1h', valueNum: 2.1, isToday: false },
    { day: 'Wednesday', short: 'Wed', hours: '1.2h', valueNum: 1.2, isToday: false },
    { day: 'Thursday', short: 'Thu', hours: '2.5h', valueNum: 2.5, isToday: false },
    { day: 'Friday', short: 'Fri', hours: '1.5h', valueNum: 1.5, isToday: false },
    {
      day: 'Saturday (Today)',
      short: 'Sat',
      hours: `${todayHrsDecimal}h`,
      valueNum: parseFloat(todayHrsDecimal),
      isToday: true,
    },
    { day: 'Sunday', short: 'Sun', hours: '0.0h', valueNum: 0, isToday: false },
  ];

  // Find max for scaling
  const maxBarValue = Math.max(3.0, ...weeklyChartBars.map((b) => b.valueNum));

  // Focus score average
  const scoredSessions = sessions.filter((s) => s.focusScore);
  const avgFocus =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((acc, s) => acc + parseInt(s.focusScore, 10), 0) /
            scoredSessions.length
        )
      : 92;

  return (
    <div className="student-progress-view">
      {/* 1. Header Banner with Distinction Disclaimer */}
      <div className="progress-header-card">
        <div className="progress-header-text">
          <span className="progress-badge">Study Analytics &bull; Demo Baseline</span>
          <h2 className="progress-title">My Focus &amp; Progress</h2>
          <p className="progress-subtitle">
            Review your study habits, subject time allocation, and daily milestone consistency.
          </p>
        </div>

        <div className="progress-disclaimer-pill">
          <span className="info-dot" aria-hidden="true">i</span>
          <span>Includes historical demo records &amp; today&apos;s live sessions</span>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="progress-kpi-grid">
        <div className="progress-kpi-card">
          <span className="kpi-mini-label">Total Time Tracked</span>
          <span className="kpi-big-value">{totalHoursAll} <small>hrs</small></span>
          <span className="kpi-detail-note">{sessions.length} study sessions recorded</span>
        </div>

        <div className="progress-kpi-card">
          <span className="kpi-mini-label">Today&apos;s Study Time</span>
          <span className="kpi-big-value text-sky">
            {todayStudyMinutes >= 60
              ? `${Math.floor(todayStudyMinutes / 60)}h ${todayStudyMinutes % 60}m`
              : `${todayStudyMinutes}m`}
          </span>
          <span className="kpi-detail-note">
            Target: {Math.floor(dailyGoalMinutes / 60)}h {dailyGoalMinutes % 60 > 0 ? `${dailyGoalMinutes % 60}m` : ''}
          </span>
        </div>

        <div className="progress-kpi-card">
          <span className="kpi-mini-label">Goal Completion Rate</span>
          <span className="kpi-big-value text-emerald">86%</span>
          <span className="kpi-detail-note">Achieved target 6 of last 7 days</span>
        </div>

        <div className="progress-kpi-card">
          <div className="kpi-label-row">
            <span className="kpi-mini-label">Focus Score Average</span>
            <span className="demo-tag">Simulated</span>
          </div>
          <span className="kpi-big-value text-emerald">{avgFocus}%</span>
          <span className="kpi-detail-note">Simulated focus consistency</span>
        </div>
      </div>

      {/* 3. Weekly Study Time CSS Chart */}
      <div className="progress-panel">
        <div className="panel-top-row">
          <div>
            <h3 className="section-title">Weekly Study-Time Distribution</h3>
            <p className="section-subtitle">Daily hours studied across the current week</p>
          </div>
          <span className="chart-legend-tag">
            <span className="legend-dot" aria-hidden="true" />
            Hours Studied
          </span>
        </div>

        <div className="css-chart-wrapper">
          <div className="chart-bars-row">
            {weeklyChartBars.map((bar) => {
              const heightPercent = Math.min(100, Math.max(8, Math.round((bar.valueNum / maxBarValue) * 100)));
              return (
                <div key={bar.day} className="chart-bar-group">
                  <span className="bar-data-text">{bar.hours}</span>
                  <div className="bar-track-outer">
                    <div
                      className={`bar-fill-inner ${bar.isToday ? 'fill-today' : ''}`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className={`bar-short-label ${bar.isToday ? 'label-today' : ''}`}>
                    {bar.short}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Two-Column Bottom Insights: Subject Distribution & Habits */}
      <div className="progress-bottom-grid">
        {/* Subject Breakdown */}
        <div className="progress-panel">
          <h3 className="section-title">Subject Time Allocation</h3>
          <p className="section-subtitle">How your study time is distributed across topics</p>

          <div className="subject-bars-list">
            {subjectBreakdown.map((subj) => (
              <div key={subj.name} className="subject-bar-item">
                <div className="subj-info-row">
                  <span className="subj-name">{subj.name}</span>
                  <span className="subj-time">
                    {Math.floor(subj.minutes / 60)}h {subj.minutes % 60}m ({subj.percent}%)
                  </span>
                </div>
                <div className="subj-progress-track">
                  <div
                    className="subj-progress-fill"
                    style={{ width: `${subj.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productivity Highlights */}
        <div className="progress-panel">
          <h3 className="section-title">Productivity Insights</h3>
          <p className="section-subtitle">Key patterns identified from your study log</p>

          <div className="highlights-list">
            <div className="highlight-item">
              <div className="highlight-icon" aria-hidden="true">🏆</div>
              <div className="highlight-info">
                <span className="highlight-title">Top Subject Focus</span>
                <p className="highlight-desc">
                  <strong>{topSubject}</strong> accounts for the largest share of your study blocks this week.
                </p>
              </div>
            </div>

            <div className="highlight-item">
              <div className="highlight-icon" aria-hidden="true">⚡</div>
              <div className="highlight-info">
                <span className="highlight-title">Most Productive Day</span>
                <p className="highlight-desc">
                  <strong>Thursday</strong> was your highest volume study day with 2.5 hours completed.
                </p>
              </div>
            </div>

            <div className="highlight-item">
              <div className="highlight-icon" aria-hidden="true">🎯</div>
              <div className="highlight-info">
                <span className="highlight-title">Focus Streak</span>
                <p className="highlight-desc">
                  You have logged at least one focused study block for <strong>5 consecutive days</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProgress;
