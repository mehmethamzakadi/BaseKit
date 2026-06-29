import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { tokenStorage } from '@/features/auth/tokenStorage'
import type { TokenResponse } from '@/types/auth'

/** Tüm API çağrıları için ortak axios örneği. */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
})

// --- İstek interceptor'ı: access token'ı ekle ---
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- 401 oturumu sonlandığında çağrılacak kanca ---
// (AuthContext kayıt olur; döngüsel bağımlılığı önlemek için callback ile.)
let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorized = callback
}

// --- Tek-uçuşlu (single-flight) refresh: eşzamanlı 401'ler tek yenileme yapar ---
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) return null

  try {
    // Interceptor döngüsünü önlemek için çıplak axios kullanılır.
    const { data } = await axios.post<TokenResponse>(
      `${env.apiUrl}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    )
    tokenStorage.setTokens(data)
    return data.accessToken
  } catch {
    tokenStorage.clear()
    return null
  }
}

// --- Yanıt interceptor'ı: 401'de access token'ı yenileyip isteği tekrarla ---
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    const status = error.response?.status
    const shouldRefresh =
      status === 401 &&
      original != null &&
      original._retry !== true &&
      tokenStorage.getRefreshToken() !== null &&
      original.url?.endsWith('/auth/refresh') !== true

    if (shouldRefresh && original) {
      original._retry = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })

      const newToken = await refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      }

      // Yenileme başarısız → oturum düştü.
      onUnauthorized?.()
    }

    return Promise.reject(error)
  },
)
