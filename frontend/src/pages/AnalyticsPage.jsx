import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getAnalytics } from '../api/analytics.js';
import StatsCard from '../components/shared/StatsCard.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import ErrorState from '../components/shared/ErrorState.jsx';

// Colour map for freshness stages
const STAGE_COLORS = {
  Fresh:       '#22c55e',
  'Early Ripening':'#84cc16',
  'Mid-Ripening':  '#eab308',
  'Late Ripening': '#f97316',
  Spoiled:     '#ef4444',
};
const OUTCOME_COLORS = { consumed: '#22c55e', discarded: '#ef4444' };

export default function AnalyticsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  });

  if (isLoading) return <LoadingSpinner label="Loading analytics…" />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;

  const distributionData = Object.entries(data.freshness_distribution || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const outcomeData = [
    { name: 'Used', value: data.consumed_count },
    { name: 'Discarded', value: data.discarded_count },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatsCard label="Total Scans" value={data.total_scans} />
        <StatsCard label="Active" value={data.active_count} />
        <StatsCard label="Used" value={data.consumed_count} />
        <StatsCard label="Discarded" value={data.discarded_count} warn />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Freshness distribution donut */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Freshness Distribution</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active items</span>
          </div>
          <div className="panel-body">
            {distributionData.length === 0 ? (
              <div className="empty-state">No active produce data yet.</div>
            ) : (
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {distributionData.map((entry) => (
                        <Cell key={entry.name} fill={STAGE_COLORS[entry.name] ?? '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Outcome bar */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Outcomes</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Completed items</span>
          </div>
          <div className="panel-body">
            {data.completed_count === 0 ? (
              <div className="empty-state">No completed produce yet.</div>
            ) : (
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outcomeData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {outcomeData.map((entry) => (
                        <Cell key={entry.name} fill={entry.name === 'Used' ? OUTCOME_COLORS.consumed : OUTCOME_COLORS.discarded} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scans over time */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Scans Over Time</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 14 days</span>
        </div>
        <div className="panel-body">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.scans_over_time} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="count" stroke="var(--s-fresh)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--green-dark)', strokeWidth: 0 }} activeDot={{ r: 6, fill: 'var(--s-late)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
