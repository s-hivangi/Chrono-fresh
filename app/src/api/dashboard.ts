import { useQuery } from '@tanstack/react-query';
import client from './client';
import type { DashboardV1Out } from '../types/api';

export function useDashboard() {
  return useQuery<DashboardV1Out>({
    queryKey: ['dashboard'],
    queryFn: () => client.get('/api/v1/dashboard').then((r) => r.data),
    refetchInterval: 60_000,
  });
}
