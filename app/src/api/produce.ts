import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';
import type { ProductOut, ImageHistoryOut, AnalyzeResult } from '../types/api';
import { useAuth } from '../context/AuthContext';

/** List active or completed produce */
export function useListProduce(status: 'active' | 'completed' | 'all' = 'active') {
  const { user } = useAuth();
  return useQuery<ProductOut[]>({
    queryKey: ['produce', user?.id, status],
    queryFn: () => client.get('/api/v1/produce', { params: { status } }).then((r) => r.data),
    enabled: !!user,
  });
}

/** Get produce detail */
export function useProduceById(id: number | string) {
  const { user } = useAuth();
  return useQuery<ProductOut>({
    queryKey: ['produce-detail', user?.id, String(id)],
    queryFn: () => client.get(`/api/v1/produce/${id}`).then((r) => r.data),
    enabled: !!user,
  });
}

/** Get produce scan history */
export function useProduceHistory(id: number | string) {
  const { user } = useAuth();
  return useQuery<ImageHistoryOut[]>({
    queryKey: ['produce-history', user?.id, String(id)],
    queryFn: () => client.get(`/api/v1/produce/${id}/history`).then((r) => r.data),
    enabled: !!user,
  });
}

/** Get every recorded scan, including scans for active produce. */
export function useGlobalHistory() {
  const { user } = useAuth();
  return useQuery<ImageHistoryOut[]>({
    queryKey: ['history', user?.id],
    queryFn: () => client.get('/history').then((r) => r.data),
    enabled: !!user,
    staleTime: 0,
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
      qc.invalidateQueries({ queryKey: ['history'] });
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
      qc.invalidateQueries({ queryKey: ['produce'] });
      qc.invalidateQueries({ queryKey: ['produce-detail'] });
      qc.invalidateQueries({ queryKey: ['produce-history'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['history'] });
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
      qc.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
