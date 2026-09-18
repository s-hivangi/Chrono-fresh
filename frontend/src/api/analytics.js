import client from './client.js';

export const getAnalytics = () =>
  client.get('/api/v1/analytics').then((r) => r.data);
