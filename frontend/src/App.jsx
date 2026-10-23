import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './App.css';

/**
 * App Component (Stage 1)
 *
 * Serves as the main container and layout shell for the AI Productivity Coach
 * Parent Dashboard.
 *
 * In Stage 1:
 * - Arranges the persistent left Sidebar and the top Header.
 * - Manages the active navigation tab state (defaulting to 'overview').
 * - Prepares the central dashboard content container ready for Stage 2 cards.
 */
function App() {
  // Active navigation tab state ('overview' is selected for Stage 1)
  const [activeTab] = useState('overview');

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
