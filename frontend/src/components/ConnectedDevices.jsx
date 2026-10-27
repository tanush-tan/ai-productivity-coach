import { useState, useEffect, useCallback } from 'react';
import { getStoredToken } from '../services/auth';
import { requestPairingCode, fetchParentDevices, decommissionDevice } from '../services/pairing';
import './ConnectedDevices.css';

/**
 * ConnectedDevices Component
 *
 * Dedicated view for managing supervised family hardware.
 * Displays real devices paired to the authenticated parent account via PostgreSQL backend.
 * Provides a modal to generate single-use, 10-minute pairing codes.
 */
function ConnectedDevices() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filter state: 'all' | 'online' | 'offline'
  const [filter, setFilter] = useState('all');

  // Pairing Modal state
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingExpiresAt, setPairingExpiresAt] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [pairingError, setPairingError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Decommission modal / action state
  const [deviceToDecommission, setDeviceToDecommission] = useState(null);
  const [isDecommissioning, setIsDecommissioning] = useState(false);
  const [decommissionError, setDecommissionError] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');

  // Load parent devices from backend API
  useEffect(() => {
    let isMounted = true;

    async function load() {
      const token = getStoredToken();
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const data = await fetchParentDevices(token);
        if (isMounted) {
          setDevices(data.devices || []);
          setLoadError('');
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err.message || 'Failed to load devices.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // Handle generating a new pairing code
  const handleGenerateCode = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setPairingError('Please sign in to generate pairing codes.');
      return;
    }

    try {
      setIsGeneratingCode(true);
      setPairingError('');
      const data = await requestPairingCode(token);
      setPairingCode(data.code);
      setPairingExpiresAt(data.expiresAt);
    } catch (err) {
      setPairingError(err.message || 'Failed to generate code.');
    } finally {
      setIsGeneratingCode(false);
    }
  }, []);

  function handleOpenModal() {
    setIsPairingOpen(true);
    setIsCopied(false);
    setPairingError('');
    handleGenerateCode();
  }

  function handleCloseModal() {
    setIsPairingOpen(false);
    setIsCopied(false);
    setPairingError('');
    // Trigger refresh of device list
    setRefreshTrigger((prev) => prev + 1);
  }

  async function handleDecommissionConfirm() {
    if (!deviceToDecommission) return;
    const token = getStoredToken();
    if (!token) {
      setDecommissionError('Please sign in to manage devices.');
      return;
    }

    try {
      setIsDecommissioning(true);
      setDecommissionError('');
      await decommissionDevice(token, deviceToDecommission.id);
      setActionFeedback(`Device "${deviceToDecommission.name}" was decommissioned successfully.`);
      setDeviceToDecommission(null);
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setActionFeedback(''), 4000);
    } catch (err) {
      setDecommissionError(err.message || 'Failed to decommission device.');
    } finally {
      setIsDecommissioning(false);
    }
  }

  // Close modal on Escape key press
  useEffect(() => {
    if (!isPairingOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsPairingOpen(false);
        setIsCopied(false);
        setPairingError('');
        setRefreshTrigger((prev) => prev + 1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPairingOpen]);

  function handleCopyCode() {
    if (!pairingCode) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pairingCode).catch(() => {});
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
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
    if (type === 'phone') {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="2" width="14" height="20" rx="2" />
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
      {/* 1. Header with title and Connect Device CTA */}
      <div className="devices-header-row">
        <div className="devices-header-left">
          <div className="devices-heading-wrap">
            <h2 className="devices-view-title">Connected Devices</h2>
            <span className="devices-demo-badge" title="Live devices connected to your parent account">
              <span className="devices-demo-dot" aria-hidden="true" />
              PostgreSQL Telemetry
            </span>
          </div>
          <p className="devices-view-description">
            Supervised hardware paired to your parent account for study session monitoring and coaching.
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
          Showing {filteredDevices.length} of {devices.length} registered devices
        </span>
      </div>

      {/* 3. Loading and Error States */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
          <p>Loading devices from database…</p>
        </div>
      )}

      {loadError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '14px 18px', borderRadius: '8px', color: '#fca5a5' }}>
          <p style={{ margin: 0 }}>{loadError}</p>
        </div>
      )}

      {actionFeedback && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 18px', borderRadius: '8px', color: '#6ee7b7', fontSize: '13px' }}>
          {actionFeedback}
        </div>
      )}

      {/* 4. Empty State */}
      {!isLoading && !loadError && devices.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--bg-surface, #1e293b)',
          border: '1px dashed var(--border-color, #334155)',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>💻</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            No Devices Paired Yet
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
            Click <strong>Connect Device</strong> above to generate a 10-minute pairing code for your student’s computer.
          </p>
          <button
            type="button"
            className="connect-device-btn"
            onClick={handleOpenModal}
            style={{ margin: '0 auto' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Connect First Device</span>
          </button>
        </div>
      )}

      {/* 5. Devices Grid */}
      {!isLoading && !loadError && filteredDevices.length > 0 && (
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
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 className="device-card-name">{device.name}</h3>
                      <p className="device-card-model">
                        {device.model || `${device.deviceType.charAt(0).toUpperCase() + device.deviceType.slice(1)}`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`device-status-badge ${isOnline ? 'status-online' : 'status-offline'}`}
                    role="status"
                  >
                    <span className="status-indicator-dot" aria-hidden="true" />
                    <span>{isOnline ? 'Online' : 'Offline'}</span>
                  </span>
                </div>

                {/* Card Body: Paired Student and Metadata */}
                <div className="device-card-body">
                  <div className="device-detail-row">
                    <span className="detail-key">Assigned Student</span>
                    <span className="detail-val highlight-user">
                      {device.studentName ? `${device.studentName} (${device.studentInitials || 'Student'})` : 'Unassigned'}
                    </span>
                  </div>

                  <div className="device-detail-row">
                    <span className="detail-key">Device Code</span>
                    <span className="detail-val">
                      <code style={{ fontSize: '12px' }}>{device.deviceCode || 'Pending Sync'}</code>
                    </span>
                  </div>

                  <div className="device-detail-row">
                    <span className="detail-key">Monitoring Status</span>
                    <span className="detail-val">
                      {isOnline ? 'Active Session' : 'Offline · Awaiting Session'}
                    </span>
                  </div>

                  <div className="device-detail-row">
                    <span className="detail-key">Paired Date</span>
                    <span className="detail-val">
                      {device.createdAt ? new Date(device.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Decommission / Disconnect */}
                <div className="device-card-actions">
                  <button
                    type="button"
                    className="btn-decommission-action"
                    onClick={() => {
                      setDecommissionError('');
                      setDeviceToDecommission(device);
                    }}
                    title={`Decommission ${device.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Decommission</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 6. Interactive Pairing Modal */}
      {isPairingOpen && (
        <div
          className="pairing-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pairing-modal-title"
        >
          <div className="pairing-modal-card">
            {/* Modal Header */}
            <div className="pairing-modal-header">
              <div>
                <h3 id="pairing-modal-title" className="pairing-modal-title">
                  Connect Student Device
                </h3>
                <p className="pairing-modal-subtitle">
                  Generate a one-time pairing code to link a child’s computer.
                </p>
              </div>
              <button
                type="button"
                className="pairing-modal-close-btn"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="pairing-modal-body">
              {/* Steps instructions */}
              <div className="pairing-steps-list">
                <div className="pairing-step-item">
                  <span className="pairing-step-number">1</span>
                  <span>Have your student open <strong>AI Productivity Coach</strong> and go to the Student Portal.</span>
                </div>
                <div className="pairing-step-item">
                  <span className="pairing-step-number">2</span>
                  <span>Open <strong>Settings &rarr; Device &amp; Supervision Status</strong> on their device.</span>
                </div>
                <div className="pairing-step-item">
                  <span className="pairing-step-number">3</span>
                  <span>Enter this one-time code to link their account and computer:</span>
                </div>
              </div>

              {pairingError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '6px', color: '#fca5a5', fontSize: '13px', marginBottom: '14px' }}>
                  {pairingError}
                </div>
              )}

              {/* Pairing Code Card */}
              <div className="pairing-code-box">
                <span className="pairing-code-label">One-Time Pairing Code</span>
                <div className="pairing-code-digits" style={{ letterSpacing: '2px', fontFamily: 'monospace' }}>
                  {isGeneratingCode ? 'GENERATING…' : (pairingCode || '---- ---- ----')}
                </div>

                <div className="pairing-code-actions">
                  <button
                    type="button"
                    className={`copy-code-btn ${isCopied ? 'copied' : ''}`}
                    onClick={handleCopyCode}
                    disabled={isGeneratingCode || !pairingCode}
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

                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={isGeneratingCode}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-color, #475569)',
                      color: 'var(--text-secondary, #94a3b8)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Generate New Code
                  </button>
                </div>

                <span className="pairing-expiry-text">
                  {pairingExpiresAt
                    ? `Code valid for 10 minutes (expires at ${new Date(pairingExpiresAt).toLocaleTimeString()})`
                    : 'Code valid for 10 minutes · Single-use only'}
                </span>
              </div>

              {/* Modal Footer */}
              <div className="pairing-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Close &amp; Refresh Devices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Decommission Confirmation Modal */}
      {deviceToDecommission && (
        <div
          className="pairing-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="decommission-modal-title"
        >
          <div className="pairing-modal-card" style={{ maxWidth: '440px' }}>
            <div className="pairing-modal-header">
              <div>
                <h3 id="decommission-modal-title" className="pairing-modal-title">
                  Decommission Device
                </h3>
                <p className="pairing-modal-subtitle">
                  Safely disconnect hardware from parental supervision.
                </p>
              </div>
              <button
                type="button"
                className="pairing-modal-close-btn"
                onClick={() => setDeviceToDecommission(null)}
                disabled={isDecommissioning}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="pairing-modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                Are you sure you want to decommission <strong>{deviceToDecommission.name}</strong> ({deviceToDecommission.deviceCode || 'Device'})?
              </p>

              <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#fde047', lineHeight: '1.5', marginBottom: '16px' }}>
                This device will be removed from your active devices inventory. Historical study sessions and focus reports remain fully preserved. The student account remains active and paired.
              </div>

              {decommissionError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '13px', marginBottom: '14px' }}>
                  {decommissionError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDeviceToDecommission(null)}
                  disabled={isDecommissioning}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isDecommissioning ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleDecommissionConfirm}
                  disabled={isDecommissioning}
                >
                  {isDecommissioning ? 'Decommissioning…' : 'Yes, Decommission'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ConnectedDevices;
