import React from 'react';
import { stageBadgeClass, isUrgent } from '../utils/helpers';

export default function LogisticsTab({ products }) {
  if (products.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Logistics Dispatch — DSS Command View</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sorted by urgency · FIFO priorities from model inference</span>
        </div>
        <div className="empty-state">No produce tracked yet. Upload an image to begin.</div>
      </div>
    );
  }

  const sortedProducts = [...products].sort(
    (a, b) => (a.latest_days_remaining ?? 999) - (b.latest_days_remaining ?? 999)
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Logistics Dispatch — DSS Command View</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sorted by urgency · FIFO priorities from model inference</span>
      </div>
      <table className="ops-table">
        <thead>
          <tr>
            <th>Batch</th>
            <th>Type</th>
            <th>Stage</th>
            <th>Days Left</th>
            <th>Cold Storage</th>
            <th>FIFO Priority</th>
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map(p => {
            const u = isUrgent(p);
            return (
              <tr key={p.product_id}>
                <td><strong>{p.display_name}</strong></td>
                <td style={{ textTransform: "capitalize" }}>{p.produce_type}</td>
                <td><span className={stageBadgeClass(p.latest_stage)}>{p.latest_stage ?? "Pending"}</span></td>
                <td><strong>{p.latest_days_display ?? "—"}</strong></td>
                <td className={u ? "refrig-on" : "refrig-off"}>{u ? "Activate — 4°C" : "Ambient"}</td>
                <td className={u ? "fifo-urgent" : "fifo-normal"}>{u ? "Priority 1 — Immediate" : "Standard Buffer"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
