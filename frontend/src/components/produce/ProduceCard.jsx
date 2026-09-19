import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/client.js';
import { cap, isUrgent } from '../../utils/helpers.js';
import StageBadge from './StageBadge.jsx';

export default function ProduceCard({ produce, selected = false }) {
  const navigate = useNavigate();

  return (
    <div
      className={`produce-card${selected ? ' selected' : ''}${isUrgent(produce) ? ' urgent-card' : ''}`}
      onClick={() => navigate(`/produce/${produce.product_id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="thumb-area">
        {produce.latest_thumbnail_url ? (
          <img
            src={`${BASE_URL}${produce.latest_thumbnail_url}`}
            alt={produce.display_name}
          />
        ) : (
          <span className="thumb-placeholder">
            {cap(produce.produce_type).slice(0, 2)}
          </span>
        )}
      </div>
      <div className="card-body">
        <div className="card-name">{produce.display_name}</div>
        <div className="card-type">{cap(produce.produce_type)}</div>
        <div className="card-footer-row">
          <StageBadge stage={produce.latest_stage} />
          <span className="days-label">{produce.latest_days_display ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
