import { useState, useEffect } from 'react';
import './MonitoringSessions.css';

/**
 * MonitoringSessions Component
 *
 * Dedicated view for inspecting supervised device sessions.
 * Features:
 *   - At least 1 active live session and several completed sessions
 *   - Device name, start date/time, end time, duration, and status
 *   - Focus score and activity logs
 *   - Status filter tabs (All, Active, Completed) and Device selector
 *   - Responsive dual presentation: tabular grid on desktop/tablet,
 *     optimized card list on mobile phones
 *   - Interactive session detail log modal with Escape key handling
 *   - Clearly identified fictional demonstration data
 */
function MonitoringSessions() {
  // Fictional demonstration sessions with detailed report telemetry
  const [sessions] = useState([
    {
      id: 'sess-101',
      device: "Liam's Laptop",
      deviceType: 'laptop',
      child: 'Liam (Grade 7)',
      title: 'Math & Science Homework',
      date: 'Today · Oct 24, 2026',
      startTime: '07:15 PM',
      endTime: 'In Progress',
      duration: '45m active',
      status: 'active',
      statusLabel: 'Active',
      focusScore: '94%',
      primaryApp: 'Canvas LMS',
      category: 'STEM & Math',
      distractionCount: 0,
      notes: 'Focus Block active · No distractions detected',
      aiCoachInsight: 'High focus consistency. Kept to whitelisted academic tools throughout the Focus Block with zero distraction attempts. Recommend a 10-minute movement break when completed.',
      appsUsed: [
        { name: 'Canvas LMS', category: 'Study', duration: '32m' },
        { name: 'Desmos Calculator', category: 'Tool', duration: '10m' },
        { name: 'Scratchpad Notes', category: 'Notes', duration: '3m' },
      ],
      logs: [
        { time: '07:15 PM', event: 'Focus Block initiated for Math workbook' },
        { time: '07:22 PM', event: 'Canvas LMS opened (Whitelisted education app)' },
        { time: '07:45 PM', event: 'Screen check: Actively solving calculus problems' },
      ],
    },
    {
      id: 'sess-102',
      device: 'Study PC',
      deviceType: 'desktop',
      child: 'Liam (Grade 7)',
      title: 'History Essay Research',
      date: 'Today · Oct 24, 2026',
      startTime: '03:30 PM',
      endTime: '04:45 PM',
      duration: '1h 15m',
      status: 'completed',
      statusLabel: 'Completed',
      focusScore: '88%',
      primaryApp: 'Google Docs',
      category: 'Social Studies',
      distractionCount: 0,
      notes: 'Completed session · 1 scheduled 10m break taken',
      aiCoachInsight: 'Steady research pacing. Scheduled 10-minute break was taken on time and child resumed essay drafting without delay.',
      appsUsed: [
        { name: 'Google Docs', category: 'Writing', duration: '50m' },
        { name: 'JSTOR Academic Search', category: 'Research', duration: '25m' },
      ],
      logs: [
        { time: '03:30 PM', event: 'Session started on Study PC' },
        { time: '04:00 PM', event: 'Parent-supervised 10-minute movement break' },
        { time: '04:10 PM', event: 'Google Docs essay draft resumed' },
        { time: '04:45 PM', event: 'Session concluded successfully' },
      ],
    },
    {
      id: 'sess-103',
      device: 'Tablet',
      deviceType: 'tablet',
      child: 'Emma (Grade 4)',
      title: 'Duolingo Spanish Practice',
      date: 'Yesterday · Oct 23, 2026',
      startTime: '06:00 PM',
      endTime: '06:40 PM',
      duration: '40m',
      status: 'completed',
      statusLabel: 'Completed',
      focusScore: '96%',
      primaryApp: 'Duolingo',
      category: 'Language Learning',
      distractionCount: 0,
      notes: 'Goal achieved · 2 lessons completed',
      aiCoachInsight: 'Excellent engagement during vocabulary exercises. XP target completed ahead of schedule.',
      appsUsed: [
        { name: 'Duolingo App', category: 'Language', duration: '35m' },
        { name: 'SpanishDict Reference', category: 'Reference', duration: '5m' },
      ],
      logs: [
        { time: '06:00 PM', event: 'Duolingo app opened on iPad' },
        { time: '06:20 PM', event: 'Lesson 1: Vocabulary & Grammar passed' },
        { time: '06:40 PM', event: 'Daily XP target met; app closed' },
      ],
    },
    {
      id: 'sess-104',
      device: "Liam's Laptop",
      deviceType: 'laptop',
      child: 'Liam (Grade 7)',
      title: 'Coding & Python Tutorial',
      date: 'Yesterday · Oct 23, 2026',
      startTime: '04:10 PM',
      endTime: '05:30 PM',
      duration: '1h 20m',
      status: 'completed',
      statusLabel: 'Completed',
      focusScore: '91%',
      primaryApp: 'Visual Studio Code',
      category: 'Computer Science',
      distractionCount: 0,
      notes: 'Clean session · VS Code active',
      aiCoachInsight: 'Strong sustained attention in the development environment. No external tab switching detected during the tutorial.',
      appsUsed: [
        { name: 'VS Code Editor', category: 'Coding', duration: '55m' },
        { name: 'Python 3 Docs', category: 'Documentation', duration: '25m' },
      ],
      logs: [
        { time: '04:10 PM', event: 'VS Code & Python documentation launched' },
        { time: '04:50 PM', event: 'Terminal exercises completed without tab switches' },
        { time: '05:30 PM', event: 'Parent session limit reached' },
      ],
    },
    {
      id: 'sess-105',
      device: 'Study PC',
      deviceType: 'desktop',
      child: 'Shared Family Room',
      title: 'Literature Reading',
      date: 'Oct 22, 2026',
      startTime: '07:00 PM',
      endTime: '08:05 PM',
      duration: '1h 05m',
      status: 'completed',
      statusLabel: 'Completed',
      focusScore: '74%',
      primaryApp: 'Kindle Cloud Reader',
      category: 'Reading & Literature',
      distractionCount: 1,
      notes: 'Flagged distraction: Gaming site blocked',
      aiCoachInsight: 'Coach shield intercepted 1 unauthorized gaming domain at 07:28 PM. Child returned to reading within 2 minutes and finished the literature chapter.',
      appsUsed: [
        { name: 'Kindle Web Reader', category: 'Reading', duration: '58m' },
        { name: 'Blocked Game Domain', category: 'Flagged', duration: '2m' },
        { name: 'Dictionary Lookup', category: 'Reference', duration: '5m' },
      ],
      logs: [
        { time: '07:00 PM', event: 'Kindle Web reader launched' },
        { time: '07:28 PM', event: 'Game site attempted; coach notification sent' },
        { time: '07:30 PM', event: 'Returned to Literature reading' },
        { time: '08:05 PM', event: 'Session concluded' },
      ],
    },
    {
      id: 'sess-106',
      device: 'Tablet',
      deviceType: 'tablet',
      child: 'Emma (Grade 4)',
      title: 'Art & Drawing Tutorial',
      date: 'Oct 21, 2026',
      startTime: '05:15 PM',
      endTime: '06:00 PM',
      duration: '45m',
      status: 'completed',
      statusLabel: 'Completed',
      focusScore: '98%',
      primaryApp: 'Procreate',
      category: 'Arts & Creative',
      distractionCount: 0,
      notes: 'Procreate tutorial completed',
      aiCoachInsight: 'Creative session goals met. Artwork exported smoothly without deviation.',
      appsUsed: [
        { name: 'Procreate Studio', category: 'Creative', duration: '40m' },
        { name: 'Photo Reference', category: 'Reference', duration: '5m' },
      ],
      logs: [
        { time: '05:15 PM', event: 'Digital drawing lesson begun' },
        { time: '06:00 PM', event: 'Artwork exported and session finished' },
      ],
    },
  ]);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [deviceFilter, setDeviceFilter] = useState('all');

  // Modal inspection state
  const [selectedSession, setSelectedSession] = useState(null);
  const [isExported, setIsExported] = useState(false);

  function handleExportReport() {
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2200);
  }

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && selectedSession) {
        setSelectedSession(null);
        setIsExported(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSession]);

  // Filter application
  const filteredSessions = sessions.filter((s) => {
    const matchesStatus =
      statusFilter === 'all' ? true : s.status === statusFilter;
    const matchesDevice =
      deviceFilter === 'all' ? true : s.device === deviceFilter;
    return matchesStatus && matchesDevice;
  });

  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  function renderDeviceIcon(deviceType) {
    if (deviceType === 'desktop') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    }
    if (deviceType === 'tablet') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    }
    // Laptop default
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    );
  }

  return (
    <section className="sessions-view" aria-label="Monitoring Sessions History">
      {/* 1. Header with title and demo disclaimer badge */}
      <div className="sessions-header-row">
        <div className="sessions-header-left">
          <div className="sessions-heading-wrap">
            <h2 className="sessions-view-title">Monitoring Sessions</h2>
            <span className="sessions-demo-badge" title="Session records are simulated demo data">
              <span className="sessions-demo-dot" aria-hidden="true" />
              Fictional Demo Sessions
            </span>
          </div>
          <p className="sessions-view-description">
            Track supervised device sessions, study durations, and focus history for family members.
          </p>
        </div>
      </div>

      {/* 2. Sub-toolbar: Status tabs & Device dropdown */}
      <div className="sessions-toolbar">
        <div className="sessions-filter-group" role="tablist" aria-label="Filter sessions by status">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'all'}
            className={`sessions-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Sessions ({sessions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'active'}
            className={`sessions-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'completed'}
            className={`sessions-filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="sessions-toolbar-right">
          <select
            className="sessions-device-select"
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            aria-label="Filter by device"
          >
            <option value="all">All Devices</option>
            <option value="Liam's Laptop">Liam's Laptop</option>
            <option value="Study PC">Study PC</option>
            <option value="Tablet">Tablet</option>
          </select>

          <span className="sessions-quick-stat">
            Showing {filteredSessions.length} sessions
          </span>
        </div>
      </div>

      {/* 3. Desktop / Tablet Tabular Grid */}
      <div className="sessions-table-card">
        <div className="sessions-table-responsive">
          <table className="sessions-table" aria-label="Recent monitoring sessions table">
            <thead>
              <tr>
                <th>Device & User</th>
                <th>Session Activity</th>
                <th>Date & Start</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Focus</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => {
                const isActive = session.status === 'active';

                return (
                  <tr key={session.id}>
                    <td>
                      <div className="session-device-cell">
                        <div className="session-device-icon">
                          {renderDeviceIcon(session.deviceType)}
                        </div>
                        <div className="session-device-meta">
                          <span className="session-device-name">{session.device}</span>
                          <span className="session-user-name">{session.child}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="session-goal-title">{session.title}</div>
                      <div className="session-notes-sub">{session.notes}</div>
                    </td>

                    <td>
                      <div>{session.date}</div>
                      <div className="session-notes-sub">{session.startTime}</div>
                    </td>

                    <td>{session.endTime}</td>

                    <td>
                      <span className={`session-duration-tag ${isActive ? 'live' : ''}`}>
                        {session.duration}
                      </span>
                    </td>

                    <td>
                      <span className={`session-status-badge ${session.status}`}>
                        <span className="session-status-dot" aria-hidden="true" />
                        {session.statusLabel}
                      </span>
                    </td>

                    <td>
                      <span className="focus-score-pill">{session.focusScore}</span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="session-detail-btn"
                        onClick={() => setSelectedSession(session)}
                        aria-label={`View activity log for ${session.title}`}
                      >
                        View Log
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Mobile Cards Layout (Rendered for narrow screens) */}
      <div className="sessions-mobile-cards">
        {filteredSessions.map((session) => {
          const isActive = session.status === 'active';

          return (
            <article key={session.id} className="session-mobile-card">
              <div className="session-mobile-card-top">
                <div className="session-mobile-device">
                  {renderDeviceIcon(session.deviceType)}
                  <span>{session.device}</span>
                </div>
                <span className={`session-status-badge ${session.status}`}>
                  <span className="session-status-dot" aria-hidden="true" />
                  {session.statusLabel}
                </span>
              </div>

              <div>
                <h3 className="session-goal-title">{session.title}</h3>
                <p className="session-notes-sub">{session.child} · {session.notes}</p>
              </div>

              <div className="session-mobile-info-grid">
                <div className="session-mobile-info-item">
                  <span className="session-mobile-label">Date & Start</span>
                  <span className="session-mobile-value">{session.startTime}</span>
                </div>
                <div className="session-mobile-info-item">
                  <span className="session-mobile-label">Duration</span>
                  <span className={`session-mobile-value ${isActive ? 'live' : ''}`}>
                    {session.duration}
                  </span>
                </div>
                <div className="session-mobile-info-item">
                  <span className="session-mobile-label">End Time</span>
                  <span className="session-mobile-value">{session.endTime}</span>
                </div>
                <div className="session-mobile-info-item">
                  <span className="session-mobile-label">Focus Score</span>
                  <span className="session-mobile-value">{session.focusScore}</span>
                </div>
              </div>

              <button
                type="button"
                className="session-detail-btn"
                style={{ width: '100%', textAlign: 'center' }}
                onClick={() => setSelectedSession(session)}
              >
                View Activity Timeline · Demo
              </button>
            </article>
          );
        })}
      </div>

      {/* 5. Detailed Session Report Modal */}
      {selectedSession && (
        <div
          className="session-modal-backdrop"
          onClick={() => {
            setSelectedSession(null);
            setIsExported(false);
          }}
          role="presentation"
        >
          <div
            className="session-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-report-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button (✕) */}
            <button
              type="button"
              className="session-modal-close-btn"
              onClick={() => {
                setSelectedSession(null);
                setIsExported(false);
              }}
              aria-label="Close detailed session report"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Header: Title, demo badge, device & profile context */}
            <div className="session-modal-header">
              <div className="session-report-badge-row">
                <span className="sessions-demo-badge">
                  <span className="sessions-demo-dot" aria-hidden="true" />
                  Fictional Demo Session Report
                </span>
                <span className={`session-status-badge ${selectedSession.status}`}>
                  <span className="session-status-dot" aria-hidden="true" />
                  {selectedSession.statusLabel}
                </span>
              </div>
              <h3 id="session-report-modal-title" className="session-modal-title">
                Detailed Session Report: {selectedSession.title}
              </h3>
              <div className="session-modal-meta">
                <span><strong>Device:</strong> {selectedSession.device}</span>
                <span>•</span>
                <span><strong>Child:</strong> {selectedSession.child}</span>
                <span>•</span>
                <span><strong>Date:</strong> {selectedSession.date}</span>
              </div>
            </div>

            {/* 1. Executive Summary KPI Grid */}
            <div className="session-report-kpis">
              <div className="session-kpi-card">
                <span className="session-kpi-label">Duration</span>
                <span className="session-kpi-val">{selectedSession.duration}</span>
                <span className="session-kpi-sub">{selectedSession.startTime} &rarr; {selectedSession.endTime}</span>
              </div>

              <div className="session-kpi-card">
                <span className="session-kpi-label">Focus Score</span>
                <span className="session-kpi-val" style={{ color: 'var(--status-active-text)' }}>
                  {selectedSession.focusScore}
                </span>
                <span className="session-kpi-sub">Productivity rating</span>
              </div>

              <div className="session-kpi-card">
                <span className="session-kpi-label">Distractions</span>
                <span className="session-kpi-val">
                  {selectedSession.distractionCount} Intercepted
                </span>
                <span className="session-kpi-sub">
                  {selectedSession.distractionCount === 0 ? 'Zero alerts detected' : 'Shield alert triggered'}
                </span>
              </div>

              <div className="session-kpi-card">
                <span className="session-kpi-label">Primary Tool</span>
                <span className="session-kpi-val" style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedSession.primaryApp}
                </span>
                <span className="session-kpi-sub">{selectedSession.category}</span>
              </div>
            </div>

            {/* 2. Monitored Applications & Websites Breakdown */}
            <div className="session-report-section">
              <h4 className="session-section-title">Application & Focus Breakdown</h4>
              <div className="session-apps-grid">
                {selectedSession.appsUsed && selectedSession.appsUsed.map((app, index) => (
                  <div key={index} className="session-app-item">
                    <div className="session-app-header">
                      <span>{app.name}</span>
                      <span className="session-app-cat">{app.category}</span>
                    </div>
                    <span className="session-app-time">{app.duration} recorded</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. AI Coach Performance Analysis */}
            <div className="session-ai-coach-box">
              <div className="session-ai-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="session-ai-content">
                <span className="session-ai-label">AI Productivity Coach Evaluation</span>
                <p className="session-ai-text">{selectedSession.aiCoachInsight}</p>
              </div>
            </div>

            {/* 4. Chronological Activity Telemetry */}
            <div className="session-report-section">
              <h4 className="session-section-title">Chronological Session Log ({selectedSession.logs.length} events)</h4>
              <div className="session-modal-timeline">
                {selectedSession.logs.map((log, index) => (
                  <div key={index} className="session-timeline-step">
                    <span className="session-timeline-dot" aria-hidden="true" />
                    <span className="session-timeline-time">{log.time}</span>
                    <span className="session-timeline-desc">{log.event}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Informational notice: Single session vs overall Reports page */}
            <div className="session-report-disclaimer">
              <strong>Note:</strong> This report provides in-depth telemetry for this individual session. The separate <em>Reports</em> navigation item in the sidebar is reserved for upcoming daily/weekly aggregate family summaries.
            </div>

            {/* Footer with export and close actions */}
            <div className="session-modal-footer">
              <button
                type="button"
                className="btn-report-export"
                onClick={handleExportReport}
              >
                {isExported ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Summary Exported (Demo)</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Export Session Summary · Demo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="session-detail-btn"
                style={{ backgroundColor: 'var(--primary-color)', color: '#ffffff', borderColor: 'transparent', padding: '9px 18px', fontSize: '13px' }}
                onClick={() => {
                  setSelectedSession(null);
                  setIsExported(false);
                }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default MonitoringSessions;
