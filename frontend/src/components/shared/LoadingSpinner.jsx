import React from 'react';

export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span className="loading-label">{label}</span>
    </div>
  );
}
