import React, { useState, useRef } from 'react';
import { PRODUCE_TYPES, cap, stageBadgeClass, headerBgClass, isUrgent } from '../utils/helpers';
import { uploadBatchImages } from '../api';

export default function UploadTab({ products, selected, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [batchMode, setBatch] = useState("same_fruit");
  const [linkMode, setLink] = useState("new");
  const [produce, setProduce] = useState("guava");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDrag] = useState(false);
  const inputRef = useRef();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!files.length) {
      setError("Select at least one image to proceed.");
      return;
    }

    setLoading(true);
    try {
      const payload = await uploadBatchImages({
        files,
        batchMode,
        linkMode,
        selected,
        produce,
      });

      setResult(payload);
      setFiles([]);
      await onUploaded(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const pred = result?.[0]?.prediction;
  const prod = result?.[0]?.product;

  return (
    <div className="upload-wrap">
      {/* Form column */}
      <div className="panel" style={{ padding: 22 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18, color: "var(--text-primary)" }}>
          Scan &amp; Predict
        </div>
        <form onSubmit={handleSubmit}>
          <div
            className={`dropzone${dragging ? " drag-over" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => {
              e.preventDefault();
              setDrag(false);
              setFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")));
            }}
          >
            <div className="dropzone-icon">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <path d="M10 13V3m0 0L6 7m4-4l4 4" /><path d="M3 17h14" />
              </svg>
            </div>
            <div className="dropzone-title">Drop images or click to browse</div>
            <div className="dropzone-sub">JPEG, PNG, WEBP, HEIC — auto-compressed to 1080p</div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              style={{ display: "none" }}
              onChange={e => setFiles(Array.from(e.target.files ?? []))}
            />
          </div>

          {files.length > 0 && (
            <div className="preview-row">
              {files.map((f, i) => <img key={i} className="preview-thumb" src={URL.createObjectURL(f)} alt="" />)}
            </div>
          )}

          {files.length > 1 && (
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Batch Mode</label>
              <div className="segmented-ctrl">
                <button
                  type="button"
                  className={`seg-btn${batchMode === "same_fruit" ? " active" : ""}`}
                  onClick={() => setBatch("same_fruit")}
                >
                  Same Item — Multi-Angle
                </button>
                <button
                  type="button"
                  className={`seg-btn${batchMode === "different_fruits" ? " active" : ""}`}
                  onClick={() => setBatch("different_fruits")}
                >
                  Multiple Items
                </button>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Link Mode</label>
            <div className="segmented-ctrl">
              <button
                type="button"
                className={`seg-btn${linkMode === "new" ? " active" : ""}`}
                onClick={() => setLink("new")}
              >
                New Batch
              </button>
              {products.length > 0 && (
                <button
                  type="button"
                  className={`seg-btn${linkMode === "existing" ? " active" : ""}`}
                  onClick={() => setLink("existing")}
                >
                  Append to Selected
                </button>
              )}
            </div>
          </div>

          {linkMode === "new" && (
            <div className="form-group">
              <label className="form-label">Produce Type</label>
              <select
                className="select-field"
                style={{ width: "100%" }}
                value={produce}
                onChange={e => setProduce(e.target.value)}
              >
                {PRODUCE_TYPES.map(t => <option key={t} value={t}>{cap(t)}</option>)}
              </select>
            </div>
          )}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Running inference..." : "Run Quality Prediction"}
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}
      </div>

      {/* Result column */}
      <div>
        {!pred ? (
          <div className="panel">
            <div className="empty-state">Upload a produce image to see the AI quality assessment and DSS logistics recommendation.</div>
          </div>
        ) : (
          <div className="result-card">
            <div className={`result-header ${headerBgClass(pred.freshness_stage)}`}>
              <div>
                <div className="result-stage-label">Prediction Result — {prod?.display_name}</div>
                <div className="result-stage">{pred.freshness_stage}</div>
              </div>
              <span className={stageBadgeClass(pred.freshness_stage)}>{pred.freshness_stage}</span>
            </div>
            <div className="result-body">
              <div className="result-row">
                <div>
                  <div className="result-item-label">Remaining Shelf Life</div>
                  <div className="result-item-value">{pred.days_remaining_display}</div>
                  <div className="result-item-sub">{pred.days_remaining.toFixed(1)} days continuous estimate</div>
                </div>
                <div>
                  <div className="result-item-label">Model Confidence</div>
                  <div className="result-item-value">{Math.round(pred.confidence * 100)}%</div>
                  <div className="result-item-sub">Dual-backbone extraction</div>
                </div>
              </div>
              <div className={`dss-box${isUrgent({ latest_stage: pred.freshness_stage, latest_days_remaining: pred.days_remaining }) ? " late" : ""}`}>
                <div className="dss-label">DSS Logistics Directive</div>
                <div className="dss-text">{pred.advice}</div>
                <div className="fifo-chip">{pred.fifo_priority}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
