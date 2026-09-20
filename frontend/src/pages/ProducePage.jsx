import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listProduce } from '../api/produce.js';
import { cap, PRODUCE_TYPES, STAGES } from '../utils/helpers.js';
import ProduceCard from '../components/produce/ProduceCard.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import ErrorState from '../components/shared/ErrorState.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';

export default function ProducePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [sort, setSort] = useState('urgency');

  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['produce', 'active', sort],
    queryFn: () => listProduce({ status: 'active', sort }),
  });

  if (isLoading) return <LoadingSpinner label="Loading produce…" />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;

  const filtered = data.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (p.display_name || '').toLowerCase().includes(q) ||
      p.produce_type.toLowerCase().includes(q);
    const matchType =
      filterType === 'all' || p.produce_type === filterType;
    const matchStage = filterStage === 'all' || p.latest_stage === filterStage;
    return matchSearch && matchType && matchStage;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Your Stash</h1>
        <button className="primary-btn" onClick={() => navigate('/scan')}>
          + Scan New
        </button>
      </div>

      {/* Filters */}
      <div className="panel" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div className="controls-row">
          <input
            className="input-field"
            placeholder="Search by name or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-field"
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
          >
            <option value="all">All Freshness</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
          <select
            className="select-field"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            {PRODUCE_TYPES.map((t) => (
              <option key={t} value={t}>{cap(t)}</option>
            ))}
          </select>
          <select
            className="select-field"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="urgency">Sort: Urgency</option>
            <option value="date">Sort: Date Added</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message={
            search || filterType !== 'all' || filterStage !== 'all'
              ? 'No items match your filters.'
              : 'No active produce. Go scan something!'
          }
          cta={!search && filterType === 'all' && filterStage === 'all' ? 'Scan Now' : undefined}
          onCta={() => navigate('/scan')}
        />
      ) : (
        <div className="panel">
          <div className="produce-grid">
            {filtered.map((p) => (
              <ProduceCard key={p.product_id} produce={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
