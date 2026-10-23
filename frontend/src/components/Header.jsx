/**
 * Header Component (Stage 1)
 * 
 * Renders the top navigation header with the current dashboard title,
 * descriptive subtitle, and a placeholder for the parent profile.
 */
function Header({ title = 'Parent Dashboard', subtitle = 'Supervision & Device Sessions' }) {
  // Fictional parent profile information (demo only)
  const parentProfile = {
    name: 'Sarah Jenkins',
    role: 'Parent Admin',
    initials: 'SJ'
  };

  return (
    <header className="dashboard-header">
      {/* Title & View Context */}
      <div className="header-titles">
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>

      {/* Parent Profile Placeholder */}
      <div className="header-profile">
        <div className="profile-badge">Demo Mode</div>
        <div className="profile-info">
          <span className="profile-name">{parentProfile.name}</span>
          <span className="profile-role">{parentProfile.role}</span>
        </div>
        <div className="profile-avatar" title={`${parentProfile.name} (${parentProfile.role})`}>
          {parentProfile.initials}
          <span className="avatar-online-dot"></span>
        </div>
      </div>
    </header>
  );
}

export default Header;
