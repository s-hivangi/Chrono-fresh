import React from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { API_BASE, STAGES, cap, stageBadgeClass, stageStepClass } from '../utils/helpers';

export default function AnalyticsTab({ selected, timeline, productHistory }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-title">{selected?.display_name ?? "Shelf-Life Timeline"}</span>
          {selected && (
            <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>
              {cap(selected.produce_type)} &middot; Added {new Date(selected.date_added).toLocaleDateString()}
            </div>
          )}
        </div>
        {selected && (
          <span className={stageBadgeClass(selected.latest_stage)}>
            {selected.latest_stage ?? "Pending"}
          </span>
        )}
      </div>

      <div className="panel-body">
        <div className="stage-track">
          {STAGES.map(s => (
            <div key={s} className={stageStepClass(s, timeline.some(pt => pt.freshness_stage === s))}>
              {s}
            </div>
          ))}
        </div>

        {timeline.length === 0 ? (
          <div className="empty-state">
            No timeline data yet. Upload images for this batch to start tracking degradation.
          </div>
        ) : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="capture_date"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  tickFormatter={v => new Date(v).toLocaleDateString()}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  label={{
                    value: "Days Remaining",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "var(--text-muted)" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                  labelFormatter={v => new Date(v).toLocaleString()}
                />
                <Line
                  type="monotone"
                  dataKey="days_remaining"
                  stroke="var(--s-fresh)"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "var(--green-dark)", strokeWidth: 0 }}
                  activeDot={{ r: 7, fill: "var(--s-late)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {productHistory.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                marginBottom: 12,
              }}
            >
              Capture Audit Trail
            </div>
            <div className="audit-row">
              {productHistory.map(item => (
                <div key={item.image_id} className="audit-item">
                  <img src={`${API_BASE}${item.thumbnail_url ?? item.image_url}`} alt="capture" />
                  <span className="audit-time">
                    {new Date(item.capture_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {item.prediction && (
                    <span className={stageBadgeClass(item.prediction.freshness_stage)} style={{ fontSize: 10 }}>
                      {item.prediction.freshness_stage}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
