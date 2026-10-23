import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
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
          <section className="stage-placeholder-card">
            <div className="card-badge">Stage 1 Complete</div>
            <h2>Dashboard Shell Ready</h2>
            <p>
              The global layout, left navigation sidebar, and top header are successfully initialized.
            </p>
            <div className="stage-next-steps">
              <span className="next-label">Next Up (Stage 2):</span>
              <p>Summary metric cards for <em>Connected Devices</em>, <em>Active Sessions</em>, and <em>Total Sessions</em>.</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
