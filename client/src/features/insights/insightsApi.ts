import { apiClient } from '@/lib/apiClient'
import type { Briefing, Coords, Markets, News, Weather } from '@/types/insights'

/** Insights (dış entegrasyon) uç noktalarının tiplenmiş sarmalayıcıları. */
export const insightsApi = {
  weather: (coords?: Coords | null) =>
    apiClient
      .get<Weather>('/insights/weather', { params: coords ?? undefined })
      .then((r) => r.data),

  markets: () => apiClient.get<Markets>('/insights/markets').then((r) => r.data),

  news: () => apiClient.get<News>('/insights/news').then((r) => r.data),

  briefing: (coords?: Coords | null) =>
    apiClient
      .get<Briefing>('/insights/ai/briefing', { params: coords ?? undefined })
      .then((r) => r.data),
}
