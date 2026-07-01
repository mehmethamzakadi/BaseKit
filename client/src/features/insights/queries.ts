import { useQuery } from '@tanstack/react-query'
import { insightsApi } from './insightsApi'
import type { Coords } from '@/types/insights'

/**
 * Dış veri sorguları. Backend zaten Redis'te cache'lediğinden client tarafında
 * makul staleTime + arka plan yenileme ile gereksiz istek önlenir. Konum
 * (coords) çözülene kadar konum bağımlı sorgular bekletilmez; coords null ise
 * backend varsayılan konumu kullanır.
 */

export function useWeather(coords: Coords | null) {
  return useQuery({
    queryKey: ['insights', 'weather', coords],
    queryFn: () => insightsApi.weather(coords),
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
  })
}

export function useMarkets() {
  return useQuery({
    queryKey: ['insights', 'markets'],
    queryFn: insightsApi.markets,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}

export function useNews() {
  return useQuery({
    queryKey: ['insights', 'news'],
    queryFn: insightsApi.news,
    staleTime: 15 * 60_000,
    refetchInterval: 15 * 60_000,
  })
}

export function useBriefing(coords: Coords | null) {
  return useQuery({
    queryKey: ['insights', 'briefing', coords],
    queryFn: () => insightsApi.briefing(coords),
    staleTime: 60 * 60_000,
    // AI çağrısı maliyetli; otomatik yenileme yok, saatlik cache backend'de.
    refetchOnWindowFocus: false,
    retry: false,
  })
}
