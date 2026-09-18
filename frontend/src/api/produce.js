import client from './client.js';

/** Fetch a single produce item. */
export const getProduceById = (id) =>
  client.get(`/api/v1/produce/${id}`).then((r) => r.data);

/** List produce. status: 'active' | 'completed' | 'all' */
export const listProduce = (params) =>
  client.get('/api/v1/produce', { params }).then((r) => r.data);

/** Create a new produce item from an image. Expects FormData. */
export const createProduce = (formData) =>
  client.post('/api/v1/produce', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

/** Analyze without saving. Expects FormData with `file` + `produce_type`. */
export const analyzeProduce = (formData) =>
  client.post('/api/v1/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

/** Rescan: upload a new image for an existing produce item. */
export const rescanProduce = (id, formData) =>
  client.post(`/api/v1/produce/${id}/rescan`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

/** Get scan history for a produce item. */
export const getProduceHistory = (id) =>
  client.get(`/api/v1/produce/${id}/history`).then((r) => r.data);

/** Get timeline for a produce item (chart data). */
export const getProduceTimeline = (id) =>
  client.get(`/api/v1/produce/${id}/timeline`).then((r) => r.data);

/** Mark a produce item as consumed or discarded. */
export const completeProduce = (id, outcome) =>
  client.post(`/api/v1/produce/${id}/complete`, { outcome }).then((r) => r.data);

/** Update display name or storage type. */
export const updateProduce = (id, patch) =>
  client.patch(`/api/v1/produce/${id}`, patch).then((r) => r.data);
