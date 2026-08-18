export default function Loading() {
  return (
    <div className="container">
      <nav className="top-nav">
        <div className="nav-brand">LeaveSync</div>
        <div className="nav-actions skeleton-pulse" style={{ width: '150px', height: '24px', borderRadius: '4px' }}></div>
      </nav>

      <div className="dashboard-grid">
        <div className="dashboard-sidebar">
          <div className="glass-panel text-center skeleton-pulse" style={{ height: '200px' }}></div>
          <div className="glass-panel skeleton-pulse" style={{ height: '400px', marginTop: '2rem' }}></div>
        </div>

        <div className="dashboard-main">
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem' }}>Your Requests</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="skeleton-pulse" style={{ height: '100px', borderRadius: '8px' }}></div>
              <div className="skeleton-pulse" style={{ height: '100px', borderRadius: '8px' }}></div>
              <div className="skeleton-pulse" style={{ height: '100px', borderRadius: '8px' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
