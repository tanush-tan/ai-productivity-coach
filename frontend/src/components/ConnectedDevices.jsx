import { useState, useEffect } from 'react';
import './ConnectedDevices.css';

/**
 * ConnectedDevices Component
 *
 * Dedicated view for managing supervised family hardware.
 * Features:
 *   - Fictional demo devices: Liam's Laptop, Study PC, and Tablet
 *   - Status pills (Online / Offline) with pulsing indicators
 *   - Detailed device telemetry (User, Session, Last Sync, Battery/Power, Network)
 *   - Quick filter buttons (All, Online, Offline)
 *   - Interactive "Connect Device" pairing-code simulator modal
 */
function ConnectedDevices() {
  // Demo dataset for the 3 supervised devices
  const [devices] = useState([
    {
      id: 'dev-1',
      name: "Liam's Laptop",
      deviceType: 'laptop',
      model: 'MacBook Air · macOS Sonoma',
      status: 'online',
      user: 'Liam (Child Profile)',
      lastSync: 'Active now',
      ip: '192.168.1.104',
      battery: '88% · Charging',
      agentVersion: 'v1.4.2 (Demo)',
      session: {
        active: true,
        name: 'Focus Block: Math & Homework',
        duration: '42m active',
      },
      deviceCode: 'DEV-LL-8401',
    },
    {
      id: 'dev-2',
      name: 'Study PC',
      deviceType: 'desktop',
      model: 'Desktop Tower · Windows 11',
      status: 'online',
      user: 'Shared Family Room',
      lastSync: '2m ago',
      ip: '192.168.1.108',
      battery: 'Direct AC Power',
      agentVersion: 'v1.4.2 (Demo)',
      session: {
        active: false,
        name: 'Idle · Ready for Session',
        duration: 'Screen Off',
      },
      deviceCode: 'DEV-SPC-1092',
    },
    {
      id: 'dev-3',
      name: 'Tablet',
      deviceType: 'tablet',
      model: 'iPad 10th Gen · iPadOS 17',
      status: 'offline',
      user: 'Emma (Child Profile)',
      lastSync: 'Yesterday, 7:45 PM',
      ip: '192.168.1.115',
      battery: '64% Battery',
      agentVersion: 'v1.4.0 (Demo)',
      session: {
        active: false,
        name: 'Standby / Locked',
        duration: 'No active session',
      },
      deviceCode: 'DEV-TAB-3310',
    },
  ]);

  // Filter state: 'all' | 'online' | 'offline'
  const [filter, setFilter] = useState('all');

  // Pairing Modal state
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [pairingSimulatedSuccess, setPairingSimulatedSuccess] = useState(false);
  const demoPairingCode = 'COACH-7492';

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isPairingOpen) {
        handleCloseModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPairingOpen]);

  function handleOpenModal() {
    setIsPairingOpen(true);
    setPairingSimulatedSuccess(false);
    setIsCopied(false);
  }

  function handleCloseModal() {
    setIsPairingOpen(false);
    setPairingSimulatedSuccess(false);
    setIsCopied(false);
  }

  function handleCopyCode() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(demoPairingCode).catch(() => {});
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
  }

  function handleSimulateConnect() {
    setPairingSimulatedSuccess(true);
  }

  // Filter devices list based on selected filter tab
  const filteredDevices = devices.filter((d) => {
    if (filter === 'online') return d.status === 'online';
    if (filter === 'offline') return d.status === 'offline';
    return true;
  });

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;

  // Render SVG icons according to device hardware type
  function renderDeviceIcon(type) {
    if (type === 'desktop') {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    }
    if (type === 'tablet') {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    }
    // Default: Laptop
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    );
  }

  return (
    <section className="devices-view" aria-label="Connected Devices Management">
      {/* 1. Header with title, demo disclaimer, and Connect Device CTA */}
      <div className="devices-header-row">
        <div className="devices-header-left">
          <div className="devices-heading-wrap">
            <h2 className="devices-view-title">Connected Devices</h2>
            <span className="devices-demo-badge" title="Hardware data is simulated demonstration data">
              <span className="devices-demo-dot" aria-hidden="true" />
              Fictional Demo Hardware
            </span>
          </div>
          <p className="devices-view-description">
            Supervised devices linked to your parent account for study session monitoring and coaching.
          </p>
        </div>

        <button
          type="button"
          className="connect-device-btn"
          onClick={handleOpenModal}
          aria-haspopup="dialog"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Connect Device</span>
        </button>
      </div>

      {/* 2. Sub-toolbar: Filter tabs and quick count summary */}
      <div className="devices-toolbar">
        <div className="devices-filter-group" role="tablist" aria-label="Filter devices by status">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={`devices-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Devices ({devices.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'online'}
            className={`devices-filter-btn ${filter === 'online' ? 'active' : ''}`}
            onClick={() => setFilter('online')}
          >
            Online ({onlineCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'offline'}
            className={`devices-filter-btn ${filter === 'offline' ? 'active' : ''}`}
            onClick={() => setFilter('offline')}
          >
            Offline ({offlineCount})
          </button>
        </div>

        <span className="devices-stats-summary">
          Showing {filteredDevices.length} of {devices.length} demo devices
        </span>
      </div>

      {/* 3. Devices Grid */}
      <div className="devices-grid">
        {filteredDevices.map((device) => {
          const isOnline = device.status === 'online';

          return (
            <article
              key={device.id}
              className="device-card"
              aria-label={`${device.name} - ${isOnline ? 'Online' : 'Offline'}`}
            >
              {/* Card Header: Device icon, name, model, and status badge */}
              <div className="device-card-header">
                <div className="device-card-identity">
                  <div className={`device-type-icon ${!isOnline ? 'offline' : ''}`}>
                    {renderDeviceIcon(device.deviceType)}
                  </div>
                  <div className="device-name-wrap">
                    <h3 className="device-name">{device.name}</h3>
                    <span className="device-type-name">{device.model}</span>
                  </div>
                </div>

                <span className={`device-status-badge ${isOnline ? 'online' : 'offline'}`}>
                  <span className="status-live-indicator" aria-hidden="true" />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Card Body: User profile, session box, sync time, network & battery */}
              <div className="device-card-body">
                <div className="device-info-row">
                  <span className="device-info-label">Assigned Profile</span>
                  <span className="device-info-value">{device.user}</span>
                </div>

                <div className="device-session-box">
                  <div className="device-session-label">Session Status</div>
                  <div className="device-session-name">
                    <span>{device.session.name}</span>
                    <span className="device-session-duration">{device.session.duration}</span>
                  </div>
                </div>

                <div className="device-info-row">
                  <span className="device-info-label">Last Sync</span>
                  <span className={`device-info-value ${isOnline ? 'active-highlight' : ''}`}>
                    {device.lastSync}
                  </span>
                </div>

                <div className="device-info-row">
                  <span className="device-info-label">Power / Battery</span>
                  <span className="device-info-value">{device.battery}</span>
                </div>

                <div className="device-info-row">
                  <span className="device-info-label">Local IP (Demo)</span>
                  <span className="device-info-value">{device.ip}</span>
                </div>
              </div>

              {/* Card Footer: Device code and simulated action */}
              <div className="device-card-footer">
                <span className="device-id-code">ID: {device.deviceCode}</span>
                <button
                  type="button"
                  className="device-action-link"
                  onClick={() => alert(`Fictional Demo: Device settings for ${device.name} will be configurable in a future stage.`)}
                >
                  Configure · Demo
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* 4. Pairing Code Simulator Modal */}
      {isPairingOpen && (
        <div
          className="pairing-backdrop"
          onClick={handleCloseModal}
          role="presentation"
        >
          <div
            className="pairing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pairing-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button (✕) */}
            <button
              type="button"
              className="pairing-close-btn"
              onClick={handleCloseModal}
              aria-label="Close pairing modal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="pairing-modal-header">
              <div className="pairing-badge-row">
                <span className="devices-demo-badge">
                  <span className="devices-demo-dot" aria-hidden="true" />
                  Pairing Simulator
                </span>
              </div>
              <h3 id="pairing-modal-title" className="pairing-modal-title">
                Connect a Supervised Device
              </h3>
              <p className="pairing-modal-subtitle">
                Link a child’s laptop, PC, or tablet to enable parent supervision and study focus tracking.
              </p>
            </div>

            {/* Normal flow vs simulated success */}
            {!pairingSimulatedSuccess ? (
              <>
                {/* Step-by-step instructions */}
                <div className="pairing-steps-list">
                  <div className="pairing-step-item">
                    <span className="pairing-step-number">1</span>
                    <span>Install and open <strong>AI Productivity Coach</strong> on your child’s device.</span>
                  </div>
                  <div className="pairing-step-item">
                    <span className="pairing-step-number">2</span>
                    <span>Select <strong>“Connect to Parent Dashboard”</strong> when prompted.</span>
                  </div>
                  <div className="pairing-step-item">
                    <span className="pairing-step-number">3</span>
                    <span>Enter this one-time pairing code into the prompt:</span>
                  </div>
                </div>

                {/* Pairing Code Card */}
                <div className="pairing-code-box">
                  <span className="pairing-code-label">One-Time Pairing Code</span>
                  <div className="pairing-code-digits">{demoPairingCode}</div>

                  <div className="pairing-code-actions">
                    <button
                      type="button"
                      className={`copy-code-btn ${isCopied ? 'copied' : ''}`}
                      onClick={handleCopyCode}
                    >
                      {isCopied ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <span className="pairing-expiry-text">
                    Code valid for 10 minutes (Demo simulation)
                  </span>
                </div>

                {/* Modal Footer */}
                <div className="pairing-modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-simulate"
                    onClick={handleSimulateConnect}
                  >
                    Simulate Device Paired
                  </button>
                </div>
              </>
            ) : (
              /* Success confirmation state */
              <div className="pairing-success-box">
                <div className="pairing-success-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h4 className="pairing-success-title">Device Paired Successfully (Demo)</h4>
                <p className="pairing-success-desc">
                  Simulation complete! In the live application with backend connectivity, your new device will automatically appear in this list and begin broadcasting session telemetry.
                </p>
                <div className="pairing-modal-footer" style={{ width: '100%', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn-simulate"
                    onClick={handleCloseModal}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default ConnectedDevices;
