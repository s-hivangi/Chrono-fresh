import client from './client.js';

export const getMeta = () =>
  client.get('/api/v1/meta').then((r) => r.data);
