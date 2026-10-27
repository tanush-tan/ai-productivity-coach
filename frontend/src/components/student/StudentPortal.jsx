import { useState, useEffect } from 'react';
import StudentDashboard from './StudentDashboard';
import StudentTimer from './StudentTimer';
import StudentHistory from './StudentHistory';
import StudentProgress from './StudentProgress';
import StudentGoals from './StudentGoals';
import StudentSettings from './StudentSettings';
import { getStoredToken } from '../../services/auth';
import { fetchStudentPairingStatus } from '../../services/pairing';
import { startStudySession, endStudySession, fetchStudentSessions } from '../../services/sessions';
import './StudentPortal.css';

/**
 * StudentPortal Component
 *
 * Top-level container for the Student experience.
 * Manages:
 *   1. activeTab — 'dashboard' | 'session' | 'history' | 'progress' | 'goals' | 'settings'
 *   2. Shared student session data (demo history + dynamically added timer sessions)
 *   3. Daily study goals (configurable targets with live progress tracking)
 *   4. Persistent wall-clock timer state (preserves accuracy and survives tab navigation)
 *   5. Mobile navigation drawer state
 *
 * Props:
 *   onSwitchRole — callback to return to the Welcome / Role Selection screen
 */
function StudentPortal({ onSwitchRole, currentUser, onGoToLogin }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pairingData, setPairingData] = useState(null);

  // Load real pairing data when student is authenticated
  useEffect(() => {
    let isMounted = true;
    const token = getStoredToken();
    if (!token || !currentUser) return;

    fetchStudentPairingStatus(token)
      .then((data) => {
        if (isMounted) setPairingData(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Derive dynamic profile from authenticated account details
  const studentDisplayName = currentUser?.displayName || (currentUser ? 'Student' : 'Guest Student (Demo)');
  const studentInitials = currentUser?.displayName
    ? currentUser.displayName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (currentUser ? 'ST' : 'GS');

  const studentProfile = {
    name: studentDisplayName,
    role: currentUser ? 'Authenticated Student' : 'Student / Learner (Demo Mode)',
    grade: pairingData?.profile?.grade || (currentUser ? (pairingData?.isPaired ? 'Enrolled Student' : 'Grade Not Set') : 'Grade 7 (Demo)'),
    school: pairingData?.profile?.school || (currentUser ? (pairingData?.isPaired ? 'Connected School' : 'School Not Set') : 'Lincoln Middle School (Demo)'),
    studentId: currentUser?.id ? `STU-${currentUser.id.slice(0, 4).toUpperCase()}` : 'STU-DEMO',
    initials: studentInitials,
    device: pairingData?.device?.name || (currentUser ? (pairingData?.isPaired ? 'Student Device' : 'No device paired') : 'Demo Laptop'),
  };

  // Daily Study Goal Target (in minutes). Default: 120 mins (2 hours)
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(120);

  // Remote session fetch state (authenticated students only)
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');

  // Completed Sessions List (Historical demo records + dynamically recorded timer sessions)
  const [sessions, setSessions] = useState([
    {
      id: 'sess-stu-101',
      subject: 'Mathematics',
      title: 'Calculus & Polynomial Exercises',
      date: 'Today · Oct 24, 2026',
      time: '07:15 PM',
      durationMinutes: 45,
      durationText: '45m',
      durationSecondsTotal: 2700,
      focusScore: '94%',
      isSimulatedScore: true,
      status: 'completed',
      isUserRecorded: false,
      notes: 'Whitelisted tools: Canvas LMS & Desmos Calculator.',
    },
    {
      id: 'sess-stu-102',
      subject: 'Social Studies',
      title: 'American Revolution Essay Drafting',
      date: 'Today · Oct 24, 2026',
      time: '03:30 PM',
      durationMinutes: 75,
      durationText: '1h 15m',
      durationSecondsTotal: 4500,
      focusScore: '88%',
      isSimulatedScore: true,
      status: 'completed',
      isUserRecorded: false,
      notes: 'Whitelisted tools: Google Docs & JSTOR search.',
    },
    {
      id: 'sess-stu-103',
      subject: 'Science',
      title: 'Physics Lab Prep: Velocity & Acceleration',
      date: 'Yesterday · Oct 23, 2026',
      time: '05:00 PM',
      durationMinutes: 35,
      durationText: '35m',
      durationSecondsTotal: 2100,
      focusScore: '92%',
      isSimulatedScore: true,
      status: 'completed',
      isUserRecorded: false,
      notes: 'Simulation workbook modules 1-3.',
    },
    {
      id: 'sess-stu-104',
      subject: 'Literature',
      title: 'English Book Review & Summary Notes',
      date: 'Oct 22, 2026',
      time: '04:15 PM',
      durationMinutes: 50,
      durationText: '50m',
      durationSecondsTotal: 3000,
      focusScore: '96%',
      isSimulatedScore: true,
      status: 'completed',
      isUserRecorded: false,
      notes: 'Chapter 7-9 chapter summaries.',
    },
    {
      id: 'sess-stu-105',
      subject: 'Mathematics',
      title: 'Algebra Quiz Practice & Flashcards',
      date: 'Oct 21, 2026',
      time: '06:30 PM',
      durationMinutes: 40,
      durationText: '40m',
      durationSecondsTotal: 2400,
      focusScore: '90%',
      isSimulatedScore: true,
      status: 'completed',
      isUserRecorded: false,
      notes: 'Self-guided practice test completed.',
    },
  ]);

  // Fetch real session history for authenticated students on mount.
  // Guest users keep the hardcoded demo sessions above.
  useEffect(() => {
    let isMounted = true;
    const token = getStoredToken();
    if (!token || !currentUser) return; // guest mode — keep demo data

    setSessionsLoading(true);
    setSessionsError('');

    fetchStudentSessions(token)
      .then((data) => {
        if (!isMounted) return;
        // Replace demo sessions with real ones; keep any timer sessions added
        // during this page visit by only replacing the initial demo set.
        const realSessions = (data.sessions || []).map((s) => ({
          id: s.id,
          subject: s.subject || 'General Study',
          title: s.title || `${s.subject || 'General Study'} Focus Session`,
          date: formatSessionDate(s.startedAt),
          time: s.startedAt
            ? new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--',
          durationMinutes: s.durationSeconds ? Math.max(1, Math.round(s.durationSeconds / 60)) : 0,
          durationText: formatDurationText(s.durationSeconds || 0),
          durationSecondsTotal: s.durationSeconds || 0,
          focusScore: s.focusScore != null ? `${s.focusScore}%` : null,
          isSimulatedScore: s.focusScore == null,
          status: s.status || 'completed',
          isUserRecorded: s.isUserRecorded ?? true,
          notes: s.notes || s.goalText || '',
        }));
        setSessions(realSessions);
      })
      .catch((err) => {
        if (!isMounted) return;
        setSessionsError(err.message || 'Could not load session history.');
      })
      .finally(() => {
        if (isMounted) setSessionsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser]); // re-fetch if auth context changes

  // Wall-Clock Study Timer State (Lifted to StudentPortal so timer continues while browsing other tabs)
  const [timerState, setTimerState] = useState({
    status: 'idle', // 'idle' | 'running' | 'paused'
    subject: 'Mathematics',
    goal: '',
    startTime: null,
    accumulatedSeconds: 0,
    sessionId: null,
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Accurate wall-clock tick listener
  useEffect(() => {
    if (timerState.status !== 'running' || !timerState.startTime) {
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - timerState.startTime) / 1000);
      setElapsedSeconds(timerState.accumulatedSeconds + diff);
    }, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [timerState.status, timerState.startTime, timerState.accumulatedSeconds]);

  // Timer Control Functions
  async function handleStartTimer(subject, goal) {
    const token = getStoredToken();
    let backendSessionId = null;

    if (currentUser && token) {
      const startPayload = {
        subject: subject || 'Mathematics',
        goalText: goal ? goal.trim() : null,
        title: goal && goal.trim() ? goal.trim() : `${subject || 'Mathematics'} Focus Session`,
        deviceId: pairingData?.device?.id || undefined,
      };

      const res = await startStudySession(token, startPayload);
      backendSessionId = res?.session?.id || null;
    }

    const now = Date.now();
    setTimerState({
      status: 'running',
      subject: subject || 'Mathematics',
      goal: goal || '',
      startTime: now,
      accumulatedSeconds: 0,
      sessionId: backendSessionId,
    });
    setElapsedSeconds(0);
  }

  function handlePauseTimer() {
    if (timerState.status !== 'running' || !timerState.startTime) return;
    const now = Date.now();
    const additionalSeconds = Math.floor((now - timerState.startTime) / 1000);
    const totalAccumulated = timerState.accumulatedSeconds + additionalSeconds;

    setTimerState((prev) => ({
      ...prev,
      status: 'paused',
      startTime: null,
      accumulatedSeconds: totalAccumulated,
    }));
    setElapsedSeconds(totalAccumulated);
  }

  function handleResumeTimer() {
    if (timerState.status !== 'paused') return;
    const now = Date.now();
    setTimerState((prev) => ({
      ...prev,
      status: 'running',
      startTime: now,
    }));
  }

  async function handleEndTimer() {
    let finalSeconds = timerState.accumulatedSeconds;
    if (timerState.status === 'running' && timerState.startTime) {
      finalSeconds += Math.floor((Date.now() - timerState.startTime) / 1000);
    }

    const token = getStoredToken();
    let returnedSession = null;

    if (currentUser && token && timerState.sessionId) {
      const endPayload = {
        notes: timerState.goal.trim() || undefined,
        status: 'completed',
      };
      const res = await endStudySession(token, timerState.sessionId, endPayload);
      returnedSession = res?.session;
    }

    const calculatedMinutes = returnedSession?.durationSeconds
      ? Math.max(1, Math.round(returnedSession.durationSeconds / 60))
      : Math.max(1, Math.round(finalSeconds / 60));
    const nowObj = new Date();
    const formattedTime = nowObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Format duration text
    let durationText = `${calculatedMinutes}m`;
    if (calculatedMinutes >= 60) {
      const hrs = Math.floor(calculatedMinutes / 60);
      const mins = calculatedMinutes % 60;
      durationText = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }

    // Simulated score for manual session demo
    const simulatedScore = `${Math.min(99, Math.max(88, 90 + Math.floor(Math.random() * 8)))}%`;

    const newSession = {
      id: returnedSession?.id || `sess-stu-${Date.now()}`,
      subject: returnedSession?.subject || timerState.subject,
      title: returnedSession?.title || (timerState.goal.trim() ? timerState.goal.trim() : `${timerState.subject} Focus Session`),
      date: 'Today · ' + nowObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: formattedTime,
      durationMinutes: calculatedMinutes,
      durationText,
      durationSecondsTotal: returnedSession?.durationSeconds || finalSeconds,
      focusScore: simulatedScore,
      isSimulatedScore: true,
      status: returnedSession?.status || 'completed',
      isUserRecorded: true,
      notes: returnedSession?.notes || timerState.goal.trim() || 'Self-directed study block.',
    };

    setSessions((prev) => [newSession, ...prev]);

    // Reset timer
    setTimerState({
      status: 'idle',
      subject: 'Mathematics',
      goal: '',
      startTime: null,
      accumulatedSeconds: 0,
      sessionId: null,
    });
    setElapsedSeconds(0);

    return newSession;
  }

  function handleResetTimer() {
    setTimerState({
      status: 'idle',
      subject: 'Mathematics',
      goal: '',
      startTime: null,
      accumulatedSeconds: 0,
      sessionId: null,
    });
    setElapsedSeconds(0);
  }

  // Safe Exit / Switch Role handling (prevents accidental loss of active timer)
  function handleExitAttempt() {
    if (timerState.status !== 'idle') {
      setShowExitConfirm(true);
    } else {
      onSwitchRole();
    }
  }

  function handleConfirmExit() {
    handleResetTimer();
    setShowExitConfirm(false);
    onSwitchRole();
  }

  // Calculate live study metrics for today
  const todaySessions = sessions.filter((s) => s.date.startsWith('Today'));
  const todayStudyMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const todayGoalPercent = Math.min(100, Math.round((todayStudyMinutes / dailyGoalMinutes) * 100));

  // Navigation Items
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'session',
      label: 'Study Session',
      badge: timerState.status === 'running' ? 'Active' : timerState.status === 'paused' ? 'Paused' : undefined,
      badgeType: timerState.status === 'running' ? 'badge-running' : 'badge-paused',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Previous Sessions',
      badge: `${sessions.length}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 8v4l3 3" />
          <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
        </svg>
      ),
    },
    {
      id: 'progress',
      label: 'My Progress',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      id: 'goals',
      label: 'Study Goals',
      badge: `${todayGoalPercent}%`,
      badgeType: todayGoalPercent >= 100 ? 'badge-goal-complete' : 'badge-neutral',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  // Helper formatting for live timer pill
  function formatPillTime(secs) {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  }

  // Format an ISO timestamp into a human-readable session date label
  function formatSessionDate(isoString) {
    if (!isoString) return 'Unknown Date';
    const d = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (d.toDateString() === today.toDateString()) return `Today · ${formatted}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday · ${formatted}`;
    return formatted;
  }

  // Format a duration in seconds to "Xh Ym" or "Xm"
  function formatDurationText(totalSeconds) {
    const mins = Math.max(0, Math.round(totalSeconds / 60));
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
    }
    return `${mins}m`;
  }

  // Titles for Student Header
  let headerTitle = 'Student Dashboard';
  let headerSubtitle = 'Daily study goals, active focus blocks & personal progress';

  if (activeTab === 'session') {
    headerTitle = 'Study Session';
    headerSubtitle = 'Self-directed focus timer & subject tracking';
  } else if (activeTab === 'history') {
    headerTitle = 'Previous Sessions';
    headerSubtitle = 'Past completed study blocks & focus ratings';
  } else if (activeTab === 'progress') {
    headerTitle = 'My Progress';
    headerSubtitle = 'Weekly habits, focus consistency & subject distribution';
  } else if (activeTab === 'goals') {
    headerTitle = 'Study Goals';
    headerSubtitle = 'Daily study time targets & achievement status';
  } else if (activeTab === 'settings') {
    headerTitle = 'Student Settings';
    headerSubtitle = 'Profile info, device connection & workspace preferences';
  }

  return (
    <div className="student-shell">
      {/* Mobile drawer backdrop */}
      {isSidebarOpen && (
        <div
          className="student-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Student Left Sidebar Navigation */}
      <aside className={`student-sidebar ${isSidebarOpen ? 'student-sidebar-open' : ''}`} aria-label="Student Navigation">
        <div className="student-brand-row">
          <div className="student-brand-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="student-brand-info">
            <span className="student-brand-title">Focus Portal</span>
            <span className="student-brand-tag">Student Workspace</span>
          </div>

          <button
            type="button"
            className="student-drawer-close"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Live Timer Status Box inside sidebar if running or paused */}
        {timerState.status !== 'idle' && (
          <div className={`student-sidebar-timer-box ${timerState.status === 'running' ? 'timer-box-running' : 'timer-box-paused'}`}>
            <div className="sidebar-timer-header">
              <span className="timer-status-dot" aria-hidden="true" />
              <span className="sidebar-timer-label">
                {timerState.status === 'running' ? 'Session Active' : 'Session Paused'}
              </span>
            </div>
            <div className="sidebar-timer-digits">{formatPillTime(elapsedSeconds)}</div>
            <span className="sidebar-timer-subject">{timerState.subject}</span>
            <button
              type="button"
              className="sidebar-timer-cta"
              onClick={() => {
                setActiveTab('session');
                setIsSidebarOpen(false);
              }}
            >
              Go to Session &rarr;
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="student-nav" aria-label="Student Sections">
          <span className="student-nav-heading">STUDENT MENU</span>
          <ul className="student-nav-list" role="list">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`student-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="student-nav-icon">{item.icon}</span>
                    <span className="student-nav-label">{item.label}</span>
                    {item.badge && (
                      <span className={`student-nav-badge ${item.badgeType || ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="student-sidebar-footer">
          <div className="student-profile-chip">
            <div className="student-avatar-small" aria-hidden="true">
              {studentProfile.initials}
            </div>
            <div className="student-chip-info">
              <span className="student-chip-name">{studentProfile.name}</span>
              <span className="student-chip-grade">{studentProfile.grade}</span>
            </div>
          </div>

          <button
            type="button"
            className="student-switch-role-btn"
            onClick={handleExitAttempt}
            aria-label="Switch role or return to welcome screen"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Switch Role</span>
          </button>
        </div>
      </aside>

      {/* Main Student Wrapper */}
      <div className="student-main-wrapper">
        {/* Student Header */}
        <header className="student-header">
          <div className="student-header-left">
            <button
              type="button"
              className="student-hamburger"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="student-header-titles">
              <h1 className="student-header-title">{headerTitle}</h1>
              <p className="student-header-subtitle">{headerSubtitle}</p>
            </div>
          </div>

          <div className="student-header-right">
            {/* Live active timer chip in header if user is on other tabs */}
            {timerState.status !== 'idle' && activeTab !== 'session' && (
              <button
                type="button"
                className={`header-active-timer-chip ${timerState.status === 'running' ? 'chip-running' : 'chip-paused'}`}
                onClick={() => setActiveTab('session')}
                title="Active session in progress. Click to view."
              >
                <span className="chip-dot" aria-hidden="true" />
                <span className="chip-time">{formatPillTime(elapsedSeconds)}</span>
                <span className="chip-subject header-hide-mobile">({timerState.subject})</span>
              </button>
            )}

            <div className="student-header-profile">
              <div className="student-profile-text header-hide-mobile">
                <span className="student-name">{studentProfile.name}</span>
                <span className="student-sub">{studentProfile.grade}</span>
              </div>
              <div className="student-avatar" title={`${studentProfile.name} (${studentProfile.grade})`}>
                {studentProfile.initials}
                <span className="student-online-dot" aria-hidden="true" />
              </div>
            </div>

            <button
              type="button"
              className="student-header-exit-btn"
              onClick={handleExitAttempt}
              title="Return to role selection"
            >
              <span className="header-hide-mobile">Switch Role</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Tab Content Rendering */}
        <main className="student-content">
          {activeTab === 'dashboard' && (
            <StudentDashboard
              profile={studentProfile}
              todayStudyMinutes={todayStudyMinutes}
              todaySessionsCount={todaySessions.length}
              dailyGoalMinutes={dailyGoalMinutes}
              todayGoalPercent={todayGoalPercent}
              sessions={sessions}
              timerStatus={timerState.status}
              timerSubject={timerState.subject}
              elapsedSeconds={elapsedSeconds}
              onStartSessionClick={() => setActiveTab('session')}
              onViewHistoryClick={() => setActiveTab('history')}
              onAdjustGoalClick={() => setActiveTab('goals')}
            />
          )}

          {activeTab === 'session' && (
            <StudentTimer
              profile={studentProfile}
              deviceName={studentProfile.device}
              timerState={timerState}
              elapsedSeconds={elapsedSeconds}
              onStartTimer={handleStartTimer}
              onPauseTimer={handlePauseTimer}
              onResumeTimer={handleResumeTimer}
              onEndTimer={handleEndTimer}
              onViewHistory={() => setActiveTab('history')}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'history' && (
            <StudentHistory
              sessions={sessions}
              sessionsLoading={sessionsLoading}
              sessionsError={sessionsError}
              isAuthenticated={!!currentUser}
              onStartNewSession={() => setActiveTab('session')}
            />
          )}

          {activeTab === 'progress' && (
            <StudentProgress
              sessions={sessions}
              dailyGoalMinutes={dailyGoalMinutes}
              todayStudyMinutes={todayStudyMinutes}
            />
          )}

          {activeTab === 'goals' && (
            <StudentGoals
              dailyGoalMinutes={dailyGoalMinutes}
              todayStudyMinutes={todayStudyMinutes}
              todayGoalPercent={todayGoalPercent}
              onUpdateGoal={(newMinutes) => setDailyGoalMinutes(newMinutes)}
              onStartSessionClick={() => setActiveTab('session')}
            />
          )}

          {activeTab === 'settings' && (
            <StudentSettings
              profile={studentProfile}
              dailyGoalMinutes={dailyGoalMinutes}
              sessionsCount={sessions.length}
              onSwitchRole={handleExitAttempt}
              currentUser={currentUser}
              onGoToLogin={onGoToLogin}
              onPairingUpdated={(newStatus) => setPairingData(newStatus)}
            />
          )}
        </main>
      </div>

      {/* Confirmation Modal if attempting to exit while timer is active */}
      {showExitConfirm && (
        <div className="student-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-exit-title">
          <div className="student-confirm-card">
            <div className="confirm-icon-wrap" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 id="confirm-exit-title" className="confirm-title">Active Study Timer in Progress</h2>
            <p className="confirm-desc">
              You currently have an active study session for <strong>{timerState.subject}</strong> ({formatPillTime(elapsedSeconds)} elapsed).
              Leaving the student workspace now will discard this unfinished session.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn-secondary"
                onClick={() => setShowExitConfirm(false)}
              >
                Keep Studying
              </button>
              <button
                type="button"
                className="confirm-btn-danger"
                onClick={handleConfirmExit}
              >
                Discard &amp; Switch Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentPortal;
