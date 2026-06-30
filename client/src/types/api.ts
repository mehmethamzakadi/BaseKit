import { AxiosError } from 'axios'

/**
 * Backend `PagedResult<T>` karşılığı. Liste verisini sayfalama meta bilgisiyle
 * birlikte taşır.
 */
export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

/** Sayfalı/aranabilir liste endpoint'leri için ortak query parametreleri. */
export interface PagedQuery {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  desc?: boolean
}

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
