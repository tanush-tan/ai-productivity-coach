import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import './App.css';

/**
 * App Component
 *
 * Top-level container that decides which screen to display:
 *   - 'login'     → <LoginPage />  (the first screen the parent sees)
 *   - 'dashboard' → the existing dashboard shell (Sidebar + Header + content)
 *
 * Navigation is handled with a single piece of state so no routing
 * library is needed at this stage.
 */
function App() {
  // Controls which view is currently rendered
  const [currentView, setCurrentView] = useState('login');

  // Active navigation tab state (defaults to 'overview')
  const [activeTab] = useState('overview');

  // Called by LoginPage when demo credentials are accepted
  function handleLoginSuccess() {
    setCurrentView('dashboard');
  }

  // --- Render login page ---
  if (currentView === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // --- Render dashboard (unchanged from Stage 1) ---
  return (
    <div className="dashboard-shell">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} />

      {/* 2. Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          title="Parent Dashboard"
          subtitle="Supervision & Device Sessions"
        />

        {/* Central Dashboard Content Area */}
        <main className="dashboard-content">
          {/* Stage 1 Shell Readiness Card */}
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
