/**
 * Sidebar Component
 *
 * Props:
 *   activeTab   — id string of the currently active nav item ('overview' | 'devices' | ...)
 *   isOpen      — boolean controlling the mobile drawer (ignored on desktop via CSS)
 *   onClose     — callback to close the mobile drawer
 *   onSelectTab — callback fired when an available nav tab is selected
 *
 * On desktop (> 1024px): permanently visible; isOpen and onClose have no visual effect.
 * On mobile/tablet (≤ 1024px): slides in from the left when isOpen is true.
 *   A close button (✕) inside the drawer lets keyboard and touch users dismiss it.
 *   Pressing Escape also closes the drawer (handled here via onKeyDown).
 */
function Sidebar({ activeTab = 'overview', isOpen = false, onClose, onSelectTab }) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      badge: activeTab === 'overview' ? 'Active' : undefined,
      isAvailable: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      badge: activeTab === 'devices' ? 'Active' : '3 Devices',
      isAvailable: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    }
  ];

  // Close the drawer when Escape is pressed
  function handleKeyDown(event) {
    if (event.key === 'Escape' && onClose) {
      onClose();
    }
  }

  // Available nav items switch tabs and close the mobile drawer
  function handleNavClick(item) {
    if (item.isAvailable) {
      if (onSelectTab) {
        onSelectTab(item.id);
      }
      if (onClose) {
        onClose();
      }
    }
  }

  return (
    <aside
      className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
      aria-label="Main navigation"
      // Allow the sidebar itself to receive keyboard events for Escape handling
      onKeyDown={handleKeyDown}
    >
      {/* Sidebar header row: brand + mobile close button */}
      <div className="sidebar-brand">
        <div className="brand-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="brand-info">
          <h2 className="brand-title">AI Productivity Coach</h2>
          <span className="brand-subtitle">Parent Supervision</span>
        </div>

        {/* Close button — visible only on mobile (hidden via CSS on desktop) */}
        <button
          id="sidebar-close-btn"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close navigation menu"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Navigation list */}
      <nav className="sidebar-nav" aria-label="Dashboard sections">
        <div className="nav-section-label">MAIN NAVIGATION</div>
        <ul className="nav-list" role="list">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <div
                  className={`nav-item ${isActive ? 'active' : ''} ${!item.isAvailable ? 'nav-item-disabled' : ''}`}
                  role={item.isAvailable ? 'button' : undefined}
                  tabIndex={item.isAvailable ? 0 : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  aria-disabled={!item.isAvailable ? true : undefined}
                  onClick={() => handleNavClick(item)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && item.isAvailable) {
                      e.preventDefault();
                      handleNavClick(item);
                    }
                  }}
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

      {/* Sidebar footer */}
      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-dot" aria-hidden="true"></span>
          <span>Desktop Host Active</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
