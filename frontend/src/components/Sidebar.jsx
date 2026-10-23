/**
 * Sidebar Component (Stage 1)
 * 
 * Renders the persistent left navigation sidebar with the application
 * branding and 4 primary navigation items.
 *
 * In Stage 1:
 * - "Overview" is the active tab.
 * - Remaining tabs show informative badges so users know they will be implemented in subsequent stages.
 */
function Sidebar({ activeTab = 'overview' }) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      badge: 'Active',
      isAvailable: true,
      // Minimal inline SVG icon for Dashboard / Overview
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    {
      id: 'devices',
      label: 'Devices',
      badge: 'Stage 3',
      isAvailable: false,
      // Minimal inline SVG icon for Connected Devices
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )
    },
    {
      id: 'sessions',
      label: 'Monitoring Sessions',
      badge: 'Stage 4',
      isAvailable: false,
      // Minimal inline SVG icon for Clock / Activity Sessions
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Reports',
      badge: 'Soon',
      isAvailable: false,
      // Minimal inline SVG icon for Reports / Bar Chart
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          {/* Shield / Protection symbol */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="brand-info">
          <h2 className="brand-title">AI Productivity Coach</h2>
          <span className="brand-subtitle">Parent Supervision</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">MAIN NAVIGATION</div>
        <ul className="nav-list">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <div
                  className={`nav-item ${isActive ? 'active' : ''} ${!item.isAvailable ? 'nav-item-disabled' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className={`nav-badge ${isActive ? 'badge-active-tab' : 'badge-stage'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer Info */}
      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-dot"></span>
          <span>Desktop Host Active</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
