/**
 * Uygulama yapılandırması. Tüm ortam değişkenleri tek noktadan okunur.
 * `.env` (veya `.env.local`) içinde `VITE_API_URL` ile API adresi yönetilir.
 */
export const env = {
  /** BaseKit API kök adresi. Örn: http://localhost:5179 */
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:5179',
} as const
