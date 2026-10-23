import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import SummaryCards from './components/SummaryCards';
import ConnectedDevices from './components/ConnectedDevices';
import MonitoringSessions from './components/MonitoringSessions';
import OverallReports from './components/OverallReports';
import './App.css';

/**
 * App Component
 *
 * Top-level container. Manages:
 *   1. currentView   — 'login' | 'dashboard'
 *   2. activeTab     — 'overview' | 'devices' | 'sessions' | 'reports'
 *   3. isSidebarOpen — mobile drawer open/closed (ignored on desktop via CSS)
 */
function App() {
  const [currentView, setCurrentView] = useState('login');
  const [activeTab, setActiveTab] = useState('overview');

  // Mobile sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function handleLoginSuccess() {
    setCurrentView('dashboard');
  }

  function handleMenuClick() {
    setIsSidebarOpen(true);
  }

  function handleSidebarClose() {
    setIsSidebarOpen(false);
  }

  function handleTabSelect(tabId) {
    setActiveTab(tabId);
  }

  // --- Login view ---
  if (currentView === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Dynamic header copy based on current section
  let headerTitle = 'Parent Dashboard';
  let headerSubtitle = 'Supervision & Device Sessions';

  if (activeTab === 'devices') {
    headerTitle = 'Connected Devices';
    headerSubtitle = 'Hardware & Pairing Telemetry';
  } else if (activeTab === 'sessions') {
    headerTitle = 'Monitoring Sessions';
    headerSubtitle = 'Supervised Device Sessions & Focus Logs';
  } else if (activeTab === 'reports') {
    headerTitle = 'Overall Reports';
    headerSubtitle = 'Family Study Trends & Analytics';
  }

  // --- Dashboard view ---
  return (
    <div className="dashboard-shell">
      {/* Semi-transparent backdrop — visible on mobile when drawer is open */}
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={handleSidebarClose}
          aria-hidden="true"
        />
      )}

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        onSelectTab={handleTabSelect}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header
          title={headerTitle}
          subtitle={headerSubtitle}
          onMenuClick={handleMenuClick}
        />

        <main className="dashboard-content">
          {activeTab === 'devices' && (
            /* Stage 3 Feature: Dedicated Connected Devices View */
            <ConnectedDevices />
          )}

          {activeTab === 'sessions' && (
            /* Stage 4 Feature: Dedicated Monitoring Sessions View */
            <MonitoringSessions />
          )}

          {activeTab === 'reports' && (
            /* Stage 5 Feature: Dedicated Overall Reports View */
            <OverallReports />
          )}

          {activeTab === 'overview' && (
            /* Overview Tab: Summary Cards & Roadmap Status */
            <>
              {/* Stage 2 Feature: Dashboard Summary Cards */}
              <SummaryCards
                onViewDevices={() => setActiveTab('devices')}
                onViewSessions={() => setActiveTab('sessions')}
              />

              {/* Progress / Next Step Preview */}
              <section className="stage-placeholder-card">
                <div className="card-badge">Stage 5 Complete</div>
                <h2>All Core Frontend Stages Ready</h2>
                <p>
                  Overview Metrics, Connected Devices, Monitoring Sessions, Detailed Session Reports, and Overall Family Analytics are all fully implemented with responsive styling.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--primary-color)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <span>View Overall Reports</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('sessions')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Monitoring Sessions</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('devices')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Connected Devices (3)</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
                <div className="stage-next-steps">
                  <span className="next-label">Architecture Status:</span>
                  <p>Frontend presentation tier complete. Designed for seamless pairing with future local daemon / backend services.</p>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
