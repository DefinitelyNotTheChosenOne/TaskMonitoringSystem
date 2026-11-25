import React from 'react';

export default function AppLoadingSkeleton() {
  return (
    <div className="dashboard-stack" role="status" aria-live="polite">
      <span className="visually-hidden">Loading view...</span>

      <div className="dashboard-kpi-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="surface-card surface-card--compact kpi-card">
            <div className="skeleton-bar" style={{ inlineSize: '55%', blockSize: '0.875rem' }} />
            <div className="skeleton-bar" style={{ inlineSize: '40%', blockSize: '1.75rem' }} />
            <div className="skeleton-bar" style={{ inlineSize: '70%', blockSize: '0.75rem' }} />
          </div>
        ))}
      </div>

      <div className="surface-card form-stack" aria-hidden="true">
        <div className="skeleton-bar" style={{ inlineSize: '32%', blockSize: '1.25rem' }} />
        <div className="skeleton-bar" style={{ inlineSize: '100%', blockSize: '3rem' }} />
        <div className="skeleton-bar" style={{ inlineSize: '100%', blockSize: '3rem' }} />
        <div className="skeleton-bar" style={{ inlineSize: '85%', blockSize: '3rem' }} />
      </div>
    </div>
  );
}
