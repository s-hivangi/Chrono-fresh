import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { analyzeProduce, createProduce } from '../api/produce.js';
import { getMeta } from '../api/meta.js';
import { cap, compressImage } from '../utils/helpers.js';
import StageBadge from '../components/produce/StageBadge.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';

// Freshness stage → CSS class for the result header
const stageHeaderClass = (stage) => {
  if (!stage) return '';
  const s = stage.toLowerCase();
  if (s.includes('early')) return 'stage-early';
  if (s.includes('mid')) return 'stage-mid';
  if (s.includes('late')) return 'stage-late';
  if (s.includes('spoil')) return 'stage-spoiled';
  return '';
};

export default function ScanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef();

  const [files, setFiles] = useState([]);
  const [produce, setProduce] = useState('tomato');
  const [dragging, setDrag] = useState(false);
  const [result, setResult] = useState(null);   // AnalyzeResult from /api/v1/analyze
  const [saveError, setSaveError] = useState('');

  const { data: meta } = useQuery({
    queryKey: ['meta'],
    queryFn: getMeta,
    staleTime: Infinity,
  });
  const produceTypes = meta?.produce_types ?? ['tomato', 'banana', 'guava', 'apple', 'mango'];

  // Step 1: Analyze (no save)
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('file', await compressImage(files[0]));
      fd.append('produce_type', produce);
      return analyzeProduce(fd);
    },
    onSuccess: (data) => setResult(data),
  });

  // Step 2: Save
  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('file', await compressImage(files[0]));
      fd.append('produce_type', produce);
      fd.append('analysis_token', result.analysis_token);
      return createProduce(fd);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['produce'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/produce/${saved.product_id}`);
    },
    onError: (err) => setSaveError(err.message),
  });

  function handleFileChange(newFiles) {
    const images = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    if (images.length) {
      setFiles([images[0]]); // only first image used for analyze+save
      setResult(null);
      setSaveError('');
    }
  }

  const isAnalyzing = analyzeMutation.isPending;
  const isSaving = saveMutation.isPending;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Scan Produce</h1>
      </div>

      <div className="upload-wrap">
        {/* Left: form */}
        <div className="panel" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18, color: 'var(--text-primary)' }}>
            Analyze Quality
          </div>

          {/* Dropzone */}
          <div
            className={`dropzone${dragging ? ' drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFileChange(e.dataTransfer.files);
            }}
          >
            <div className="dropzone-icon">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <path d="M10 13V3m0 0L6 7m4-4l4 4" /><path d="M3 17h14" />
              </svg>
            </div>
            <div className="dropzone-title">
              {files.length ? files[0].name : 'Drop image or click to browse'}
            </div>
            <div className="dropzone-sub">JPEG, PNG, WEBP, HEIC — auto-compressed to 1080p</div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.heic,.heif"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e.target.files ?? [])}
            />
          </div>

          {/* Preview */}
          {files.length > 0 && (
            <div className="preview-row">
              <img className="preview-thumb" src={URL.createObjectURL(files[0])} alt="preview" />
            </div>
          )}

          {/* Produce type */}
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Produce Type</label>
            <select
              className="select-field"
              style={{ width: '100%' }}
              value={produce}
              onChange={(e) => { setProduce(e.target.value); setResult(null); }}
            >
              {produceTypes.map((t) => (
                <option key={t} value={t}>{cap(t)}</option>
              ))}
            </select>
          </div>

          {/* Analyze button */}
          <button
            className="primary-btn"
            onClick={() => analyzeMutation.mutate()}
            disabled={!files.length || isAnalyzing || isSaving}
          >
            {isAnalyzing ? 'Analyzing…' : 'Analyze Quality'}
          </button>

          {analyzeMutation.isError && (
            <div className="error-msg">{analyzeMutation.error.message}</div>
          )}
        </div>

        {/* Right: result */}
        <div>
          {!result ? (
            <div className="panel">
              <div className="empty-state">
                Upload a produce image to see the AI quality assessment.
              </div>
            </div>
          ) : (
            <div className="result-card">
              <div className={`result-header ${stageHeaderClass(result.freshness_stage)}`}>
                <div>
                  <div className="result-stage-label">Quality Assessment — {cap(result.produce_type)}</div>
                  <div className="result-stage">{result.freshness_stage}</div>
                </div>
                <StageBadge stage={result.freshness_stage} />
              </div>
              <div className="result-body">
                <div className="result-row">
                  <div>
                    <div className="result-item-label">Shelf Life Remaining</div>
                    <div className="result-item-value">{result.days_remaining_display}</div>
                    <div className="result-item-sub">{result.days_remaining.toFixed(1)} days estimate</div>
                  </div>
                  <div>
                    <div className="result-item-label">AI Confidence</div>
                    <div className="result-item-value">{Math.round(result.confidence * 100)}%</div>
                    <div className="result-item-sub">Visual freshness model</div>
                  </div>
                </div>
                <div className={`dss-box${result.refrigeration_trigger ? ' late' : ''}`}>
                  <div className="dss-label">Recommendation</div>
                  <div className="dss-text">{result.advice}</div>
                </div>

                {/* Save action */}
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button
                    className="primary-btn"
                    onClick={() => saveMutation.mutate()}
                    disabled={isSaving}
                    style={{ flex: 1 }}
                  >
                    {isSaving ? 'Saving…' : 'Add to My Produce'}
                  </button>
                  <button
                    className="seg-btn"
                    onClick={() => { setResult(null); setFiles([]); setSaveError(''); }}
                    style={{ flex: 1 }}
                  >
                    Scan Again
                  </button>
                </div>
                {saveError && <div className="error-msg">{saveError}</div>}

                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
                  ⚠ This is an AI estimate from visual appearance and does not replace normal food-safety checks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
