import React from 'react';
import { API_BASE, PRODUCE_TYPES, STAGES, cap, stageBadgeClass, isUrgent } from '../utils/helpers';

export default function Dashboard({
  filteredProducts,
  selectedId,
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onSelectProduct,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Produce Quality Inventory</span>
        <div className="controls-row">
          <input
            className="input-field"
            placeholder="Search by name or type..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
          <select className="select-field" value={filter} onChange={e => onFilterChange(e.target.value)}>
            <option value="all">All Produce</option>
            <option value="urgent">Urgent Only</option>
            {PRODUCE_TYPES.map(t => <option key={t} value={t}>{cap(t)}</option>)}
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">No items match your current filter.</div>
      ) : (
        <div className="produce-grid">
          {filteredProducts.map(p => (
            <div
              key={p.product_id}
              className={`produce-card${selectedId === p.product_id ? " selected" : ""}${isUrgent(p) ? " urgent-card" : ""}`}
              onClick={() => onSelectProduct(p.product_id)}
            >
              <div className="thumb-area">
                {p.latest_thumbnail_url ? (
                  <img src={`${API_BASE}${p.latest_thumbnail_url}`} alt={p.display_name} />
                ) : (
                  <span className="thumb-placeholder">{cap(p.produce_type).slice(0, 2)}</span>
                )}
              </div>
              <div className="card-body">
                <div className="card-name">{p.display_name}</div>
                <div className="card-type">{cap(p.produce_type)}</div>
                <div className="card-footer-row">
                  <span className={stageBadgeClass(p.latest_stage)}>{p.latest_stage ?? "Pending"}</span>
                  <span className="days-label">{p.latest_days_display ?? "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
