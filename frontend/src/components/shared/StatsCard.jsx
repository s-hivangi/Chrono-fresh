import React from 'react';

export default function StatsCard({ label, value, accent = false, warn = false }) {
  return (
    <div className={`stat-card${accent ? ' urgent' : ''}${warn ? ' risk' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
    </div>
  );
}
