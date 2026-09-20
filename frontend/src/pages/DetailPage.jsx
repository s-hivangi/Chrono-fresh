import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  getProduceById, getProduceHistory, getProduceTimeline,
  rescanProduce, completeProduce,
} from '../api/produce.js';
import { BASE_URL } from '../api/client.js';
import { cap, compressImage, stageBadgeClass, stageStepClass, STAGES } from '../utils/helpers.js';
import StageBadge from '../components/produce/StageBadge.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import ErrorState from '../components/shared/ErrorState.jsx';
import OutlineIcon from '../components/shared/OutlineIcon.jsx';

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rescanInputRef = useRef();
  const [rescanError, setRescanError] = useState('');
  const [completeError, setCompleteError] = useState('');

  const { data: produce, isLoading, isError, error } = useQuery({
    queryKey: ['produce', id],
    queryFn: () => getProduceById(id),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['produce-history', id],
    queryFn: () => getProduceHistory(id),
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ['produce-timeline', id],
    queryFn: () => getProduceTimeline(id),
  });

  const rescanMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('file', await compressImage(file));
      return rescanProduce(id, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produce', id] });
      queryClient.invalidateQueries({ queryKey: ['produce-history', id] });
      queryClient.invalidateQueries({ queryKey: ['produce-timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setRescanError('');
    },
    onError: (err) => setRescanError(err.message),
  });

  const completeMutation = useMutation({
    mutationFn: (outcome) => completeProduce(id, outcome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produce'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/history');
    },
    onError: (err) => setCompleteError(err.message),
  });

  if (isLoading) return <LoadingSpinner label="Loading…" />;
  if (isError) return <ErrorState message={error.message} onRetry={() => navigate(-1)} />;

  const latestHistory = history[0];
  const isCompleted = produce.status === 'completed';

  return (
    <div className="page">
      <div className="page-header">
        <button
          className="seg-btn"
          onClick={() => navigate(-1)}
          style={{ marginRight: 12 }}
        >
          ← Back
        </button>
        <h1 className="page-title">{produce.display_name}</h1>
        <StageBadge stage={produce.latest_stage} />
      </div>

      {/* Detail summary */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-body">
          <div className="result-row" style={{ alignItems: 'flex-start', gap: 24 }}>
            {/* Thumbnail */}
            <div style={{ flexShrink: 0 }}>
              {produce.latest_thumbnail_url ? (
                <img
                  src={`${BASE_URL}${produce.latest_thumbnail_url}`}
                  alt={produce.display_name}
                  style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                />
              ) : (
                <div style={{ width: 120, height: 120, borderRadius: 10, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                  <OutlineIcon name="produce" size={42} />
                </div>
              )}
            </div>

            {/* Key metrics */}
            <div style={{ flex: 1 }}>
              <div className="result-row">
                <div>
                  <div className="result-item-label">Produce Type</div>
                  <div className="result-item-value" style={{ fontSize: 16 }}>{cap(produce.produce_type)}</div>
                </div>
                <div>
                  <div className="result-item-label">Shelf Life Remaining</div>
                  <div className="result-item-value">
                    {produce.latest_days_remaining != null ? `${produce.latest_days_remaining.toFixed(1)} days` : '—'}
                  </div>
                </div>
                <div>
                  <div className="result-item-label">Storage</div>
                  <div className="result-item-value" style={{ fontSize: 16 }}>{cap(produce.storage_type ?? 'room')}</div>
                </div>
                <div>
                  <div className="result-item-label">Status</div>
                  <div>
                    <span className={`badge ${isCompleted ? 'badge-spoiled' : 'badge-fresh'}`}>
                      {isCompleted ? `${cap(produce.outcome ?? 'Completed')}` : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Latest advice */}
              {latestHistory?.prediction && (
                <div className={`dss-box${produce.latest_days_remaining != null && produce.latest_days_remaining <= 1.5 ? ' late' : ''}`} style={{ marginTop: 14 }}>
                  <div className="dss-label">Recommendation</div>
                  <div className="dss-text">{latestHistory.prediction.advice}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stage track */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <span className="panel-title">Freshness Stage Timeline</span>
        </div>
        <div className="panel-body">
          <div className="stage-track">
            {STAGES.map((s) => (
              <div key={s} className={stageStepClass(s, timeline.some((pt) => pt.freshness_stage === s))}>
                {s}
              </div>
            ))}
          </div>

          {timeline.length > 0 && (
            <div className="chart-wrap" style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="capture_date"
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString()}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    label={{ value: 'Days Left', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--text-muted)' } }}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)' }}
                    labelFormatter={(v) => new Date(v).toLocaleString()}
                  />
                  <Line type="monotone" dataKey="days_remaining" stroke="var(--green-mid)" strokeWidth={2.5} dot={{ r: 5, fill: 'var(--green-deep)', strokeWidth: 0 }} activeDot={{ r: 7, fill: 'var(--rose-mid)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Scan history thumbnails */}
      {history.length > 0 && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-header">
            <span className="panel-title">Scan History</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{history.length} scan{history.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="audit-row">
            {history.map((img) => (
              <div key={img.image_id} className="audit-item">
                {img.thumbnail_url && (
                  <img src={`${BASE_URL}${img.thumbnail_url}`} alt="scan" />
                )}
                <span className="audit-time">
                  {new Date(img.capture_date).toLocaleDateString()}
                </span>
                {img.prediction && (
                  <span className={stageBadgeClass(img.prediction.freshness_stage)} style={{ fontSize: 10 }}>
                    {img.prediction.freshness_stage}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions — only for active produce */}
      {!isCompleted && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Actions</span>
          </div>
          <div className="panel-body">
            {/* Rescan */}
            <div style={{ marginBottom: 20 }}>
              <div className="form-label" style={{ marginBottom: 8 }}>Rescan — upload a new image</div>
              <button
                className="seg-btn"
                onClick={() => rescanInputRef.current?.click()}
                disabled={rescanMutation.isPending}
              >
                {rescanMutation.isPending ? 'Scanning…' : <><OutlineIcon name="camera" size={16} /> Upload Rescan Image</>}
              </button>
              <input
                ref={rescanInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) rescanMutation.mutate(f);
                }}
              />
              {rescanMutation.isSuccess && (
                <span style={{ marginLeft: 12, color: 'var(--green-mid)', fontSize: 13 }}>✓ Rescan saved</span>
              )}
              {rescanError && <div className="error-msg">{rescanError}</div>}
            </div>

            {/* Complete actions */}
            <div>
              <div className="form-label" style={{ marginBottom: 8 }}>Mark as completed</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="primary-btn"
                  onClick={() => completeMutation.mutate('consumed')}
                  disabled={completeMutation.isPending}
                  style={{ flex: 1 }}
                >
                  <><OutlineIcon name="check" size={16} /> Mark Used / Consumed</>
                </button>
                <button
                  className="seg-btn"
                  onClick={() => completeMutation.mutate('discarded')}
                  disabled={completeMutation.isPending}
                  style={{ flex: 1, color: 'var(--rose-mid)' }}
                >
                  <><OutlineIcon name="trash" size={16} /> Mark Discarded</>
                </button>
              </div>
              {completeError && <div className="error-msg">{completeError}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
