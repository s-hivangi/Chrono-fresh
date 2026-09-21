import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getHistory } from '../api/history.js';
import { BASE_URL } from '../api/client.js';
import StageBadge from '../components/produce/StageBadge.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import ErrorState from '../components/shared/ErrorState.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';
import OutlineIcon from '../components/shared/OutlineIcon.jsx';

export default function HistoryPage() {
  const navigate = useNavigate();

  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['history'],
    queryFn: () => getHistory(),
  });

  if (isLoading) return <LoadingSpinner label="Loading history…" />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Scan History</h1>
      </div>

      {data.length === 0 ? (
        <EmptyState message="No scans yet. Analyze a produce image to start your history." />
      ) : (
        <div className="panel">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Type</th>
                <th>Quality Stage</th>
                <th>Captured</th>
              </tr>
            </thead>
            <tbody>
              {data.map((scan) => (
                <tr
                  key={scan.image_id}
                  onClick={() => navigate(`/produce/${scan.product_id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    {scan.thumbnail_url ? (
                      <img
                        src={`${BASE_URL}${scan.thumbnail_url}`}
                        alt=""
                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        <OutlineIcon name="produce" size={20} />
                      </div>
                    )}
                  </td>
                  <td><strong>{scan.display_name || `Produce #${scan.product_id}`}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{scan.produce_type || '—'}</td>
                  <td><StageBadge stage={scan.prediction?.freshness_stage} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {scan.capture_date ? new Date(scan.capture_date).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
