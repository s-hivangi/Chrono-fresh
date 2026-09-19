import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import type { ProductOut, ImageHistoryOut, AnalyzeResult } from '../types/api';

/** List active or completed produce */
export function useListProduce(status: 'active' | 'completed' | 'all' = 'active') {
  return useQuery<ProductOut[]>({
    queryKey: ['produce', status],
    queryFn: () => client.get('/api/v1/produce', { params: { status } }).then((r) => r.data),
  });
}

/** Get produce detail */
export function useProduceById(id: number | string) {
  return useQuery<ProductOut>({
    queryKey: ['produce', String(id)],
    queryFn: () => client.get(`/api/v1/produce/${id}`).then((r) => r.data),
  });
}

/** Get produce scan history */
export function useProduceHistory(id: number | string) {
  return useQuery<ImageHistoryOut[]>({
    queryKey: ['produce-history', String(id)],
    queryFn: () => client.get(`/api/v1/produce/${id}/history`).then((r) => r.data),
  });
}

/** Get every recorded scan, including scans for active produce. */
export function useGlobalHistory() {
  return useQuery<ImageHistoryOut[]>({
    queryKey: ['history'],
    queryFn: () => client.get('/history').then((r) => r.data),
  });
}

/** Analyze image without saving */
export function useAnalyzeMutation() {
  return useMutation<AnalyzeResult, Error, FormData>({
    mutationFn: (fd) =>
      client
        .post('/api/v1/analyze', fd)
        .then((r) => r.data),
  });
}

/** Create (save) produce */
export function useCreateProduceMutation() {
  const qc = useQueryClient();
  return useMutation<ProductOut, Error, FormData>({
    mutationFn: (fd) =>
      client
        .post('/api/v1/produce', fd)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produce'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Rescan existing produce */
export function useRescanMutation(id: number | string) {
  const qc = useQueryClient();
  return useMutation<ProductOut, Error, FormData>({
    mutationFn: (fd) =>
      client
        .post(`/api/v1/produce/${id}/rescan`, fd)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produce', String(id)] });
      qc.invalidateQueries({ queryKey: ['produce-history', String(id)] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Mark produce as consumed or discarded */
export function useCompleteMutation(id: number | string) {
  const qc = useQueryClient();
  return useMutation<ProductOut, Error, 'consumed' | 'discarded'>({
    mutationFn: (outcome) =>
      client.post(`/api/v1/produce/${id}/complete`, { outcome }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produce'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
