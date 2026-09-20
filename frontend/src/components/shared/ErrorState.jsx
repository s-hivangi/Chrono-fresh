import React from 'react';
import OutlineIcon from './OutlineIcon.jsx';

export default function ErrorState({
  message = 'Network Error',
  onRetry,
  title = 'Network Error',
}) {
  return (
    <div className="network-error-shell">
      <div className="network-error-card">
        <div className="network-error-icon"><OutlineIcon name="warning" size={24} /></div>
        <div className="network-error-text">{title || message}</div>
        {onRetry && (
          <button type="button" className="network-error-button" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
