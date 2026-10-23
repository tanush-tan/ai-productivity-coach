import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import SummaryCards from './components/SummaryCards';
import './App.css';

/**
 * App Component
 *
 * Top-level container. Manages two orthogonal pieces of state:
 *   1. currentView  — 'login' | 'dashboard'
 *   2. isSidebarOpen — mobile drawer open/closed (ignored on desktop via CSS)
 */
function App() {
  const [currentView, setCurrentView] = useState('login');
  const [activeTab] = useState('overview');

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

  // --- Login view ---
  if (currentView === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
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
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header
          title="Parent Dashboard"
          subtitle="Supervision & Device Sessions"
          onMenuClick={handleMenuClick}
        />

        <main className="dashboard-content">
          {/* Stage 2 Feature: Dashboard Summary Cards */}
          <SummaryCards />

          {/* Progress / Next Step Preview */}
          <section className="stage-placeholder-card">
            <div className="card-badge">Stage 2 Complete</div>
            <h2>Summary Cards Active</h2>
            <p>
              Overview metric cards for connected devices, active study sessions, and total sessions are now live with responsive styling.
            </p>
            <div className="stage-next-steps">
              <span className="next-label">Next Up (Stage 3):</span>
              <p>Connected Devices section with sample device statuses, device types, and pairing details.</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
