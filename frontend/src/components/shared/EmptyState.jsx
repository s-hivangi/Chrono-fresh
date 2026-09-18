import React from 'react';

export default function EmptyState({ message = 'Nothing here yet.', cta, onCta }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">🌿</div>
      <p>{message}</p>
      {cta && (
        <button className="primary-btn" onClick={onCta} style={{ marginTop: 12 }}>
          {cta}
        </button>
      )}
    </div>
  );
}
