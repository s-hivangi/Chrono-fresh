import client from './client.js';

/** Combined v1 dashboard: stats + use_first + recent_scans + all_active. */
export const getDashboard = () =>
  client.get('/api/v1/dashboard').then((r) => r.data);
