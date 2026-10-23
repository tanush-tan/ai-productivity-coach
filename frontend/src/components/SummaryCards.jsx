import './SummaryCards.css';

/**
 * SummaryCards Component
 *
 * Displays three responsive summary metric cards on the Parent Dashboard:
 *   1. Connected Devices — Total paired devices and current online breakdown
 *   2. Active Sessions — Currently ongoing supervised study sessions
 *   3. Total Sessions — Historical session count and supervised hours
 *
 * Props:
 *   cardsData — optional array of metric objects. Defaults to fictional demo data.
 *
 * Beginner note: Keeping default data inside the component makes it easy to render
 * immediately without requiring a backend or parent state, while still allowing
 * future stages to pass dynamic data via props.
 */
function SummaryCards({ cardsData, onViewDevices }) {
  // Fictional demo dataset
  const defaultMetrics = [
    {
      id: 'connected-devices',
      title: 'Connected Devices',
      value: '3',
      unit: 'devices paired',
      badge: '2 Online · 1 Offline',
      badgeType: 'badge-primary',
      iconType: 'icon-devices',
      detail: 'Liam’s Laptop, Study PC, Tablet',
      icon: (
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
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      id: 'active-sessions',
      title: 'Active Sessions',
      value: '1',
      unit: 'in progress',
      badge: 'Focus Block Active',
      badgeType: 'badge-active',
      iconType: 'icon-active',
      isLive: true,
      detail: 'Liam’s Laptop · 42m elapsed',
      icon: (
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
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: 'total-sessions',
      title: 'Total Sessions',
      value: '24',
      unit: 'this month',
      badge: '38.5 hrs tracked',
      badgeType: 'badge-neutral',
      iconType: 'icon-total',
      detail: '+6 sessions vs last week',
      icon: (
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
          <path d="M12 20v-6M6 20V10M18 20V4" />
        </svg>
      ),
    },
  ];

  const cards = cardsData || defaultMetrics;

  return (
    <section className="summary-cards-section" aria-label="Dashboard Overview Metrics">
      {/* Header with section label and demo indicator */}
      <div className="summary-cards-header">
        <h2 className="summary-cards-title">Overview Metrics</h2>
        <span className="summary-demo-pill" title="These metrics use fictional demonstration data">
          <span className="summary-demo-dot" aria-hidden="true" />
          Fictional Demo Data
        </span>
      </div>

      {/* Grid containing the 3 summary cards */}
      <div className="summary-cards-grid">
        {cards.map((card) => (
          <article
            key={card.id}
            className="summary-card"
            aria-label={`${card.title}: ${card.value} ${card.unit}`}
          >
            {/* Top row: Icon and status badge */}
            <div className="summary-card-top">
              <div className={`summary-card-icon ${card.iconType}`}>
                {card.icon}
              </div>
              <span className={`summary-card-badge ${card.badgeType}`}>
                {card.isLive && <span className="summary-pulse-dot" aria-hidden="true" />}
                {card.badge}
              </span>
            </div>

            {/* Middle body: Label and large numeric value */}
            <div className="summary-card-body">
              <h3 className="summary-card-label">{card.title}</h3>
              <div className="summary-card-value-wrap">
                <span className="summary-card-value">{card.value}</span>
                <span className="summary-card-unit">{card.unit}</span>
              </div>
            </div>

            {/* Bottom footer: Contextual detail */}
            <div className="summary-card-footer">
              <span className="summary-card-detail" title={card.detail}>
                {card.detail}
              </span>
              {card.id === 'connected-devices' && onViewDevices && (
                <button
                  type="button"
                  onClick={onViewDevices}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Manage &rarr;
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SummaryCards;
