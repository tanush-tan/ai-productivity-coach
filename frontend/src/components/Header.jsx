/**
 * Header Component
 *
 * Props:
 *   title       — page title string
 *   subtitle    — page subtitle string
 *   onMenuClick — callback fired when the hamburger button is pressed (mobile only)
 *
 * The hamburger button is always rendered in the DOM but hidden on desktop
 * via CSS (display: none above 1024px), so no conditional JSX is needed.
 */
function Header({
  title = 'Parent Dashboard',
  subtitle = 'Supervision & Device Sessions',
  onMenuClick,
}) {
  const parentProfile = {
    name: 'Sarah Jenkins',
    role: 'Parent Admin',
    initials: 'SJ',
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        {/* Hamburger button — hidden on desktop via CSS */}
        <button
          id="mobile-menu-btn"
          className="mobile-menu-btn"
          type="button"
          aria-label="Open navigation menu"
          aria-haspopup="true"
          onClick={onMenuClick}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Title & View Context */}
        <div className="header-titles">
          <h1 className="header-title">{title}</h1>
          {/* Subtitle hidden on very small screens to keep header clean */}
          <p className="header-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* Parent Profile Placeholder */}
      <div className="header-profile">
        {/* Badge and name hidden on small screens; avatar always visible */}
        <div className="profile-badge header-hide-mobile">Demo Mode</div>
        <div className="profile-info header-hide-mobile">
          <span className="profile-name">{parentProfile.name}</span>
          <span className="profile-role">{parentProfile.role}</span>
        </div>
        <div
          className="profile-avatar"
          title={`${parentProfile.name} (${parentProfile.role})`}
          aria-label={`${parentProfile.name}, ${parentProfile.role}`}
        >
          {parentProfile.initials}
          <span className="avatar-online-dot" aria-hidden="true"></span>
        </div>
      </div>
    </header>
  );
}

export default Header;
