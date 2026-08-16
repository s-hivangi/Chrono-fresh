import React from 'react';

export default function AlertBanner({ urgentCount, onViewUrgent }) {
  if (urgentCount <= 0) return null;

  return (
    <div className="alert-banner">
      <div>
        <div className="alert-label">Action Required</div>
        <div className="alert-message">
          <strong>{urgentCount} batch{urgentCount > 1 ? "es" : ""}</strong> require immediate cold-chain refrigeration or priority dispatch.
        </div>
      </div>
      <button className="btn-ghost" onClick={onViewUrgent}>
        View Urgent Items
      </button>
    </div>
  );
}
