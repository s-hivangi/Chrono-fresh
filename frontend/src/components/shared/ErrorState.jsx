import React from 'react';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="empty-state" style={{ color: 'var(--rose-mid)' }}>
      <div className="empty-icon">⚠️</div>
      <p>{message}</p>
      {onRetry && (
        <button className="primary-btn" onClick={onRetry} style={{ marginTop: 12 }}>
          Retry
        </button>
      )}
    </div>
  );
}
