import client from './client.js';

/** Fetch every recorded scan, including scans for active produce. */
export const getHistory = (search) =>
  client.get('/history', { params: search ? { search } : undefined }).then((r) => r.data);