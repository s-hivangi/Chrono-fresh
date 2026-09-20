import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/dashboard.js';
import { BASE_URL } from '../api/client.js';
import ProduceCard from '../components/produce/ProduceCard.jsx';
import StatsCard from '../components/shared/StatsCard.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import ErrorState from '../components/shared/ErrorState.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';
import OutlineIcon from '../components/shared/OutlineIcon.jsx';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingSpinner label="Loading dashboard…" />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;

  const { stats, use_first = [], recent_scans = [], all_active = [] } = data;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <button className="primary-btn" onClick={() => navigate('/scan')}>
          + Scan Produce
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <StatsCard label="Active Batches" value={stats.active_count} />
        <StatsCard label="Use Soon" value={stats.use_soon_count} accent />
        <StatsCard label="Fresh" value={stats.fresh_count} />
        <StatsCard label="Spoiled" value={stats.spoiled_count} warn />
      </div>

      {/* Use First section */}
      {use_first.length > 0 && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-header">
            <span className="panel-title"><OutlineIcon name="warning" size={16} /> Use First</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Sorted by urgency
            </span>
          </div>
          <div className="produce-grid">
            {use_first.map((p) => (
              <ProduceCard key={p.product_id} produce={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recent scans */}
      {recent_scans.length > 0 && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-header">
            <span className="panel-title">Recent Scans</span>
          </div>
          <div className="audit-row">
            {recent_scans.map((img) => (
              <div
                key={img.image_id}
                className="audit-item"
                onClick={() => navigate(`/produce/${img.product_id}`)}
                style={{ cursor: 'pointer' }}
              >
                {img.thumbnail_url && (
                  <img src={`${BASE_URL}${img.thumbnail_url}`} alt="scan" />
                )}
                <span className="audit-time">
                  {new Date(img.capture_date).toLocaleDateString()}
                </span>
                {img.prediction && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {img.prediction.freshness_stage}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All active produce grid */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">All Active Produce</span>
          <button
            className="seg-btn active"
            onClick={() => navigate('/produce')}
          >
            View All →
          </button>
        </div>
        {all_active.length === 0 ? (
          <EmptyState
            message="No active produce. Scan something to get started."
            cta="Scan Now"
            onCta={() => navigate('/scan')}
          />
        ) : (
          <div className="produce-grid">
            {all_active.slice(0, 8).map((p) => (
              <ProduceCard key={p.product_id} produce={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
