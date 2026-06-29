import { QueryClient } from '@tanstack/react-query'

/**
 * Uygulama genelinde tek bir QueryClient. Sunucu durumunun önbelleğe alınması,
 * yeniden çekilmesi ve geçersiz kılınması buradan yönetilir.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
