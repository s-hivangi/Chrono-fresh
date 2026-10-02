import { useQuery } from '@tanstack/react-query';
import client from './client';
import type { DashboardV1Out } from '../types/api';
import { useAuth } from '../context/AuthContext';

const EMPTY_DASHBOARD: DashboardV1Out = {
  stats: { active_count: 0, use_soon_count: 0, fresh_count: 0, spoiled_count: 0 },
  use_first: [], recent_scans: [], all_active: [], recheck_due: [],
};

export function useDashboard() {
  const { user } = useAuth();
  return useQuery<DashboardV1Out>({
    queryKey: ['dashboard', user?.id],
    queryFn: () => client.get('/api/v1/dashboard').then((r) => r.data),
    enabled: !!user,
    placeholderData: !user ? EMPTY_DASHBOARD : undefined,
    refetchInterval: user ? 60_000 : false,
  });
}
