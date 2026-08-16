import React from 'react';

export default function StatsRow({ stats }) {
  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-label">Total Batches Tracked</div>
        <div className="stat-value">{stats.total_products ?? 0}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Pristine Fresh</div>
        <div className="stat-value">{stats.fresh_count ?? 0}</div>
      </div>
      <div className="stat-card urgent">
        <div className="stat-label">Urgent — Dispatch Now</div>
        <div className="stat-value">{stats.high_risk_count ?? 0}</div>
      </div>
      <div className="stat-card risk">
        <div className="stat-label">Avg Days Remaining</div>
        <div className="stat-value">{stats.avg_days_remaining ?? 0}</div>
      </div>
    </div>
  );
}
