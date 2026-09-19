import { useQuery } from '@tanstack/react-query';
import client from './client';
import type { MetaOut } from '../types/api';

export function useMeta() {
  return useQuery<MetaOut>({
    queryKey: ['meta'],
    queryFn: () => client.get('/api/v1/meta').then((response) => response.data),
    staleTime: Infinity,
  });
}
