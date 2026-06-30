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
 * API hata yanıtı. İki biçimi de destekler:
 * - RFC7807 ProblemDetails (FastEndpoints): `title`/`detail` + `errors` dizisi ({ name, reason }).
 * - Eski FastEndpoints ErrorResponse: `message` + `errors` sözlüğü (alan → mesajlar).
 */
export interface ApiErrorResponse {
  statusCode?: number
  status?: number
  title?: string
  detail?: string
  message?: string
  errors?: Record<string, string[]> | { name?: string; reason?: string }[]
}

/** Doğrulama hatalarından (her iki biçim) okunabilir mesaj listesi çıkarır. */
function extractFieldErrors(errors: ApiErrorResponse['errors']): string[] {
  if (!errors) return []
  // RFC7807: [{ name, reason }]
  if (Array.isArray(errors)) {
    return errors.map((e) => e?.reason).filter((m): m is string => Boolean(m))
  }
  // Eski biçim: { field: [msg, ...] }
  return Object.values(errors).flat().filter(Boolean)
}

/**
 * Sunucu doğrulama hatalarını alan adı → mesaj sözlüğüne dönüştürür. Formik
 * `setErrors` ile alanlara bağlamak için kullanılır. Alan adları sunucu
 * (camelCase) ile form alanlarıyla eşleşir (ör. "email", "password").
 */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {}
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined
    if (Array.isArray(data?.errors)) {
      for (const e of data.errors) {
        if (e?.name && e?.reason && !result[e.name]) result[e.name] = e.reason
      }
    } else if (data?.errors) {
      for (const [field, msgs] of Object.entries(data.errors)) {
        if (msgs?.[0]) result[field] = msgs[0]
      }
    }
  }
  return result
}

/**
 * Bir hatadan kullanıcıya gösterilebilecek anlamlı bir mesaj çıkarır.
 * Axios/FastEndpoints (ProblemDetails veya eski) hata gövdesini güvenli ayrıştırır.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Beklenmeyen bir hata oluştu.',
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined
    const fieldErrors = extractFieldErrors(data?.errors)
    if (fieldErrors.length > 0) return fieldErrors.join(' ')
    if (data?.detail) return data.detail
    if (data?.title) return data.title
    if (data?.message) return data.message
    if (error.code === 'ERR_NETWORK') return 'Sunucuya ulaşılamıyor.'
    if (error.message) return error.message
  }
  return fallback
}
