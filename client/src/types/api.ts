import { AxiosError } from 'axios'

/**
 * FastEndpoints varsayılan hata yanıtı. Doğrulama hataları `errors` sözlüğünde
 * alan adına göre gruplanır; genel hatalar da burada toplanır.
 */
export interface ApiErrorResponse {
  statusCode?: number
  message?: string
  errors?: Record<string, string[]>
}

/**
 * Bir hatadan kullanıcıya gösterilebilecek anlamlı bir mesaj çıkarır.
 * Axios/FastEndpoints hata gövdesini güvenli şekilde ayrıştırır.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Beklenmeyen bir hata oluştu.',
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined
    if (data?.errors) {
      const messages = Object.values(data.errors).flat().filter(Boolean)
      if (messages.length > 0) return messages.join(' ')
    }
    if (data?.message) return data.message
    if (error.code === 'ERR_NETWORK') return 'Sunucuya ulaşılamıyor.'
    if (error.message) return error.message
  }
  return fallback
}
