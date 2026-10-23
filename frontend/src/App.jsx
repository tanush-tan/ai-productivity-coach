import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import SummaryCards from './components/SummaryCards';
import ConnectedDevices from './components/ConnectedDevices';
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
  const headerTitle = activeTab === 'devices' ? 'Connected Devices' : 'Parent Dashboard';
  const headerSubtitle = activeTab === 'devices' ? 'Hardware & Pairing Telemetry' : 'Supervision & Device Sessions';

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
          {activeTab === 'devices' ? (
            /* Stage 3 Feature: Dedicated Connected Devices View */
            <ConnectedDevices />
          ) : (
            /* Overview Tab: Summary Cards & Roadmap Status */
            <>
              {/* Stage 2 Feature: Dashboard Summary Cards */}
              <SummaryCards onViewDevices={() => setActiveTab('devices')} />

              {/* Progress / Next Step Preview */}
              <section className="stage-placeholder-card">
                <div className="card-badge">Stage 3 Complete</div>
                <h2>Connected Devices View Available</h2>
                <p>
                  Manage your 3 demo devices (Liam’s Laptop, Study PC, and Tablet) or simulate pairing new hardware.
                </p>
                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('devices')}
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
                    <span>View Connected Devices</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
                <div className="stage-next-steps">
                  <span className="next-label">Next Up (Stage 4):</span>
                  <p>Recent Monitoring Sessions table with sample start/end times and status filters.</p>
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
