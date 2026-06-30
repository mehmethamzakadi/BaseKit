import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { StatItemDto } from '@/types/dashboard'

const dashboardApi = {
  stats: () => apiClient.get<StatItemDto[]>('/admin/stats').then((r) => r.data),
}

/** Dashboard özet istatistikleri. Yalnızca yetkili kullanıcılar için etkinleştirilir. */
export function useStats(enabled: boolean) {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.stats,
    enabled,
  })
}
